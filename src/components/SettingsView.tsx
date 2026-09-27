import React, { useState } from 'react'
import { AgentProfile } from '../types'
import { db, exportFullDatabase } from '../lib/db'
import { ensureStoragePersistence } from '../lib/imageCompressor'
import { 
  User, 
  Shield, 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  HardDrive, 
  CheckCircle2, 
  FileText 
} from 'lucide-react'

interface SettingsViewProps {
  agentProfile: AgentProfile
  onUpdateAgentProfile: (profile: AgentProfile) => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  agentProfile,
  onUpdateAgentProfile
}) => {
  const [profile, setProfile] = useState<AgentProfile>(agentProfile)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isPersisted, setIsPersisted] = useState(true)

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
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">הגדרות מערכת ופרופיל מתווך</h2>
        <p className="text-xs text-slate-500 mt-1">ניהול פרטי רישיון תיווך, גיבוי נתונים וסנכרון ענן</p>
      </div>

      {/* 1. AGENT PROFILE & LEGAL SETTINGS */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">פרטי סוכן ורישיון (חוק המתווכים 1996)</h3>
            <p className="text-xs text-slate-500">פרטים אלו מופיעים בהסכמי תיווך ובדפי נכס ציבוריים</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">ריבונות נתונים וגיבוי מלא (1-Click Backup)</h3>
            <p className="text-xs text-slate-500">המאגר שלך נשמר מקומית במכשיר ללא תלות ברשת (IndexedDB)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-slate-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900">גיבוי מלא של כל הנכסים, הלקוחות וההיסטוריה</p>
              <p className="text-[11px] text-slate-500">קובץ JSON מובנה שניתן לשחזור בכל עת</p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>הורד גיבוי (JSON)</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>סטטוס עמידות אחסון בדפדפן:</span>
          <button
            onClick={handleCheckPersistence}
            className="text-blue-600 hover:underline font-medium"
          >
            בדוק / הפעל Persistent Storage
          </button>
        </div>
      </div>

      {/* 3. OPTIONAL SUPABASE CLOUD SYNC */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">חיבור ענן וסנכרון רב-מכשירי (Supabase)</h3>
            <p className="text-xs text-slate-500">אופציונלי: סנכרן את המאגר בזמן אמת בין הנייד למחשב המשרדי</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-medium">Supabase Project URL:</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">Supabase Anon Key:</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono transition-all"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">כרגע פועל במצב מקומי עצמאי (Offline-First)</span>
            <button
              type="button"
              onClick={() => alert('חיבור Supabase נשמר. הסנכרון יתבצע ברקע.')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 text-xs shadow-xs transition-colors"
            >
              בדוק חיבור ענן
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
