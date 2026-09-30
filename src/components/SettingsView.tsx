import React, { useState, useEffect } from 'react'
import { AgentProfile } from '../types'
import { db, exportFullDatabase, clearAllDataToCleanSlate } from '../lib/db'
import { ensureStoragePersistence } from '../lib/imageCompressor'
import { 
  Shield, 
  Database, 
  Cloud, 
  Download, 
  HardDrive, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Wifi,
  AlertCircle,
  Loader2,
  UploadCloud,
  DownloadCloud,
  Copy,
  ExternalLink,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import { 
  subscribeSyncState, 
  pushAllToSupabase, 
  pullAllFromSupabase, 
  checkSupabaseTables, 
  type SyncState 
} from '../lib/supabaseSync'

interface SettingsViewProps {
  agentProfile: AgentProfile
  onUpdateAgentProfile: (profile: AgentProfile) => void
  onOpenOnboardingTour?: () => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  agentProfile,
  onUpdateAgentProfile,
  onOpenOnboardingTour
}) => {
  const [profile, setProfile] = useState<AgentProfile>(agentProfile)

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPersisted, setIsPersisted] = useState(true)
  const [isTestingCloud, setIsTestingCloud] = useState(false)
  const [cloudTestResult, setCloudTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: 'טרם נבדק',
    missingTables: [],
    lastSyncedAt: null
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [showSqlSnippet, setShowSqlSnippet] = useState(false)

  useEffect(() => {
    const unsub = subscribeSyncState(setSyncState)
    checkSupabaseTables()
    return () => unsub()
  }, [])

  const handlePushAll = async () => {
    setIsSyncing(true)
    const res = await pushAllToSupabase()
    alert(res.message)
    setIsSyncing(false)
  }

  const handlePullAll = async () => {
    setIsSyncing(true)
    const res = await pullAllFromSupabase()
    alert(res.message)
    setIsSyncing(false)
  }

  const handleCopySql = () => {
    const sql = `-- Realtor-CRM Supabase Schema
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new

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

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access on properties" ON public.properties;
CREATE POLICY "Public full access on properties" ON public.properties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on leads" ON public.leads;
CREATE POLICY "Public full access on leads" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on reminders" ON public.reminders;
CREATE POLICY "Public full access on reminders" ON public.reminders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on settings" ON public.settings;
CREATE POLICY "Public full access on settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on notifications" ON public.notifications;
CREATE POLICY "Public full access on notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access on incoming_listings" ON public.incoming_listings;
CREATE POLICY "Public full access on incoming_listings" ON public.incoming_listings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'properties') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reminders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'settings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'incoming_listings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incoming_listings;
  END IF;
END $$;
`
    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 3000)
  }

  const handleTestCloudConnection = async () => {
    setIsTestingCloud(true)
    setCloudTestResult(null)
    try {
      const { error } = await supabase.auth.getSession()
      if (error) throw error
      setCloudTestResult({
        success: true,
        message: 'החיבור ל-Supabase תקין ופעיל! המערכת מקושרת לענן.'
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בבדיקת החיבור'
      setCloudTestResult({
        success: false,
        message: `שגיאה בחיבור לענן: ${msg}`
      })
    } finally {
      setIsTestingCloud(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    await db.settings.put({ key: 'agent_profile', value: profile })
    onUpdateAgentProfile(profile)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  const handleExportBackup = async () => {
    const jsonStr = await exportFullDatabase()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `realtor_crm_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCheckPersistence = async () => {
    const ok = await ensureStoragePersistence()
    setIsPersisted(ok)
    alert(ok ? 'שטח האחסון המקומי שמור באופן קבוע בדפדפן (Persistent Storage)' : 'דפדפן זה אינו מאפשר שמירה קבועה.')
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-24 md:pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">הגדרות מערכת ופרופיל מתווך</h2>
        <p className="text-xs text-slate-500 mt-1">ניהול פרטי רישיון תיווך, גיבוי נתונים וסנכרון ענן</p>
      </div>

      {/* 1. AGENT PROFILE & LEGAL SETTINGS */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">פרטי סוכן ורישיון (חוק המתווכים 1996)</h3>
              <p className="text-xs text-slate-500">פרטים אלו מופיעים בהסכמי תיווך ובדפי נכס ציבוריים</p>
            </div>
          </div>

          {onOpenOnboardingTour && (
            <button
              type="button"
              onClick={onOpenOnboardingTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
            >
              <Sparkles className="size-3.5" />
              <span>הפעל סיור מודרך מחדש</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>הפרופיל עודכן בהצלחה!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 block mb-1 font-medium">שם מלא של המתווך:</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-medium">מספר רישיון תיווך מקרקעין:</label>
              <input
                type="text"
                value={profile.license_number}
                onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 block mb-1 font-medium">שם המשרד / רשת:</label>
              <input
                type="text"
                value={profile.agency_name}
                onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-medium">טלפון ישיר לוואטסאפ:</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">דוא״ל:</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              שמור שינויים בפרופיל
            </button>
          </div>
        </form>
      </div>

      {/* 2. LOCAL DATA SOVEREIGNTY & 1-CLICK BACKUP */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Database className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">ריבונות נתונים וגיבוי מלא (1-Click Backup)</h3>
            <p className="text-xs text-slate-500">המאגר שלך נשמר מקומית במכשיר ללא תלות ברשת (IndexedDB)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <HardDrive className="size-5 text-slate-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900">גיבוי מלא של כל הנכסים, הלקוחות וההיסטוריה</p>
              <p className="text-[11px] text-slate-500">קובץ JSON מובנה שניתן לשחזור בכל עת</p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-xs transition-colors shrink-0"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>הורד גיבוי (JSON)</span>
          </button>
        </div>

        {/* Clean Slate vs Demo Data Controls */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">איפוס לוח חלק (Clean Slate) מול נתוני דוגמה</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                רוצה להתחיל להזין נכסים ולקוחות אמיתיים? רוקן את נתוני הדוגמה לקבלת מאגר נקי לחלוטין.
                המאגר עובד מקומית ב-100% ללא צורך ב-Supabase או חיבור אינטרנט.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('האם אתה בטוח שברצונך לרוקן את כל נתוני הדוגמה ולהתחיל מאגר ריק לחלוטין?')) {
                  await clearAllDataToCleanSlate()
                  setStatusMessage('המאגר רוקן בהצלחה! כעת תוכל להזין נכסים ולקוחות אמיתיים.')
                  setTimeout(() => setStatusMessage(null), 4000)
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span>רוקן מאגר והתחל מאפס (Clean Slate)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await pullAllFromSupabase()
                setStatusMessage(res.message)
                setTimeout(() => setStatusMessage(null), 4000)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
            >
              <RefreshCw className="size-3.5 text-slate-500" />
              <span>משוך מחדש נתונים מהענן (Supabase Pull)</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>סטטוס עמידות אחסון בדפדפן:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${isPersisted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isPersisted ? 'שמירה קבועה פעילה (Persistent)' : 'אחסון רגיל (Standard)'}
            </span>
          </div>
          <button
            onClick={handleCheckPersistence}
            className="text-blue-600 hover:underline font-medium"
          >
            בדוק / הפעל Persistent Storage
          </button>
        </div>
      </div>

      {/* 3. WHATSAPP WEB COMPANION EXTENSION */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">תוסף כרום לוואטסאפ (WhatsApp Web Companion)</h3>
              <p className="text-xs text-slate-500">קליטה וסנכרון אוטומטי של מודעות נכסים מקבוצות וואטסאפ ללא סיכון חסימה</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${import.meta.env.BASE_URL}realtor-crm-whatsapp-companion.zip`}
              download="realtor-crm-whatsapp-companion.zip"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="size-4" />
              <span>הורד תוסף כרום (ZIP)</span>
            </a>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3 text-xs leading-relaxed text-slate-700">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <Sparkles className="size-4 text-emerald-600" />
            <span>הוראות התקנה בדפדפן (Chrome / Edge Installation Guide):</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">1</span>
                <span>הורדה וחילוץ (Unzip)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                לחץ על כפתור <strong>"הורד תוסף (ZIP)"</strong> ושמור את הקובץ. חלץ את תוכן ה-ZIP לתיקייה נוחה במחשב שלך (למשל בתיקיית ההורדות או המסמכים).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">2</span>
                <span>טעינה ב-Extensions</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                גש אל <code className="bg-slate-100 px-1 rounded text-slate-800 font-mono">chrome://extensions/</code> בדפדפן, הפעל את מתג <strong>"Developer mode"</strong> בפינה העליונה, ולחץ על <strong>"Load unpacked"</strong> לבחירת התיקייה שחולצה.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">3</span>
                <span>סנכרון מוואטסאפ</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                פתח את{' '}
                <a
                  href="https://web.whatsapp.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-semibold hover:text-emerald-800 inline-flex items-center gap-0.5"
                >
                  WhatsApp Web <ExternalLink className="size-2.5" />
                </a>{' '}
                בכל קבוצת נדל״ן, לחץ על הכפתור הירוק <strong>"סנכרן ל-CRM"</strong> בראש הצ׳אט. הודעות נכסים יועברו אוטומטית!
              </p>
            </div>
          </div>
        </div>

        {/* Deduplication & Price Drop Protection Info */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-950">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>מנגנון מניעת כפילויות חכם וזיהוי ירידות מחיר (Smart Deduplication)</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            • <strong>איחוד פרסומים חוזרים:</strong> כאשר נכס מפורסם במספר קבוצות וואטסאפ שונות, המערכת מאחדת אותו לכרטיס בודד ומציגה את כמות הקבוצות שבהן הוא הופיע.
            <br />
            • <strong>זיהוי ירידות מחיר:</strong> אם מודעה מכילה מחיר נמוך יותר מנכס קיים במאגר שלך, המערכת תתריע על ירידת מחיר ותאפשר עדכון בלחיצת כפתור אחת.
          </p>
        </div>
      </div>

      {/* 4. SUPABASE CLOUD SYNC */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Cloud className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">חיבור ענן וסנכרון (Supabase)</h3>
              <p className="text-xs text-slate-500">סנכרון נתונים בזמן אמת וגיבוי מאובטח בענן</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              מוגדר ומחובר למערכת
            </span>
            {syncState.status === 'ready' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                מסונכרן בענן
              </span>
            ) : syncState.status === 'missing_tables' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="size-3.5 text-amber-600" />
                ממתין להקמת טבלאות
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                <RefreshCw className="size-3.5 text-slate-500 animate-spin" />
                בודק סנכרון...
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Cloud Connection Endpoint & Test */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">כתובת פרויקט בענן:</span>
              <span className="font-mono text-slate-800 text-xs font-medium">
                {import.meta.env.VITE_SUPABASE_URL || 'https://dunrichoqemqmursclxt.supabase.co'}
              </span>
            </div>

            <button
              type="button"
              disabled={isTestingCloud}
              onClick={handleTestCloudConnection}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
            >
              {isTestingCloud ? (
                <>
                  <Loader2 className="size-3.5 text-blue-600 animate-spin" />
                  <span>בודק חיבור...</span>
                </>
              ) : (
                <>
                  <Wifi className="size-3.5 text-slate-600" />
                  <span>בדוק חיבור ענן</span>
                </>
              )}
            </button>
          </div>

          {cloudTestResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                cloudTestResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {cloudTestResult.success ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="size-4 text-red-600 shrink-0" />
              )}
              <span>{cloudTestResult.message}</span>
            </div>
          )}

          {/* Missing Tables Notice & 1-Click SQL Setup */}
          {syncState.status === 'missing_tables' && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-xs text-amber-950">
                    טבלאות המערכת טרם נוצרו ב-Supabase
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    המערכת מחוברת לפרויקט, אך טבלאות הנתונים (properties, leads, reminders, settings, notifications, incoming_listings) טרם הוקמו במסד הנתונים.
                    יש להריץ את סקריפט ה-SQL פעם אחת בלוח הבקרה של Supabase.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      <span>הועתק ללוח!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>העתק סקריפט SQL (schema.sql)</span>
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-medium text-xs shadow-xs transition-colors"
                >
                  <ExternalLink className="size-3.5 text-slate-500" />
                  <span>פתח את עורך ה-SQL ב-Supabase</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await checkSupabaseTables()
                    if (res.ok) alert('מצוין! כל הטבלאות נוצרו בהצלחה.')
                    else alert(`עדיין חסרות טבלאות: ${res.missing.join(', ')}`)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
                >
                  <RefreshCw className="size-3.5 text-slate-500" />
                  <span>בדוק שוב האם הטבלאות נוצרו</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlSnippet(!showSqlSnippet)}
                  className="text-xs text-amber-900 underline hover:text-amber-950 font-medium px-1"
                >
                  {showSqlSnippet ? 'הסתר תצוגת SQL' : 'הצג תצוגת SQL מקדימה'}
                </button>
              </div>

              {showSqlSnippet && (
                <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] max-h-48 overflow-y-auto ltr text-left dir-ltr">
                  <pre>
{`-- סקריפט מלא שמור גם בקובץ supabase/schema.sql בפרויקט
CREATE TABLE IF NOT EXISTS public.properties (...);
CREATE TABLE IF NOT EXISTS public.leads (...);
CREATE TABLE IF NOT EXISTS public.reminders (...);
CREATE TABLE IF NOT EXISTS public.settings (...);
CREATE TABLE IF NOT EXISTS public.notifications (...);
CREATE TABLE IF NOT EXISTS public.incoming_listings (...);`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Sync Actions (Available when tables are ready or for manual sync) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-slate-900">פעולות סנכרון ידניות</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  כל שינוי מקומי (הוספה/עריכה/מחיקה) נשלח אוטומטית לענן. ניתן גם לסנכרן ידנית בבת אחת.
                </p>
              </div>

              {syncState.lastSyncedAt && (
                <span className="text-[11px] text-slate-500">
                  סנכרון אחרון: {new Date(syncState.lastSyncedAt).toLocaleTimeString('he-IL')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePushAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                <UploadCloud className="size-3.5" />
                <span>סנכרן את כל הנתונים המקומיים לענן (Push)</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={handlePullAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
              >
                <DownloadCloud className="size-3.5 text-slate-600" />
                <span>משוך נתונים מהענן למכשיר (Pull)</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            פרטי ההתחברות ל-Supabase מנוהלים בצורה מאובטחת דרך קובץ ההגדרות (.env), והסנכרון מתבצע ישירות ברקע ללא תלות ברשת.
          </p>
        </div>
      </div>
    </div>
  )
}
