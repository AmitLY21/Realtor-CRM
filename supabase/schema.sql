-- ==============================================================================
-- Realtor-CRM: Supabase Postgres Schema & Realtime Setup
-- ==============================================================================
-- Run this script in your Supabase Project SQL Editor:
-- https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new
-- ==============================================================================

-- 1. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active',
  transaction_type TEXT NOT NULL DEFAULT 'sale',
  is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
  exclusive_until DATE,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL,
  house_number TEXT,
  apartment_number TEXT,
  rooms NUMERIC NOT NULL DEFAULT 0,
  floor INTEGER NOT NULL DEFAULT 0,
  total_floors INTEGER NOT NULL DEFAULT 0,
  sqm NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  price_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  maintenance_fee NUMERIC,
  vacancy_date DATE,
  has_mamad BOOLEAN NOT NULL DEFAULT FALSE,
  has_elevator BOOLEAN NOT NULL DEFAULT FALSE,
  has_balcony BOOLEAN NOT NULL DEFAULT FALSE,
  has_storage BOOLEAN NOT NULL DEFAULT FALSE,
  parking_type TEXT NOT NULL DEFAULT 'none',
  parking_legal TEXT NOT NULL DEFAULT 'street_only',
  public_slug TEXT NOT NULL DEFAULT '',
  hide_exact_address BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  photos JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city_neighborhood ON public.properties(city, neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type ON public.properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  transaction_type TEXT NOT NULL DEFAULT 'sale',
  source TEXT NOT NULL DEFAULT 'direct',
  stage TEXT NOT NULL DEFAULT 'new_lead',
  max_budget NUMERIC NOT NULL DEFAULT 0,
  target_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_neighborhoods JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_rooms NUMERIC NOT NULL DEFAULT 0,
  preferred_floors JSONB NOT NULL DEFAULT '[]'::jsonb,
  require_mamad BOOLEAN NOT NULL DEFAULT FALSE,
  require_elevator BOOLEAN NOT NULL DEFAULT FALSE,
  require_balcony BOOLEAN NOT NULL DEFAULT FALSE,
  require_storage BOOLEAN NOT NULL DEFAULT FALSE,
  require_parking BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_parking_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_contact_date TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  commission_agreed TEXT,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_transaction_type ON public.leads(transaction_type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 3. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  property_id TEXT,
  reminder_type TEXT NOT NULL DEFAULT 'followup_call',
  scheduled_time TIMESTAMPTZ NOT NULL,
  alert_offset_min INTEGER NOT NULL DEFAULT 60,
  heskem_status TEXT NOT NULL DEFAULT 'not_needed',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON public.reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON public.reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_reminders_lead_id ON public.reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_property_id ON public.reminders(property_id);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- 6. INCOMING LISTINGS TABLE (WhatsApp integration)
CREATE TABLE IF NOT EXISTS public.incoming_listings (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  sender_phone TEXT,
  sender_name TEXT,
  group_title TEXT NOT NULL DEFAULT '',
  received_at BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parsed_draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicate_of_property_id TEXT,
  duplicate_of_property_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incoming_listings_status ON public.incoming_listings(status);
CREATE INDEX IF NOT EXISTS idx_incoming_listings_received_at ON public.incoming_listings(received_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_listings ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all client connections using the public/publishable key
DROP POLICY IF EXISTS "Public full access on properties" ON public.properties;
CREATE POLICY "Public full access on properties" ON public.properties
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on leads" ON public.leads;
CREATE POLICY "Public full access on leads" ON public.leads
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on reminders" ON public.reminders;
CREATE POLICY "Public full access on reminders" ON public.reminders
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on settings" ON public.settings;
CREATE POLICY "Public full access on settings" ON public.settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on notifications" ON public.notifications;
CREATE POLICY "Public full access on notifications" ON public.notifications
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on incoming_listings" ON public.incoming_listings;
CREATE POLICY "Public full access on incoming_listings" ON public.incoming_listings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant access on tables and schema to anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.properties TO anon, authenticated;
GRANT ALL ON TABLE public.leads TO anon, authenticated;
GRANT ALL ON TABLE public.reminders TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.notifications TO anon, authenticated;
GRANT ALL ON TABLE public.incoming_listings TO anon, authenticated;

-- ==============================================================================
-- REALTIME REPLICATION (Allows instant syncing across devices)
-- ==============================================================================
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
