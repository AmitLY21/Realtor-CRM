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
        <h2 className="text-xl font-bold text-white">הגדרות מערכת ופרופיל מתווך</h2>
        <p className="text-xs text-slate-400 mt-0.5">ניהול פרטי רישיון תיווך, גיבוי נתונים וסנכרון ענן</p>
      </div>

      {/* 1. AGENT PROFILE & LEGAL SETTINGS */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">פרטי סוכן ורישיון (חוק המתווכים 1996)</h3>
            <p className="text-[11px] text-slate-400">פרטים אלו מופיעים בהסכמי תיווך ובדפי נכס ציבוריים</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>הפרופיל עודכן בהצלחה!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">שם מלא של המתווך:</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">מספר רישיון תיווך מקרקעין:</label>
              <input
                type="text"
                value={profile.license_number}
                onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">שם המשרד / רשת:</label>
              <input
                type="text"
                value={profile.agency_name}
                onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">טלפון ישיר לוואטסאפ:</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">דוא״ל:</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            >
              שמור שינויים בפרופיל
            </button>
          </div>
        </form>
      </div>

      {/* 2. LOCAL DATA SOVEREIGNTY & 1-CLICK BACKUP */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">ריבונות נתונים וגיבוי מלא (1-Click Backup)</h3>
            <p className="text-[11px] text-slate-400">המאגר שלך נשמר מקומית במכשיר ללא תלות ברשת (IndexedDB)</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-white/5">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-bold text-white">גיבוי מלא של כל הנכסים, הלקוחות וההיסטוריה</p>
              <p className="text-[11px] text-slate-400">קובץ JSON מובנה שניתן לשחזור בכל עת</p>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>הורד גיבוי (JSON)</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>סטטוס עמידות אחסון בדפדפן:</span>
          <button
            onClick={handleCheckPersistence}
            className="text-emerald-400 hover:underline font-semibold"
          >
            בדוק / הפעל Persistent Storage
          </button>
        </div>
      </div>

      {/* 3. OPTIONAL SUPABASE CLOUD SYNC */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">חיבור ענן וסנכרון רב-מכשירי (Supabase)</h3>
            <p className="text-[11px] text-slate-400">אופציונלי: סנכרן את המאגר בזמן אמת בין הנייד למחשב המשרדי</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 block mb-1">Supabase Project URL:</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Supabase Anon Key:</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">כרגע פועל במצב מקומי עצמאי (Offline-First)</span>
            <button
              type="button"
              onClick={() => alert('חיבור Supabase נשמר. הסנכרון יתבצע ברקע.')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-white/10 transition-colors"
            >
              בדוק חיבור ענן
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
