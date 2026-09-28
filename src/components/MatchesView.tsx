import React, { useState } from 'react'
import { MatchScore, TransactionType, Property, Lead } from '../types'
import { formatILS } from '../lib/utils'
import { 
  Sparkles, 
  MessageSquare
} from 'lucide-react'

interface MatchesViewProps {
  matches: MatchScore[]
  onSelectProperty: (property: Property) => void
  onSelectLead: (lead: Lead) => void
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
    <div className="flex flex-col gap-4 pb-24 md:pb-12">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">מנוע התאמות חכם (Smart Matching Engine)</h2>
              <p className="text-xs text-slate-500">הצלבה בזמן אמת של דרישות הלקוחות מול מאגר הנכסים</p>
            </div>
          </div>
        </div>

        {/* Filter Controls: Score Threshold & Transaction Type */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Transaction Type Filter */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setTxFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                txFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setTxFilter('sale')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                txFilter === 'sale'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              מכירה
            </button>
            <button
              onClick={() => setTxFilter('rent')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                txFilter === 'rent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              השכרה
            </button>
          </div>

          {/* Score Threshold */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
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
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="ui-card rounded-xl p-10 text-center text-slate-500">
          <Sparkles className="size-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">לא נמצאו התאמות ברף זה</p>
          <p className="text-xs mt-0.5 text-slate-500">נסה לבחור רף התאמה נמוך יותר או הוסף נכסים חדשים.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
                    <div className="flex flex-col items-center justify-center size-14 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold flex-shrink-0">
                      <span className="text-lg leading-none">{match.score}%</span>
                      <span className="text-[9px] font-semibold mt-0.5">התאמה</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectLead(lead)}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {lead.full_name}
                        </button>
                        <span className="text-slate-400">⟵ מול ⟶</span>
                        <button
                          type="button"
                          onClick={() => onSelectProperty(prop)}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-right"
                        >
                          {prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}
                        </button>
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
                      <MessageSquare className="size-3.5" />
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
