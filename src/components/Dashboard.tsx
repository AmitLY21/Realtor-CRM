import React from 'react'
import { Property, Lead, Reminder, MatchScore } from '../types'
import { formatILS, formatPhone } from '../lib/utils'
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Flame, 
  FileText, 
  Building2, 
  Users, 
  Sparkles,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react'

interface DashboardProps {
  properties: Property[]
  leads: Lead[]
  reminders: Reminder[]
  hotMatches: MatchScore[]
  onSelectProperty: (property: Property) => void
  onSelectLead: (lead: Lead) => void
  onUpdateReminderStatus: (reminderId: string, isCompleted: boolean) => void
  onUpdateHeskemStatus: (reminderId: string, status: Reminder['heskem_status']) => void
  onNavigateToMatches: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  properties,
  leads,
  reminders,
  hotMatches,
  onSelectProperty,
  onSelectLead,
  onUpdateReminderStatus,
  onUpdateHeskemStatus,
  onNavigateToMatches
}) => {
  const today = new Date().toISOString().split('T')[0]

  // 1. Exclusivity Alerts (T-14 Days)
  const expiringExclusivities = properties.filter(p => {
    if (!p.is_exclusive || !p.exclusive_until) return false
    const expDate = new Date(p.exclusive_until)
    const now = new Date()
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    return diffDays >= 0 && diffDays <= 14
  })

  // 2. Today's Showings and Meetings
  const todayReminders = reminders.filter(r => {
    const remDate = r.scheduled_time.split('T')[0]
    return remDate === today && !r.is_completed
  })

  // 3. Quick Stats
  const activePropsCount = properties.filter(p => p.status === 'active').length
  const activeLeadsCount = leads.filter(l => l.stage !== 'closed_won' && l.stage !== 'closed_lost').length
  const closedDealsCount = leads.filter(l => l.stage === 'closed_won').length

  const handleWhatsAppChat = (phone: string, text: string) => {
    const cleanDigits = phone.replace(/\D/g, '')
    const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Welcome & KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">נכסים פעילים</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{activePropsCount}</span>
            <span className="text-[11px] text-emerald-400 font-medium">במאגר</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">לקוחות בחיפוש</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{activeLeadsCount}</span>
            <span className="text-[11px] text-indigo-400 font-medium">פעילים</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-slate-900/40 cursor-pointer" onClick={onNavigateToMatches}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">התאמות חמות (85%+)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-300">{hotMatches.length}</span>
            <span className="text-[11px] text-amber-400 flex items-center gap-0.5">
              צפה <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">עסקאות שנסגרו</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{closedDealsCount}</span>
            <span className="text-[11px] text-cyan-400 font-medium">בהצלחה 🎉</span>
          </div>
        </div>
      </div>

      {/* URGENT EXCLUSIVITY RADAR (T-14) */}
      {expiringExclusivities.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-900/60 p-4 sm:p-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">ראדאר בלעדיות (מסתיים תוך 14 יום!)</h3>
                <p className="text-xs text-slate-400">נכסים הדורשים פנייה דחופה לבעלים לחידוש או הורדת מחיר</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {expiringExclusivities.length} נכסים
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {expiringExclusivities.map(prop => {
              const expDate = new Date(prop.exclusive_until!)
              const daysLeft = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              return (
                <div key={prop.id} className="glass-panel rounded-xl p-3 flex items-center justify-between gap-3 border-amber-500/20">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {prop.street} {prop.house_number}, {prop.neighborhood || prop.city}
                    </p>
                    <p className="text-[11px] text-amber-300 font-medium mt-0.5">
                      נותרו {daysLeft} ימים לבלעדיות ({prop.exclusive_until})
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">{formatILS(prop.price)}</p>
                  </div>
                  <button
                    onClick={() => handleWhatsAppChat(
                      prop.notes.match(/05\d-?\d{7}/)?.[0] || '050-0000000',
                      `היי, כאן המתווך לגבי הנכס ב${prop.street} ${prop.house_number || ''}. תקופת הבלעדיות עומדת להסתיים בעוד ${daysLeft} ימים. אשמח שנתאם שיחת עדכון להארכה.`
                    )}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/30 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>פנה בוואטסאפ</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TODAY'S SHOWINGS & HESKEM TIVUCH GUARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">סיורים ומשימות להיום</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {todayReminders.length} פגישות פתוחות
          </span>
        </div>

        {todayReminders.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-slate-400 border-white/5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-white">כל הפגישות להיום טופלו בהצלחה!</p>
            <p className="text-xs mt-1">אין סיורים או מעקבים ממתינים לשעות הקרובות.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayReminders.map(rem => {
              const lead = leads.find(l => l.id === rem.lead_id)
              const property = properties.find(p => p.id === rem.property_id)
              const timeStr = new Date(rem.scheduled_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

              return (
                <div key={rem.id} className="glass-card rounded-2xl p-4 border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info & Time */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 font-bold text-xs flex flex-col items-center justify-center min-w-14">
                      <Clock className="w-4 h-4 mb-1" />
                      <span>{timeStr}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {lead ? lead.full_name : 'לקוח לסיור'}
                        </span>
                        {property && (
                          <span className="text-xs text-slate-300 font-medium">
                            • {property.street} {property.house_number}, {property.city}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1">{rem.notes}</p>

                      {/* HESKEM TIVUCH STATUS SELECTOR */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          הסכם תיווך כחוק:
                        </span>

                        {rem.heskem_status === 'signed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> חתום ומאושר
                          </span>
                        ) : rem.heskem_status === 'sent_for_signature' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            נשלח לחתימה
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                            ⚠️ טרם נחתם הסכם!
                          </span>
                        )}

                        {/* Quick Status Changers */}
                        <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-white/10 text-[10px]">
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'signed')}
                            className={`px-2 py-0.5 rounded ${rem.heskem_status === 'signed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            חתום
                          </button>
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'sent_for_signature')}
                            className={`px-2 py-0.5 rounded ${rem.heskem_status === 'sent_for_signature' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            נשלח
                          </button>
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'draft')}
                            className={`px-2 py-0.5 rounded ${rem.heskem_status === 'draft' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                            טרם נחתם
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Phone & WhatsApp & Complete */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {lead && (
                      <>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
                          title="חיוג ללקוח"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleWhatsAppChat(
                            lead.phone,
                            `היי ${lead.full_name}, תזכורת לפגישתנו היום בשעה ${timeStr}${property ? ` בנכס ב${property.street} ${property.house_number || ''}` : ''}. נתראה!`
                          )}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>וואטסאפ</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onUpdateReminderStatus(rem.id, true)}
                      className="p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
                      title="סמן כבוצע"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* HOT MATCHES SHOWCASE */}
      {hotMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">התאמות חמות שדורשות פנייה (85%+)</h3>
            </div>
            <button
              onClick={onNavigateToMatches}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>לכל ההתאמות</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotMatches.slice(0, 4).map(match => (
              <div
                key={`${match.property.id}-${match.lead.id}`}
                className="glass-card rounded-2xl p-4 border-amber-500/20 hover:border-amber-500/40 cursor-pointer"
                onClick={() => onSelectProperty(match.property)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {match.score}% התאמה
                      </span>
                      <span className="text-xs text-slate-400">
                        {match.property.rooms} חד׳ ב{match.property.neighborhood || match.property.city}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white mt-1.5 truncate">
                      {match.lead.full_name} ⟵ {match.property.street} {match.property.house_number || ''}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>תקציב: {formatILS(match.lead.max_budget)}</span>
                      <span>מחיר: {formatILS(match.property.price)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleWhatsAppChat(
                        match.lead.phone,
                        `היי ${match.lead.full_name}, מצאתי נכס פצצה שמתאים בדיוק לבקשה שלך ב${match.property.neighborhood || match.property.city} (${match.property.rooms} חדרים עם ממ״ד ומעלית). מתי נוח לך לראות?`
                      )
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex-shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>הצע בוואטסאפ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
