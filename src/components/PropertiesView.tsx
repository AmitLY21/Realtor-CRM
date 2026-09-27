import React, { useState } from 'react'
import { Property, TransactionType } from '../types'
import { formatILS } from '../lib/utils'
import { 
  Building2, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingDown, 
  Check, 
  Copy, 
  ExternalLink,
  Shield,
  Car,
  Home
} from 'lucide-react'

interface PropertiesViewProps {
  properties: Property[]
  onOpenSmartPaste: () => void
  onSelectProperty: (property: Property) => void
  onOpenPublicPreview: (property: Property) => void
  onOpenPrintSheet: (property: Property) => void
  onToggleAntiPoach: (propertyId: string, currentVal: boolean) => void
  onUpdatePrice: (property: Property) => void
  matchesMap: Record<string, number> // propertyId -> count of matching leads
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onOpenSmartPaste,
  onSelectProperty,
  onOpenPublicPreview,
  onOpenPrintSheet,
  onToggleAntiPoach,
  onUpdatePrice,
  matchesMap
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all')
  const [filterMamadOnly, setFilterMamadOnly] = useState(false)
  const [filterParkingOnly, setFilterParkingOnly] = useState(false)
  const [filterExclusiveOnly, setFilterExclusiveOnly] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filter properties
  const filtered = properties.filter(p => {
    if (txTypeFilter !== 'all' && p.transaction_type !== txTypeFilter) return false
    if (filterMamadOnly && !p.has_mamad) return false
    if (filterParkingOnly && p.parking_type === 'none') return false
    if (filterExclusiveOnly && !p.is_exclusive) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.street.toLowerCase().includes(q) ||
      p.neighborhood.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    )
  })

  const handleCopyWhatsAppSnippet = (e: React.MouseEvent, prop: Property) => {
    e.stopPropagation()
    const addressStr = prop.hide_exact_address 
      ? `${prop.city}, ${prop.neighborhood || prop.street} (מיקום מרכזי)`
      : `${prop.street} ${prop.house_number || ''}, ${prop.city}`

    const amenities = [
      prop.has_mamad ? 'ממ״ד' : null,
      prop.has_elevator ? 'מעלית' : null,
      prop.has_balcony ? 'מרפסת שמש' : null,
      prop.has_storage ? 'מחסן' : null,
      prop.parking_type !== 'none' ? `חניה (${prop.parking_legal === 'tabu' ? 'בטאבו' : 'משותפת'})` : null,
    ].filter(Boolean).join(' • ')

    const text = `נכס חדש ${prop.transaction_type === 'sale' ? 'למכירה' : 'להשכרה'}:
מיקום: ${addressStr}
פרטים: ${prop.rooms} חדרים | קומה ${prop.floor} מתוך ${prop.total_floors} | כ-${prop.sqm} מ״ר
מאפיינים: ${amenities}
מחיר מבוקש: ${formatILS(prop.price)}${prop.transaction_type === 'rent' ? '/חודש' : ''}
${prop.vacancy_date ? `פינוי: ${prop.vacancy_date}` : 'פינוי: מיידי / גמיש'}

לפרטים נוספים ותיאום ביקור בנכס מוזמנים ליצור קשר.`

    navigator.clipboard.writeText(text)
    setCopiedId(prop.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4 pb-24 md:pb-12">
      {/* Top Controls: Search & Primary Filter Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 self-start">
          <button
            onClick={() => setTxTypeFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            כל הנכסים ({properties.length})
          </button>
          <button
            onClick={() => setTxTypeFilter('sale')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'sale' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            מכירה ({properties.filter(p => p.transaction_type === 'sale').length})
          </button>
          <button
            onClick={() => setTxTypeFilter('rent')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'rent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            השכרה ({properties.filter(p => p.transaction_type === 'rent').length})
          </button>
        </div>

        {/* Quick Ingest Button */}
        <button
          onClick={onOpenSmartPaste}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>קליטה מהירה מוואטסאפ</span>
        </button>
      </div>

      {/* Search Bar & Clean Filter Chips */}
      <div className="ui-panel rounded-xl p-3 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי רחוב, שכונה, עיר או הערות..."
            className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Filter Chips - Clean & Minimal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
            <Filter className="w-3 h-3" /> סינון:
          </span>
          <button
            onClick={() => setFilterMamadOnly(!filterMamadOnly)}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors flex items-center gap-1 ${
              filterMamadOnly
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-3 h-3 text-slate-500" />
            <span>ממ״ד בלבד</span>
          </button>
          <button
            onClick={() => setFilterParkingOnly(!filterParkingOnly)}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors flex items-center gap-1 ${
              filterParkingOnly
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Car className="w-3 h-3 text-slate-500" />
            <span>חניה בלבד</span>
          </button>
          <button
            onClick={() => setFilterExclusiveOnly(!filterExclusiveOnly)}
            className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
              filterExclusiveOnly
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            בלעדיות בלבד
          </button>
        </div>
      </div>

      {/* Property Cards Grid */}
      {filtered.length === 0 ? (
        <div className="ui-card rounded-xl p-10 text-center text-slate-500">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">לא נמצאו נכסים התואמים את החיפוש</p>
          <p className="text-xs mt-0.5 text-slate-500">נסה לשנות את מונחי החיפוש או הוסף נכס חדש.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map(prop => {
            const matchCount = matchesMap[prop.id] || 0
            const hasPriceDrop = prop.price_history && prop.price_history.length > 1

            return (
              <div
                key={prop.id}
                className="ui-card rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer group"
                onClick={() => onSelectProperty(prop)}
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt={prop.street}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Home className="w-8 h-8 mb-1" />
                        <span className="text-xs">אין תמונות</span>
                      </div>
                    )}

                    {/* Clean Top Badges */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-xs">
                        {prop.transaction_type === 'sale' ? 'מכירה' : 'השכרה'}
                      </span>
                      {prop.is_exclusive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                          בלעדיות
                        </span>
                      )}
                    </div>

                    {/* Anti-Poaching Indicator on photo */}
                    <div className="absolute bottom-2 left-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleAntiPoach(prop.id, prop.hide_exact_address)
                        }}
                        className={`p-1.5 rounded-md text-xs font-semibold backdrop-blur-sm border transition-colors ${
                          prop.hide_exact_address
                            ? 'bg-white/90 border-slate-300 text-amber-700'
                            : 'bg-white/80 border-slate-200 text-slate-600'
                        }`}
                        title={prop.hide_exact_address ? 'כתובת מדויקת מוסתרת בדף שיתוף' : 'כתובת מלאה גלויה'}
                      >
                        {prop.hide_exact_address ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Property Details Body */}
                  <div className="p-3.5 space-y-2.5">
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {prop.hide_exact_address ? (
                            <span>{prop.street} (מס׳ מוסתר), {prop.neighborhood || prop.city}</span>
                          ) : (
                            <span>{prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}</span>
                          )}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-slate-900">
                          {formatILS(prop.price)}
                        </span>
                        {prop.transaction_type === 'rent' && (
                          <span className="text-xs text-slate-500">/חודש</span>
                        )}
                        {hasPriceDrop && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <TrendingDown className="w-3 h-3" />
                            <span>ירידת מחיר</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {prop.rooms} חדרים • קומה {prop.floor} מתוך {prop.total_floors} • {prop.sqm} מ״ר
                      </p>
                    </div>

                    {/* Amenity Badges - Minimal Grayscale */}
                    <div className="flex items-center gap-1 flex-wrap text-[11px]">
                      {prop.has_mamad && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          ממ״ד
                        </span>
                      )}
                      {prop.has_elevator && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          מעלית
                        </span>
                      )}
                      {prop.has_balcony && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          מרפסת
                        </span>
                      )}
                      {prop.parking_type !== 'none' && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          חניה ({prop.parking_legal === 'tabu' ? 'טאבו' : 'משותפת'})
                        </span>
                      )}
                    </div>

                    {/* Matching Clients Pill */}
                    {matchCount > 0 && (
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-between text-xs text-blue-700">
                        <span className="flex items-center gap-1 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          {matchCount} לקוחות מתאימים
                        </span>
                        <span className="text-[11px] underline">הצג</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Copy WhatsApp Snippet */}
                    <button
                      onClick={(e) => handleCopyWhatsAppSnippet(e, prop)}
                      className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="העתק טקסט מעוצב לוואטסאפ"
                    >
                      {copiedId === prop.id ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Printable PDF Sheet */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPrintSheet(prop)
                      }}
                      className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="דף נכס להדפסה / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Public Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPublicPreview(prop)
                      }}
                      className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="תצוגת דף נכס ללקוח"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdatePrice(prop)
                    }}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition-colors"
                  >
                    עדכן מחיר
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
