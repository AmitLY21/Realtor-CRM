import React, { useState } from 'react'
import { MatchScore, TransactionType } from '../types'
import { formatILS } from '../lib/utils'
import { 
  Sparkles, 
  Flame, 
  MessageSquare, 
  Phone, 
  Filter, 
  ArrowLeft, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

interface MatchesViewProps {
  matches: MatchScore[]
  onSelectProperty: (property: any) => void
  onSelectLead: (lead: any) => void
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  onSelectProperty,
  onSelectLead
}) => {
  const [minScoreFilter, setMinScoreFilter] = useState<number>(85) // Default to 85% Hot Matches!
  const [txFilter, setTxFilter] = useState<'all' | TransactionType>('all')

  const filteredMatches = matches.filter(m => {
    if (m.isDisqualified) return false
    if (m.score < minScoreFilter) return false
    if (txFilter !== 'all' && m.property.transaction_type !== txFilter) return false
    return true
  }).sort((a, b) => b.score - a.score)

  const handleWhatsAppPitch = (match: MatchScore) => {
    const lead = match.lead
    const prop = match.property
    const cleanDigits = lead.phone.replace(/\D/g, '')
    const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits

    const text = `היי ${lead.full_name}, מה שלומך?
עלה אצלי למאגר נכס חדש שמתאים ב-${match.score}% לדרישות שלך!

📍 *מיקום:* ${prop.hide_exact_address ? `${prop.neighborhood || prop.city} (סמוך ל${prop.street})` : `${prop.street} ${prop.house_number || ''}, ${prop.neighborhood || prop.city}`}
📐 *פרטים:* ${prop.rooms} חדרים, קומה ${prop.floor} מתוך ${prop.total_floors}, כ-${prop.sqm} מ״ר
🛡️ *יתרונות:* ${prop.has_mamad ? 'ממ״ד | ' : ''}${prop.has_elevator ? 'מעלית | ' : ''}${prop.parking_type !== 'none' ? 'חניה | ' : ''}${prop.has_balcony ? 'מרפסת שמש' : ''}
💰 *מחיר מבוקש:* ${formatILS(prop.price)}${prop.transaction_type === 'rent' ? '/חודש' : ''}

מתי נוח לך שנקפוץ לראות אותו?`

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">מנוע התאמות חכם (Smart Matching Engine)</h2>
              <p className="text-xs text-slate-400">הצלבה דו-כיוונית בזמן אמת של דרישות לקוח מול מאגר הנכסים</p>
            </div>
          </div>
        </div>

        {/* Score Threshold & Transaction Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Threshold Switcher */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setMinScoreFilter(85)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                minScoreFilter === 85 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>התאמות חמות (85%+)</span>
            </button>
            <button
              onClick={() => setMinScoreFilter(70)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                minScoreFilter === 70 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              פוטנציאל (70%+)
            </button>
            <button
              onClick={() => setMinScoreFilter(50)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                minScoreFilter === 50 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              הכל (50%+)
            </button>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-white">לא נמצאו התאמות ברף ציון זה</p>
          <p className="text-xs mt-1">נסה להוריד את רף ההתאמה או להוסיף נכסים ולקוחות חדשים.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => {
            const prop = match.property
            const lead = match.lead
            const isHot = match.score >= 85

            return (
              <div 
                key={`${prop.id}-${lead.id}`}
                className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all ${
                  isHot ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Score Pill & Summary */}
                  <div className="flex items-center gap-3">
                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-black ${
                      isHot 
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30' 
                        : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <span className="text-xl leading-none">{match.score}%</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold mt-1">התאמה</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-white">{lead.full_name}</span>
                        <span className="text-slate-400">⟵ מול ⟶</span>
                        <span className="text-base font-bold text-white">
                          {prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>תקציב לקוח: <strong className="text-white">{formatILS(lead.max_budget)}</strong></span>
                        <span>•</span>
                        <span>מחיר נכס: <strong className="text-emerald-400">{formatILS(prop.price)}</strong></span>
                        {prop.price > lead.max_budget && (
                          <span className="text-amber-400 text-[11px]">(חריגה קלה של {Math.round(((prop.price - lead.max_budget) / lead.max_budget) * 100)}% - ניתן למו״מ!)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pitch Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => handleWhatsAppPitch(match)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>שלח הצעה מותאמת בוואטסאפ</span>
                    </button>
                  </div>
                </div>

                {/* Score Breakdown Bar */}
                <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">תקציב ומחיר:</span>
                    <span className="font-bold text-emerald-400">{match.breakdown.priceScore} / 35 נק׳</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">חדרים וגודל:</span>
                    <span className="font-bold text-indigo-400">{match.breakdown.roomsScore} / 25 נק׳</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">קומה ומעלית:</span>
                    <span className="font-bold text-cyan-400">{match.breakdown.floorScore} / 15 נק׳</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">חניה וטאבו:</span>
                    <span className="font-bold text-amber-400">{match.breakdown.parkingScore} / 15 נק׳</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
