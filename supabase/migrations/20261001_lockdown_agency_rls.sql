-- ==============================================================================
-- STEP 4 (FINAL LOCKDOWN): STRICT PER-AGENCY ROW LEVEL SECURITY
-- ==============================================================================
-- Run this script in your Supabase SQL Editor AFTER you and your teammates have 
-- created accounts using the "התחבר לצוות" button in the app:
-- https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new
--
-- What this does:
-- 1. Revokes all open 'anon' write policies.
-- 2. Restricts properties, leads, reminders, and incoming listings strictly
--    to authenticated agents belonging to the same agency (via agency_members).
-- 3. Retains anonymous read-only access ONLY for active properties with public_slug.
-- ==============================================================================

-- Helper function: Get current user's agency
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

-- Drop transition policies
DROP POLICY IF EXISTS "Agency full access on properties" ON public.properties;
DROP POLICY IF EXISTS "Agency full access on leads" ON public.leads;
DROP POLICY IF EXISTS "Agency full access on reminders" ON public.reminders;
DROP POLICY IF EXISTS "Agency full access on settings" ON public.settings;
DROP POLICY IF EXISTS "Agency full access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Agency full access on incoming_listings" ON public.incoming_listings;
DROP POLICY IF EXISTS "Anon public landing view on active properties" ON public.properties;

-- 1. PROPERTIES
CREATE POLICY "Agency authenticated full access on properties" ON public.properties
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());

CREATE POLICY "Anon public view on active properties" ON public.properties
  FOR SELECT TO anon
  USING (status = 'active' AND public_slug IS NOT NULL AND public_slug != '');

-- 2. LEADS
CREATE POLICY "Agency authenticated full access on leads" ON public.leads
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());

-- 3. REMINDERS
CREATE POLICY "Agency authenticated full access on reminders" ON public.reminders
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());

-- 4. SETTINGS
CREATE POLICY "Agency authenticated full access on settings" ON public.settings
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());

-- 5. NOTIFICATIONS
CREATE POLICY "Agency authenticated full access on notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());

-- 6. INCOMING LISTINGS
CREATE POLICY "Agency authenticated full access on incoming_listings" ON public.incoming_listings
  FOR ALL TO authenticated
  USING (agency_id = public.get_current_agency_id())
  WITH CHECK (agency_id = public.get_current_agency_id());
