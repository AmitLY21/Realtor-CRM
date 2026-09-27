import React from 'react'
import { Property, Lead, Reminder, MatchScore } from '../types'
import { formatILS } from '../lib/utils'
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Building2, 
  Users, 
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
  onOpenSmartPaste?: () => void
  onOpenNewLead?: () => void
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
  onNavigateToMatches,
  onOpenSmartPaste,
  onOpenNewLead
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
      {/* Clean KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="ui-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">נכסים פעילים</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{activePropsCount}</span>
            <span className="text-xs text-slate-500">במאגר</span>
          </div>
        </div>

        <div className="ui-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">לקוחות בחיפוש</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{activeLeadsCount}</span>
            <span className="text-xs text-slate-500">פעילים</span>
          </div>
        </div>

        <div 
          className="ui-card rounded-xl p-4 cursor-pointer hover:border-blue-300"
          onClick={onNavigateToMatches}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">התאמות חמות (85%+)</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">{hotMatches.length}</span>
            <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
              צפה <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="ui-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">עסקאות שנסגרו</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{closedDealsCount}</span>
            <span className="text-xs text-slate-500">הושלמו</span>
          </div>
        </div>
      </div>

      {/* Clean Slate Onboarding Welcome Card */}
      {activePropsCount === 0 && activeLeadsCount === 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">המאגר שלך מוכן במצב לוח חלק (Clean Slate)!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              הנתונים נשמרים מקומית במכשיר שלך (IndexedDB) לחלוטין ללא צורך בענן.
              התחל לקלוט נכסים ולקוחות אמיתיים ישירות למערכת:
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenSmartPaste && (
              <button
                onClick={onOpenSmartPaste}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>הדבק נכס ראשון מוואטסאפ (Smart Paste)</span>
              </button>
            )}
            {onOpenNewLead && (
              <button
                onClick={onOpenNewLead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>הוסף לקוח ראשון למשפך</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* EXCLUSIVITY RADAR (T-14) - Minimalist & Clean */}
      {expiringExclusivities.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ראדאר בלעדיות (מסתיים תוך 14 יום!)</h3>
                <p className="text-xs text-slate-600">נכסים הדורשים פנייה לבעלים לחידוש או התאמת מחיר</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white text-amber-800 border border-amber-200">
              {expiringExclusivities.length} נכסים
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {expiringExclusivities.map(prop => {
              const expDate = new Date(prop.exclusive_until!)
              const daysLeft = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              return (
                <div key={prop.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-3 border border-amber-200/80 shadow-xs">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {prop.street} {prop.house_number}, {prop.neighborhood || prop.city}
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      נותרו {daysLeft} ימים לבלעדיות ({prop.exclusive_until})
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">{formatILS(prop.price)}</p>
                  </div>
                  <button
                    onClick={() => handleWhatsAppChat(
                      prop.notes.match(/05\d-?\d{7}/)?.[0] || '050-0000000',
                      `היי, כאן המתווך לגבי הנכס ב${prop.street} ${prop.house_number || ''}. תקופת הבלעדיות עומדת להסתיים בעוד ${daysLeft} ימים. אשמח שנתאם שיחת עדכון להארכה.`
                    )}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
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
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">סיורים ומשימות להיום</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {todayReminders.length} פגישות פתוחות
          </span>
        </div>

        {todayReminders.length === 0 ? (
          <div className="ui-card rounded-xl p-6 text-center text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">כל הפגישות להיום הושלמו</p>
            <p className="text-xs mt-0.5 text-slate-500">אין סיורים או מעקבים ממתינים כרגע.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayReminders.map(rem => {
              const lead = leads.find(l => l.id === rem.lead_id)
              const property = properties.find(p => p.id === rem.property_id)
              const timeStr = new Date(rem.scheduled_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

              return (
                <div key={rem.id} className="ui-card rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info & Time */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex flex-col items-center justify-center min-w-12 border border-slate-200">
                      <Clock className="w-3.5 h-3.5 mb-0.5 text-slate-500" />
                      <span>{timeStr}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {lead ? lead.full_name : 'לקוח לסיור'}
                        </span>
                        {property && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {property.street} {property.house_number}, {property.city}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1">{rem.notes}</p>

                      {/* HESKEM TIVUCH STATUS */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          הסכם תיווך כחוק:
                        </span>

                        {rem.heskem_status === 'signed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> חתום ומאושר
                          </span>
                        ) : rem.heskem_status === 'sent_for_signature' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            נשלח לחתימה
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            טרם נחתם
                          </span>
                        )}

                        {/* Status Switcher Buttons */}
                        <div className="inline-flex rounded-md bg-slate-100 p-0.5 border border-slate-200 text-[10px]">
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'signed')}
                            className={`px-2 py-0.5 rounded font-medium ${rem.heskem_status === 'signed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            חתום
                          </button>
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'sent_for_signature')}
                            className={`px-2 py-0.5 rounded font-medium ${rem.heskem_status === 'sent_for_signature' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            נשלח
                          </button>
                          <button
                            onClick={() => onUpdateHeskemStatus(rem.id, 'draft')}
                            className={`px-2 py-0.5 rounded font-medium ${rem.heskem_status === 'draft' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            טרם נחתם
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Phone & WhatsApp & Complete */}
                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    {lead && (
                      <>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs"
                          title="חיוג ללקוח"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleWhatsAppChat(
                            lead.phone,
                            `היי ${lead.full_name}, תזכורת לפגישתנו היום בשעה ${timeStr}${property ? ` בנכס ב${property.street} ${property.house_number || ''}` : ''}. נתראה!`
                          )}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>וואטסאפ</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onUpdateReminderStatus(rem.id, true)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="סמן כהושלם"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* HOT MATCHES (85%+) */}
      {hotMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">התאמות מובילות (85%+)</h3>
            </div>
            <button
              onClick={onNavigateToMatches}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
            >
              <span>לכל ההתאמות</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotMatches.slice(0, 4).map(match => (
              <div
                key={`${match.property.id}-${match.lead.id}`}
                className="ui-card rounded-xl p-4 hover:border-blue-400 cursor-pointer"
                onClick={() => onSelectProperty(match.property)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {match.score}% התאמה
                      </span>
                      <span className="text-xs text-slate-500">
                        {match.property.rooms} חד׳ ב{match.property.neighborhood || match.property.city}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                      {match.lead.full_name} ⟵ {match.property.street} {match.property.house_number || ''}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>תקציב: {formatILS(match.lead.max_budget)}</span>
                      <span>•</span>
                      <span>מחיר: {formatILS(match.property.price)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleWhatsAppChat(
                        match.lead.phone,
                        `היי ${match.lead.full_name}, מצאתי נכס שמתאים בדיוק לבקשה שלך ב${match.property.neighborhood || match.property.city} (${match.property.rooms} חדרים עם ממ״ד ומעלית). מתי נוח לך לראות?`
                      )
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex-shrink-0 shadow-xs"
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
