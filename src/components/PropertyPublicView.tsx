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
  MapPin
} from 'lucide-react'

interface PropertyPublicViewProps {
  property: Property | null
  agent: AgentProfile
  isOpen: boolean
  onClose: () => void
  isPrintMode?: boolean
}

export const PropertyPublicView: React.FC<PropertyPublicViewProps> = ({
  property,
  agent,
  isOpen,
  onClose,
  isPrintMode = false
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)

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
    ? `${property.city}, ${property.neighborhood || property.street} (מיקום מרכזי)`
    : `${property.street} ${property.house_number || ''}, ${property.city}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="print-page w-full max-w-3xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Action Bar (Hidden on Print) */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              {isPrintMode ? 'תצוגת דף נכס להדפסה / PDF' : 'תצוגת לקוח ציבורית (קישור שיתוף)'}
            </span>
            {property.hide_exact_address && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                כתובת מוסתרת (מניעת עקיפה)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs text-slate-700 border border-slate-200 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'הועתק' : 'העתק קישור'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>הדפסה / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-5 flex-1 bg-white print:p-0">
          
          {/* Branded Realtor Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase block">
                {agent.agency_name}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {agent.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>רישיון תיווך מקרקעין: <strong>{agent.license_number}</strong></span>
                <span>•</span>
                <span dir="ltr">{agent.phone}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                {property.transaction_type === 'sale' ? 'למכירה' : 'להשכרה'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {formatILS(property.price)}
                {property.transaction_type === 'rent' && <span className="text-xs font-normal text-slate-500">/חודש</span>}
              </div>
            </div>
          </div>

          {/* Photo Gallery Showcase */}
          {property.photos && property.photos.length > 0 && (
            <div className="space-y-2">
              <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={property.photos[activePhotoIdx]}
                  alt="תמונת נכס ראשית"
                  className="w-full h-full object-cover"
                />

                {property.photos.length > 1 && (
                  <div className="no-print absolute inset-0 flex items-center justify-between p-2 pointer-events-none">
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}
                      className="p-1.5 rounded-full bg-white/90 text-slate-800 pointer-events-auto hover:bg-white shadow-xs"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}
                      className="p-1.5 rounded-full bg-white/90 text-slate-800 pointer-events-auto hover:bg-white shadow-xs"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {property.photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {property.photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        activePhotoIdx === idx ? 'border-blue-600' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specifications Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{addressDisplay}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">מספר חדרים:</span>
                <span className="text-sm font-bold text-slate-900">{property.rooms} חדרים</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">קומה בבניין:</span>
                <span className="text-sm font-bold text-slate-900">קומה {property.floor} מתוך {property.total_floors}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">שטח בנוי:</span>
                <span className="text-sm font-bold text-slate-900">{property.sqm} מ״ר</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">תאריך כניסה:</span>
                <span className="text-sm font-bold text-slate-900">{property.vacancy_date || 'מיידי / גמיש'}</span>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {property.has_mamad && (
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  מרחב מוגן דירתי (ממ״ד)
                </span>
              )}
              {property.has_elevator && (
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  מעלית בבניין
                </span>
              )}
              {property.has_balcony && (
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  מרפסת שמש
                </span>
              )}
              {property.parking_type !== 'none' && (
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  חניה ({property.parking_legal === 'tabu' ? 'בטאבו' : 'משותפת'})
                </span>
              )}
              {property.has_storage && (
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                  מחסן פרטי
                </span>
              )}
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-0.5">הבהרה משפטית (חוק המתווכים במקרקעין):</p>
            <p>
              כל הפרטים המופיעים בדף נכס זה נמסרו ע״י בעל הנכס ובאחריותו הבלעדית. ביקור בנכס כפוף לחתימה על הזמנה בכתב לביצוע פעולת תיווך כחוק לפני הצגת הנכס. ט.ל.ח.
            </p>
          </div>
        </div>

        {/* Client WhatsApp Floating Action Footer (Hidden on Print) */}
        <div className="no-print p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              {agent.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{agent.name}</p>
              <p className="text-[11px] text-slate-500">{agent.phone}</p>
            </div>
          </div>

          <button
            onClick={handleWhatsAppAgent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>פנה למתווך בוואטסאפ</span>
          </button>
        </div>
      </div>
    </div>
  )
}
