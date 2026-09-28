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
  Home,
  MessageSquare,
  Pencil
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PropertiesViewProps {
  properties: Property[]
  onOpenSmartPaste: () => void
  onSelectProperty: (property: Property) => void
  onOpenPublicPreview: (property: Property) => void
  onOpenPrintSheet: (property: Property) => void
  onToggleAntiPoach: (propertyId: string, currentVal: boolean) => void
  onUpdatePrice: (property: Property) => void
  onEditProperty: (property: Property) => void
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
  onEditProperty,
  matchesMap
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all')
  const [filterMamadOnly, setFilterMamadOnly] = useState(false)
  const [filterParkingOnly, setFilterParkingOnly] = useState(false)
  const [filterExclusiveOnly, setFilterExclusiveOnly] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

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

  const getPropertyTypeName = (type: string) => {
    switch (type) {
      case 'apartment': return 'דירה'
      case 'garden_apartment': return 'דירת גן'
      case 'penthouse': return 'פנטהאוז'
      case 'detached': return 'בית פרטי / קוטג׳'
      case 'duplex': return 'דופלקס'
      case 'commercial': return 'מסחרי'
      default: return 'נכס'
    }
  }

  return (
    <div className="space-y-4 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Top Header & Integrated Command Bar */}
      <div className="ui-panel rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4 bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Title & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">מאגר נכסים</h2>
                <p className="text-[11px] text-slate-500">ניהול, שיתוף והתאמות נכסים בזמן אמת</p>
              </div>
            </div>

            {/* Segmented Filter Switcher */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 mr-auto sm:mr-4">
              <button
                onClick={() => setTxTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txTypeFilter === 'all' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                כל הנכסים ({properties.length})
              </button>
              <button
                onClick={() => setTxTypeFilter('sale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txTypeFilter === 'sale' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                מכירה ({properties.filter(p => p.transaction_type === 'sale').length})
              </button>
              <button
                onClick={() => setTxTypeFilter('rent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  txTypeFilter === 'rent' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                השכרה ({properties.filter(p => p.transaction_type === 'rent').length})
              </button>
            </div>
          </div>

          {/* Quick Ingest Button */}
          <button
            onClick={onOpenSmartPaste}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-100" />
            <span>קליטה מהירה מוואטסאפ</span>
          </button>
        </div>

        {/* Search Bar & Filter Chips in One Unified Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש מהיר לפי רחוב, שכונה, עיר או תוכן הודעה..."
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                נקה
              </button>
            )}
          </div>

          {/* Quick Toggle Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs flex-shrink-0">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 ml-1">
              <Filter className="w-3 h-3 text-slate-400" /> סינון:
            </span>
            <button
              onClick={() => setFilterMamadOnly(!filterMamadOnly)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterMamadOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${filterMamadOnly ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>ממ״ד בלבד</span>
            </button>
            <button
              onClick={() => setFilterParkingOnly(!filterParkingOnly)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterParkingOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Car className={`w-3.5 h-3.5 ${filterParkingOnly ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>חניה בלבד</span>
            </button>
            <button
              onClick={() => setFilterExclusiveOnly(!filterExclusiveOnly)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                filterExclusiveOnly
                  ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              בלעדיות בלבד
            </button>
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {filtered.length === 0 ? (
        <div className="ui-card rounded-2xl p-12 text-center text-slate-500 bg-white border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">לא נמצאו נכסים התואמים את החיפוש</p>
          <p className="text-xs mt-1 text-slate-500">נסה לשנות את מונחי החיפוש או הוסף נכס חדש למאגר.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 items-stretch">
          {filtered.map(prop => {
            const matchCount = matchesMap[prop.id] || 0
            const hasPriceDrop = prop.price_history && prop.price_history.length > 1
            const hasPhoto = prop.photos && prop.photos.length > 0 && prop.photos[0]

            return (
              <div
                key={prop.id}
                className="ui-card rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer group bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-150 h-full"
                onClick={() => onSelectProperty(prop)}
              >
                <div>
                  {/* Top Photo / Architectural Presentation Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-100 select-none">
                    {hasPhoto ? (
                      <div className="relative w-full h-full bg-slate-900">
                        <img
                          src={prop.photos[0]}
                          alt={prop.street}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/10" />
                      </div>
                    ) : (
                      /* High-End Architectural Gradient Fallback */
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="absolute -left-6 -bottom-6 opacity-10 text-white pointer-events-none">
                          <Building2 className="w-32 h-32" />
                        </div>
                        <div className="flex items-center justify-between z-10">
                          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-blue-400" />
                            {getPropertyTypeName(prop.property_type)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {prop.sqm > 0 ? `${prop.sqm} מ״ר` : ''}
                          </span>
                        </div>
                        <div className="z-10">
                          <p className="text-sm font-semibold text-white truncate drop-shadow-xs">
                            {prop.street} {prop.house_number || ''}
                          </p>
                          <p className="text-[11px] text-slate-300">
                            {prop.neighborhood || prop.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Transaction & Exclusivity Badges (Top-Right in RTL) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap z-20">
                      <Badge variant={prop.transaction_type === 'sale' ? 'default' : 'success'} className="shadow-xs backdrop-blur-md">
                        {prop.transaction_type === 'sale' ? 'מכירה' : 'השכרה'}
                      </Badge>
                      {prop.is_exclusive && (
                        <Badge variant="accent" className="bg-white/95 text-blue-700 shadow-xs backdrop-blur-md border border-blue-200/80">
                          בלעדיות
                        </Badge>
                      )}
                    </div>

                    {/* Anti-Poaching Control (Top-Left in RTL) */}
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleAntiPoach(prop.id, prop.hide_exact_address)
                        }}
                        className={`p-1.5 rounded-lg text-xs font-medium backdrop-blur-md border shadow-xs transition-all cursor-pointer ${
                          prop.hide_exact_address
                            ? 'bg-slate-900/80 border-slate-700 text-amber-300 hover:bg-slate-900'
                            : 'bg-white/85 border-white/40 text-slate-700 hover:bg-white'
                        }`}
                        title={prop.hide_exact_address ? 'כתובת מדויקת מוסתרת בדף שיתוף (מוגן)' : 'כתובת מלאה גלויה לכולם'}
                      >
                        {prop.hide_exact_address ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Property Details Body */}
                  <div className="p-4 flex flex-col gap-3">
                    {/* Primary Anchor: Price & Status */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold text-slate-900 tracking-tight font-sans tabular-nums">
                            {formatILS(prop.price)}
                          </span>
                          {prop.transaction_type === 'rent' && (
                            <span className="text-xs text-slate-500 font-normal">/חודש</span>
                          )}
                        </div>

                        {hasPriceDrop && (
                          <Badge variant="success" className="gap-1">
                            <TrendingDown className="size-3" />
                            <span>ירידת מחיר</span>
                          </Badge>
                        )}
                      </div>

                      {/* Address & Neighborhood */}
                      <h4 className="text-sm font-semibold text-slate-800 truncate" title={`${prop.street} ${prop.house_number || ''}, ${prop.city}`}>
                        {prop.hide_exact_address ? (
                          <span>{prop.street} (מס׳ מוסתר), {prop.neighborhood || prop.city}</span>
                        ) : (
                          <span>{prop.street} {prop.house_number || ''}, {prop.neighborhood || prop.city}</span>
                        )}
                      </h4>
                    </div>

                    {/* Balanced Dimension Specs Strip */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">חדרים</span>
                        <span className="text-xs font-semibold text-slate-800">{prop.rooms} חד׳</span>
                      </div>
                      <div className="border-r border-slate-200/60 pr-2">
                        <span className="text-[10px] text-slate-400 block font-medium">קומה</span>
                        <span className="text-xs font-semibold text-slate-800">{prop.floor} מתוך {prop.total_floors}</span>
                      </div>
                      <div className="border-r border-slate-200/60 pr-2">
                        <span className="text-[10px] text-slate-400 block font-medium">שטח</span>
                        <span className="text-xs font-semibold text-slate-800">{prop.sqm > 0 ? `${prop.sqm} מ״ר` : '—'}</span>
                      </div>
                    </div>

                    {/* Amenities Strip - Subtle & Clean */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      {prop.has_mamad && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200/60">
                          ממ״ד
                        </Badge>
                      )}
                      {prop.has_elevator && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200/60">
                          מעלית
                        </Badge>
                      )}
                      {prop.has_balcony && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200/60">
                          מרפסת
                        </Badge>
                      )}
                      {prop.parking_type !== 'none' && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200/60">
                          חניה ({prop.parking_legal === 'tabu' ? 'טאבו' : 'משותפת'})
                        </Badge>
                      )}
                    </div>

                    {/* Matching Clients Pill */}
                    {matchCount > 0 && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-between text-xs text-blue-800">
                        <span className="flex items-center gap-1.5 font-medium text-[11px]">
                          <Sparkles className="size-3 text-blue-600 shrink-0" />
                          <span>{matchCount} לקוחות מתאימים במערכת</span>
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">הצג</span>
                      </div>
                    )}

                    {/* Full WhatsApp Message / Property Notes */}
                    {prop.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                            <MessageSquare className="size-3 text-slate-500" />
                            <span>הודעת מקור מוואטסאפ:</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(prop.notes)
                              setCopiedNoteId(prop.id)
                              setTimeout(() => setCopiedNoteId(null), 2000)
                            }}
                            className="text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="העתק תוכן הודעה מלא"
                          >
                            {copiedNoteId === prop.id ? 'הועתק!' : 'העתק'}
                          </button>
                        </div>
                        <p 
                          className={`text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap cursor-text select-text ${
                            expandedNotes[prop.id] ? '' : 'line-clamp-2'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prop.notes}
                        </p>
                        {prop.notes.length > 70 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedNotes(prev => ({ ...prev, [prop.id]: !prev[prop.id] }))
                            }}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer self-start"
                          >
                            {expandedNotes[prop.id] ? 'הצג פחות ▲' : 'קרא את כל ההודעה ▼'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer: Clean Structured Actions */}
                <div className="px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                  {/* Share & Export Tools Group */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopyWhatsAppSnippet(e, prop)}
                      className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                      title="העתק טקסט מעוצב לוואטסאפ"
                    >
                      {copiedId === prop.id ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPrintSheet(prop)
                      }}
                      className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                      title="דף נכס להדפסה / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPublicPreview(prop)
                      }}
                      className="h-8 w-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                      title="תצוגת דף נכס ללקוח"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Modification Actions Group */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdatePrice(prop)
                      }}
                      className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer shadow-2xs flex items-center"
                    >
                      עדכן מחיר
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditProperty(prop)
                      }}
                      className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="ערוך את כל פרטי הנכס וההודעה המקורית"
                    >
                      <Pencil className="w-3 h-3 text-blue-100" />
                      <span>ערוך נכס</span>
                    </button>
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
