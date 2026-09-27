import React, { useState } from 'react'
import { Property, TransactionType } from '../types'
import { formatILS } from '../lib/utils'
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Share2, 
  Printer, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingDown, 
  Check, 
  Copy, 
  ExternalLink,
  ShieldCheck,
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
      prop.has_mamad ? '🛡️ ממ״ד' : null,
      prop.has_elevator ? '🛗 מעלית' : null,
      prop.has_balcony ? '🌅 מרפסת שמש' : null,
      prop.has_storage ? '📦 מחסן' : null,
      prop.parking_type !== 'none' ? `🚗 חניה (${prop.parking_legal === 'tabu' ? 'בטאבו' : 'משותפת'})` : null,
    ].filter(Boolean).join(' | ')

    const text = `🏡 *נכס חדש ובלעדי ${prop.transaction_type === 'sale' ? 'למכירה' : 'להשכרה'}!*
📍 מיקום: ${addressStr}
📐 פרטים: ${prop.rooms} חדרים | קומה ${prop.floor} מתוך ${prop.total_floors} | כ-${prop.sqm} מ״ר
✨ יתרונות: ${amenities}
💰 מחיר מבוקש: ${formatILS(prop.price)}${prop.transaction_type === 'rent' ? '/חודש' : ''}
${prop.vacancy_date ? `🔑 פינוי: ${prop.vacancy_date}` : '🔑 פינוי מיידי / גמיש'}

לפרטים נוספים ותיאום ביקור בנכס מוזמנים לחזור אליי בוואטסאפ!`

    navigator.clipboard.writeText(text)
    setCopiedId(prop.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Top Controls: Search & Primary Filter Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10 self-start">
          <button
            onClick={() => setTxTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            כל הנכסים ({properties.length})
          </button>
          <button
            onClick={() => setTxTypeFilter('sale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'sale' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            מכירה ({properties.filter(p => p.transaction_type === 'sale').length})
          </button>
          <button
            onClick={() => setTxTypeFilter('rent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'rent' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            השכרה ({properties.filter(p => p.transaction_type === 'rent').length})
          </button>
        </div>

        {/* Quick Ingest Button */}
        <button
          onClick={onOpenSmartPaste}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>הדבקה וקליטה מוואטסאפ</span>
        </button>
      </div>

      {/* Search Bar & Quick Amenities Filter Chips */}
      <div className="glass-card rounded-2xl p-3.5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי רחוב, שכונה, עיר או הערות..."
            className="w-full pl-4 pr-9 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> סינון:
          </span>
          <button
            onClick={() => setFilterMamadOnly(!filterMamadOnly)}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              filterMamadOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            🛡️ רק עם ממ״ד
          </button>
          <button
            onClick={() => setFilterParkingOnly(!filterParkingOnly)}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              filterParkingOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            🚗 רק עם חניה
          </button>
          <button
            onClick={() => setFilterExclusiveOnly(!filterExclusiveOnly)}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              filterExclusiveOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            ⭐ בלעדיות בלבד
          </button>
        </div>
      </div>

      {/* Property Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-white">לא נמצאו נכסים התואמים את הסינון</p>
          <p className="text-xs mt-1">נסה לשנות את מונחי החיפוש או הדבק נכס חדש.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => {
            const matchCount = matchesMap[prop.id] || 0
            const hasPriceDrop = prop.price_history && prop.price_history.length > 1

            return (
              <div
                key={prop.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group"
                onClick={() => onSelectProperty(prop)}
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt={prop.street}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <Home className="w-10 h-10 mb-1" />
                        <span className="text-[10px]">אין תמונות</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md ${
                        prop.transaction_type === 'sale' ? 'bg-indigo-600' : 'bg-teal-600'
                      }`}>
                        {prop.transaction_type === 'sale' ? 'למכירה' : 'להשכרה'}
                      </span>
                      {prop.is_exclusive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                          בלעדיות
                        </span>
                      )}
                    </div>

                    {/* Bottom Photo Overlay Info: Price */}
                    <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">
                            {formatILS(prop.price)}
                          </span>
                          {prop.transaction_type === 'rent' && (
                            <span className="text-xs text-slate-300">/חודש</span>
                          )}
                        </div>

                        {hasPriceDrop && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-500/30 mt-0.5 w-fit">
                            <TrendingDown className="w-3 h-3" />
                            <span>ירידת מחיר!</span>
                          </div>
                        )}
                      </div>

                      {/* Anti-Poaching Indicator */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleAntiPoach(prop.id, prop.hide_exact_address)
                        }}
                        className={`p-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all ${
                          prop.hide_exact_address
                            ? 'bg-amber-500/30 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900/60 border-white/20 text-slate-300'
                        }`}
                        title={prop.hide_exact_address ? 'כתובת מדויקת מוסתרת בדף שיתוף' : 'כתובת מלאה גלויה'}
                      >
                        {prop.hide_exact_address ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Property Details Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {prop.hide_exact_address ? (
                          <span>{prop.street} (מס׳ מוסתר), {prop.neighborhood || prop.city}</span>
                        ) : (
                          <span>{prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}</span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {prop.rooms} חדרים • קומה {prop.floor} מתוך {prop.total_floors} • {prop.sqm} מ״ר
                      </p>
                    </div>

                    {/* Amenity Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {prop.has_mamad && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          ממ״ד
                        </span>
                      )}
                      {prop.has_elevator && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          מעלית
                        </span>
                      )}
                      {prop.has_balcony && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                          מרפסת
                        </span>
                      )}
                      {prop.parking_type !== 'none' && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 font-medium">
                          חניה ({prop.parking_legal === 'tabu' ? 'טאבו' : 'משותפת'})
                        </span>
                      )}
                    </div>

                    {/* Matching Clients Pill */}
                    {matchCount > 0 && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
                        <span className="flex items-center gap-1 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {matchCount} לקוחות מתאימים במערכת
                        </span>
                        <span className="text-[10px] text-amber-400 underline">הצג</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 border-t border-white/5 bg-slate-950/40 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Copy WhatsApp Snippet */}
                    <button
                      onClick={(e) => handleCopyWhatsAppSnippet(e, prop)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="העתק טקסט מעוצב לוואטסאפ"
                    >
                      {copiedId === prop.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Printable PDF Sheet */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPrintSheet(prop)
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="דף נכס מעוצב להדפסה / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Public Mini-Page Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPublicPreview(prop)
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="תצוגת דף נכס ללקוח"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Update Price button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdatePrice(prop)
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
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
