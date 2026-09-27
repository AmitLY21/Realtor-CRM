import React, { useState } from 'react'
import { MatchScore, TransactionType } from '../types'
import { formatILS } from '../lib/utils'
import { 
  Sparkles, 
  MessageSquare, 
  Building2, 
  Users, 
  ArrowLeft
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
  const [minScoreFilter, setMinScoreFilter] = useState<number>(85) // Default to 85% Hot Matches
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

מיקום: ${prop.hide_exact_address ? `${prop.neighborhood || prop.city} (סמוך ל${prop.street})` : `${prop.street} ${prop.house_number || ''}, ${prop.neighborhood || prop.city}`}
פרטים: ${prop.rooms} חדרים, קומה ${prop.floor} מתוך ${prop.total_floors}, כ-${prop.sqm} מ״ר
מאפיינים: ${prop.has_mamad ? 'ממ״ד • ' : ''}${prop.has_elevator ? 'מעלית • ' : ''}${prop.parking_type !== 'none' ? 'חניה • ' : ''}${prop.has_balcony ? 'מרפסת שמש' : ''}
מחיר מבוקש: ${formatILS(prop.price)}${prop.transaction_type === 'rent' ? '/חודש' : ''}

מתי נוח לך שנקפוץ לראות אותו?`

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-4 pb-24 md:pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">מנוע התאמות חכם (Smart Matching Engine)</h2>
              <p className="text-xs text-slate-500">הצלבה בזמן אמת של דרישות הלקוחות מול מאגר הנכסים</p>
            </div>
          </div>
        </div>

        {/* Score Threshold */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setMinScoreFilter(85)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              minScoreFilter === 85 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            התאמות חמות (85%+)
          </button>
          <button
            onClick={() => setMinScoreFilter(70)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              minScoreFilter === 70 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            פוטנציאל (70%+)
          </button>
          <button
            onClick={() => setMinScoreFilter(50)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              minScoreFilter === 50 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            הכל (50%+)
          </button>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="ui-card rounded-xl p-10 text-center text-slate-500">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">לא נמצאו התאמות ברף זה</p>
          <p className="text-xs mt-0.5 text-slate-500">נסה לבחור רף התאמה נמוך יותר או הוסף נכסים חדשים.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const prop = match.property
            const lead = match.lead

            return (
              <div 
                key={`${prop.id}-${lead.id}`}
                className="ui-card rounded-xl p-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Score Pill & Summary */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold flex-shrink-0">
                      <span className="text-lg leading-none">{match.score}%</span>
                      <span className="text-[9px] font-semibold mt-0.5">התאמה</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{lead.full_name}</span>
                        <span className="text-slate-400">⟵ מול ⟶</span>
                        <span className="text-sm font-bold text-slate-900">
                          {prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>תקציב: <strong className="text-slate-800">{formatILS(lead.max_budget)}</strong></span>
                        <span>•</span>
                        <span>מחיר נכס: <strong className="text-slate-800">{formatILS(prop.price)}</strong></span>
                        {prop.price > lead.max_budget && (
                          <span className="text-amber-700 text-[11px]">(חריגה קלה של {Math.round(((prop.price - lead.max_budget) / lead.max_budget) * 100)}%)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pitch Action Button */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => handleWhatsAppPitch(match)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>שלח הצעה מותאמת בוואטסאפ</span>
                    </button>
                  </div>
                </div>

                {/* Score Breakdown Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500">תקציב ומחיר:</span>
                    <span className="font-semibold text-slate-800">{match.breakdown.priceScore} / 35</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500">חדרים וגודל:</span>
                    <span className="font-semibold text-slate-800">{match.breakdown.roomsScore} / 25</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500">קומה:</span>
                    <span className="font-semibold text-slate-800">{match.breakdown.floorScore} / 15</span>
                  </div>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500">חניה:</span>
                    <span className="font-semibold text-slate-800">{match.breakdown.parkingScore} / 15</span>
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
