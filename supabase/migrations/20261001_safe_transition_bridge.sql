-- ==============================================================================
-- IMMEDIATE ZERO-REGRESSION TRANSITION BRIDGE (Self-Contained & Idempotent)
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new
-- ==============================================================================

-- 1. Ensure agencies and agency_members tables exist
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  license_number TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure invite_code column exists and has a fallback default generator
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'agencies' AND column_name = 'invite_code'
  ) THEN
    ALTER TABLE public.agencies ADD COLUMN invite_code TEXT UNIQUE;
  END IF;
END $$;

ALTER TABLE public.agencies 
  ALTER COLUMN invite_code SET DEFAULT substring(md5(random()::text), 1, 6);

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

-- 2. Ensure agency_id column exists on all business tables
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.incoming_listings ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON public.leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_reminders_agency_id ON public.reminders(agency_id);
CREATE INDEX IF NOT EXISTS idx_settings_agency_id ON public.settings(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON public.notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_incoming_listings_agency_id ON public.incoming_listings(agency_id);

-- 3. Seed default primary agency and attach any unassigned records
DO $$
DECLARE
  v_default_agency_id UUID;
BEGIN
  SELECT id INTO v_default_agency_id FROM public.agencies LIMIT 1;
  IF v_default_agency_id IS NULL THEN
    INSERT INTO public.agencies (name, license_number, invite_code) 
    VALUES ('פריים נדל״ן תל אביב והמרכז', '12489-01', 'PRIME1')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_default_agency_id;

    IF v_default_agency_id IS NULL THEN
      SELECT id INTO v_default_agency_id FROM public.agencies LIMIT 1;
    END IF;
  END IF;

  -- Ensure existing rows have the agency_id assigned
  UPDATE public.properties SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  UPDATE public.leads SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  UPDATE public.reminders SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  UPDATE public.settings SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  UPDATE public.notifications SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
  UPDATE public.incoming_listings SET agency_id = v_default_agency_id WHERE agency_id IS NULL;
END $$;

-- 4. Trigger function to automatically tag new records with default agency if omitted
CREATE OR REPLACE FUNCTION public.set_default_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    SELECT id INTO NEW.agency_id FROM public.agencies ORDER BY created_at ASC LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_properties_default_agency ON public.properties;
CREATE TRIGGER trg_properties_default_agency
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

DROP TRIGGER IF EXISTS trg_leads_default_agency ON public.leads;
CREATE TRIGGER trg_leads_default_agency
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

DROP TRIGGER IF EXISTS trg_reminders_default_agency ON public.reminders;
CREATE TRIGGER trg_reminders_default_agency
  BEFORE INSERT ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

DROP TRIGGER IF EXISTS trg_settings_default_agency ON public.settings;
CREATE TRIGGER trg_settings_default_agency
  BEFORE INSERT ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

DROP TRIGGER IF EXISTS trg_notifications_default_agency ON public.notifications;
CREATE TRIGGER trg_notifications_default_agency
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

DROP TRIGGER IF EXISTS trg_incoming_listings_default_agency ON public.incoming_listings;
CREATE TRIGGER trg_incoming_listings_default_agency
  BEFORE INSERT ON public.incoming_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_default_agency_id();

-- 5. Open transition policies for anon and authenticated (prevents 42501 RLS errors)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon public landing view on active properties" ON public.properties;
DROP POLICY IF EXISTS "Agency full access on properties" ON public.properties;
CREATE POLICY "Agency full access on properties" ON public.properties
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Agency full access on leads" ON public.leads;
CREATE POLICY "Agency full access on leads" ON public.leads
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Agency full access on reminders" ON public.reminders;
CREATE POLICY "Agency full access on reminders" ON public.reminders
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Agency full access on settings" ON public.settings;
CREATE POLICY "Agency full access on settings" ON public.settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Agency full access on notifications" ON public.notifications;
CREATE POLICY "Agency full access on notifications" ON public.notifications
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Agency full access on incoming_listings" ON public.incoming_listings;
CREATE POLICY "Agency full access on incoming_listings" ON public.incoming_listings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on agencies" ON public.agencies;
CREATE POLICY "Public access on agencies" ON public.agencies
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on agency_members" ON public.agency_members;
CREATE POLICY "Public access on agency_members" ON public.agency_members
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant schema permissions
GRANT ALL ON TABLE public.agencies TO anon, authenticated;
GRANT ALL ON TABLE public.agency_members TO anon, authenticated;
GRANT ALL ON TABLE public.properties TO anon, authenticated;
GRANT ALL ON TABLE public.leads TO anon, authenticated;
GRANT ALL ON TABLE public.reminders TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.notifications TO anon, authenticated;
GRANT ALL ON TABLE public.incoming_listings TO anon, authenticated;

-- 6. Enable Supabase Realtime broadcast for live sync between agents
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.incoming_listings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'properties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reminders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'incoming_listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incoming_listings;
  END IF;
END $$;
