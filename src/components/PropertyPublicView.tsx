import React, { useState } from 'react'
import { Property, AgentProfile } from '../types'
import { formatILS } from '../lib/utils'
import { 
  X, 
  Printer, 
  MessageSquare, 
  Share2, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  MapPin,
  Lock,
  Building2,
  Maximize2,
  Calendar,
  Layers,
  Shield,
  ArrowUpDown,
  Sun,
  Car,
  Package,
  Phone,
  FileText,
  Copy,
  Trash2,
  AlertTriangle
} from 'lucide-react'

interface PropertyPublicViewProps {
  property: Property | null
  agent: AgentProfile
  isOpen: boolean
  onClose: () => void
  isPrintMode?: boolean
  onDelete?: (propertyId: string) => void
}

export const PropertyPublicView: React.FC<PropertyPublicViewProps> = ({
  property,
  agent,
  isOpen,
  onClose,
  isPrintMode = false,
  onDelete
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedDescription, setCopiedDescription] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !property) return null

  const handlePrint = () => {
    window.print()
  }

  const handleShareLink = () => {
    const url = `${window.location.origin}/p/${property.public_slug}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleWhatsAppAgent = () => {
    const cleanDigits = agent.phone.replace(/\D/g, '')
    const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits
    const text = `שלום ${agent.name}, ראיתי את הנכס ב${property.neighborhood || property.city} (${property.rooms} חדרים, ${formatILS(property.price)}). אשמח לקבל פרטים נוספים ולתאם ביקור!`
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const addressDisplay = property.hide_exact_address
    ? `${property.city}, ${property.neighborhood || property.street}`
    : `${property.street} ${property.house_number || ''}, ${property.city}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:m-0 print:static print:block print:bg-transparent">
      <div className="print-page w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl lg:max-w-3xl sm:rounded-2xl bg-white text-slate-900 shadow-xl flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:rounded-none print:max-h-none print:h-auto">
        
        {/* Top Header Bar (Hidden on Print) */}
        <header className="no-print px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {isPrintMode ? 'תצוגת דף נכס להדפסה / PDF' : 'תצוגת לקוח ציבורית (קישור שיתוף)'}
            </span>
            {property.hide_exact_address && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>כתובת מוגנת</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShareLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                copiedLink 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="העתק קישור לדף ציבורי"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'הועתק' : 'העתק קישור'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-2xs cursor-pointer"
              title="הדפסה ושמירה כ-PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>הדפסה / PDF</span>
            </button>

            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                title="מחק נכס מהמאגר"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">מחק נכס</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="סגור תצוגה"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto flex-1 bg-white p-4 sm:p-6 space-y-5 pb-32 sm:pb-8 print:p-0 print:space-y-3 print:pb-0 print:overflow-visible">
          
          {/* Agent Branding Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center shrink-0">
                {agent.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-blue-600 block truncate">
                  {agent.agency_name}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {agent.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>רישיון תיווך מקרקעין: <strong className="font-semibold text-slate-700">{agent.license_number}</strong></span>
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <a
                href={`tel:${agent.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                dir="ltr"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{agent.phone}</span>
              </a>
            </div>
          </div>

          {/* Property Headline & Price (Balanced, no overlaps) */}
          <div className="space-y-2 pb-3 border-b border-slate-200">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${
                  property.transaction_type === 'sale'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {property.transaction_type === 'sale' ? 'למכירה' : 'להשכרה'}
                </span>
                {property.is_exclusive && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    בלעדיות
                  </span>
                )}
              </div>

              {/* Price display */}
              <div className="flex items-baseline gap-1.5" dir="rtl">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                  {formatILS(property.price)}
                </span>
                {property.transaction_type === 'rent' && (
                  <span className="text-xs font-normal text-slate-500">/ חודש</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 pt-0.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {addressDisplay}
                </h3>
                {property.hide_exact_address && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    (מיקום מרכזי • כתובת מדויקת תימסר בתיאום סיור ישיר מול המתווך)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Gallery Showcase */}
          {property.photos && property.photos.length > 0 && (
            <div className="space-y-2 print:space-y-0">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 print:aspect-auto print:h-[200px] print:max-h-[200px] print:rounded-lg">
                <img
                  src={property.photos[activePhotoIdx]}
                  alt="תמונת נכס ראשית"
                  className="w-full h-full object-cover"
                />

                {property.photos.length > 1 && (
                  <>
                    <div className="no-print absolute inset-0 flex items-center justify-between p-2.5 pointer-events-none">
                      <button
                        onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-xs pointer-events-auto transition-transform active:scale-95 cursor-pointer"
                        title="תמונה קודמת"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActivePhotoIdx((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 shadow-xs pointer-events-auto transition-transform active:scale-95 cursor-pointer"
                        title="תמונה הבאה"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="no-print absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-medium backdrop-blur-xs">
                      {activePhotoIdx + 1} / {property.photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Strip (Screen only) */}
              {property.photos.length > 1 && (
                <div className="no-print flex items-center gap-2 overflow-x-auto pb-1">
                  {property.photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activePhotoIdx === idx 
                          ? 'border-blue-600 opacity-100' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Property Description / Original WhatsApp Details (Prominently Placed) */}
          {property.notes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>תיאור הנכס המלא (מהודעת הוואטסאפ המקורית)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(property.notes)
                    setCopiedDescription(true)
                    setTimeout(() => setCopiedDescription(false), 2000)
                  }}
                  className="no-print text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  title="העתק תיאור נכס מלא"
                >
                  {copiedDescription ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">הועתק!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>העתק תיאור</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans shadow-2xs select-text print:p-2.5 print:text-xs print:rounded-lg">
                {property.notes}
              </div>
            </div>
          )}

          {/* Structured Specifications Matrix */}
          <div className="space-y-3 print:space-y-2">
            <h4 className="text-xs font-semibold text-slate-600 print:text-[11px]">
              מפרט ופרטי הנכס
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs print:gap-2 print:text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 print:p-2 print:rounded-lg">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 print:p-1.5">
                  <Building2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium print:text-[10px]">מספר חדרים:</span>
                  <span className="text-sm font-semibold text-slate-900 print:text-xs">{property.rooms} חדרים</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 print:p-2 print:rounded-lg">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 print:p-1.5">
                  <Layers className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium print:text-[10px]">קומה בבניין:</span>
                  <span className="text-sm font-semibold text-slate-900 print:text-xs">קומה {property.floor} מתוך {property.total_floors}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 print:p-2 print:rounded-lg">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 print:p-1.5">
                  <Maximize2 className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium print:text-[10px]">שטח בנוי:</span>
                  <span className="text-sm font-semibold text-slate-900 print:text-xs">{property.sqm} מ״ר</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 print:p-2 print:rounded-lg">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 print:p-1.5">
                  <Calendar className="w-4 h-4 print:w-3.5 print:h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium print:text-[10px]">תאריך כניסה:</span>
                  <span className="text-sm font-semibold text-slate-900 print:text-xs">{property.vacancy_date || 'מיידי / גמיש'}</span>
                </div>
              </div>
            </div>

            {/* Feature Badges with Icons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {property.has_mamad && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>מרחב מוגן דירתי (ממ״ד)</span>
                </span>
              )}
              {property.has_elevator && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>מעלית בבניין</span>
                </span>
              )}
              {property.has_balcony && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <Sun className="w-3.5 h-3.5 text-blue-600" />
                  <span>מרפסת שמש</span>
                </span>
              )}
              {property.parking_type !== 'none' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  <span>חניה ({property.parking_legal === 'tabu' ? 'בטאבו' : 'משותפת'})</span>
                </span>
              )}
              {property.has_storage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>מחסן פרטי</span>
                </span>
              )}
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed space-y-1 print:p-2 print:text-[10px] print:rounded-lg">
            <p className="font-semibold text-slate-700">הבהרה משפטית (חוק המתווכים במקרקעין):</p>
            <p>
              כל הפרטים המופיעים בדף נכס זה נמסרו ע״י בעל הנכס ובאחריותו הבלעדית. ביקור בנכס כפוף לחתימה על הזמנה בכתב לביצוע פעולת תיווך כחוק לפני הצגת הנכס. ט.ל.ח.
            </p>
          </div>
        </div>

        {/* Client WhatsApp Action Footer (Hidden on Print) */}
        <footer className="no-print p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
              {agent.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{agent.name}</p>
              <p className="text-[11px] text-slate-500 truncate" dir="ltr">{agent.phone}</p>
            </div>
          </div>

          <button
            onClick={handleWhatsAppAgent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>פנה למתווך בוואטסאפ</span>
          </button>
        </footer>
      </div>

      {/* Confirm Delete Property Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl p-5 space-y-4 text-right">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 text-red-600">
              <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">מחיקת נכס מהמאגר</h3>
                <p className="text-xs text-slate-500">פעולה זו בלתי הפיכה</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              האם אתה בטוח שברצונך למחוק את הנכס ב-<strong>{property.street} {property.house_number || ''}, {property.city}</strong> מהמאגר?
              כל נתוני הנכס, היסטוריית המחירים וההתאמות ללקוחות יימחקו לצמיתות.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDelete) {
                    onDelete(property.id)
                  }
                  setShowDeleteConfirm(false)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>אישור מחיקה</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
