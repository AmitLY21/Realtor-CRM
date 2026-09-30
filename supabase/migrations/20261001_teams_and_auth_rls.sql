-- ==============================================================================
-- Realtor-CRM: Supabase Auth & Multi-Tenant Agency Teams Migration
-- ==============================================================================
-- Run this migration in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new
-- ==============================================================================

-- 1. AGENCIES / REAL ESTATE TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_number TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AGENCY MEMBERS (Maps auth.users to agencies)
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_user_id ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON public.agency_members(agency_id);

-- 3. HELPER FUNCTION: Get current authenticated user's agency
CREATE OR REPLACE FUNCTION public.get_current_agency_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id 
  FROM public.agency_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 4. ADD agency_id TO ALL BUSINESS TABLES (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_properties_agency_id ON public.properties(agency_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_leads_agency_id ON public.leads(agency_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_reminders_agency_id ON public.reminders(agency_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.settings ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_settings_agency_id ON public.settings(agency_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_notifications_agency_id ON public.notifications(agency_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'incoming_listings' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.incoming_listings ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
    CREATE INDEX idx_incoming_listings_agency_id ON public.incoming_listings(agency_id);
  END IF;
END $$;

-- 5. SEED DEFAULT AGENCY FOR EXISTING DATA MIGRATION
-- Creates a baseline agency so existing records without agency_id are preserved safely
DO $$
DECLARE
  v_default_agency_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agencies LIMIT 1) THEN
    INSERT INTO public.agencies (name, license_number) 
    VALUES ('פריים נדל״ן תל אביב והמרכז', '12489-01')
    RETURNING id INTO v_default_agency_id;

    -- Assign existing rows to default agency
    UPDATE public.properties SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
    UPDATE public.leads SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
    UPDATE public.reminders SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
    UPDATE public.settings SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
    UPDATE public.notifications SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
    UPDATE public.incoming_listings SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  END IF;
END $$;

-- 6. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- Revoke old insecure public full access policies
DROP POLICY IF EXISTS "Public full access on properties" ON public.properties;
DROP POLICY IF EXISTS "Public full access on leads" ON public.leads;
DROP POLICY IF EXISTS "Public full access on reminders" ON public.reminders;
DROP POLICY IF EXISTS "Public full access on settings" ON public.settings;
DROP POLICY IF EXISTS "Public full access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public full access on incoming_listings" ON public.incoming_listings;

-- Agencies table RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agency members can view their agency" ON public.agencies;
CREATE POLICY "Agency members can view their agency" ON public.agencies
  FOR SELECT TO authenticated
  USING (id = public.get_current_agency_id());

-- Agency members table RLS
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view agency teammates" ON public.agency_members;
CREATE POLICY "Members can view agency teammates" ON public.agency_members
  FOR SELECT TO authenticated
  USING (agency_id = public.get_current_agency_id());

-- Properties table RLS:
-- 1) Authenticated agents in the agency have full CRUD access
CREATE POLICY "Agency full access on properties" ON public.properties
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- 2) Anonymous users can only view active properties with public marketing slug
CREATE POLICY "Anon public landing view on active properties" ON public.properties
  FOR SELECT TO anon
  USING (status = 'active' AND public_slug IS NOT NULL AND public_slug != '');

-- Leads table RLS:
-- Strictly isolated to authenticated agency members
CREATE POLICY "Agency full access on leads" ON public.leads
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- Reminders table RLS
CREATE POLICY "Agency full access on reminders" ON public.reminders
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- Settings table RLS
CREATE POLICY "Agency full access on settings" ON public.settings
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- Notifications table RLS
CREATE POLICY "Agency full access on notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- Incoming listings table RLS
CREATE POLICY "Agency full access on incoming_listings" ON public.incoming_listings
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id() OR agency_id IS NULL)
  WITH CHECK (agency_id = public.get_current_agency_id() OR agency_id IS NULL);

-- Ensure replica identity is full for realtime diffs
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;
ALTER TABLE public.incoming_listings REPLICA IDENTITY FULL;
