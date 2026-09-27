import React, { useState } from 'react'
import { Property, AgentProfile } from '../types'
import { formatILS } from '../lib/utils'
import { 
  X, 
  Printer, 
  MessageSquare, 
  Phone, 
  ShieldCheck, 
  Share2, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Building2,
  Car,
  Home
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
    ? `${property.city}, ${property.neighborhood || property.street} (מיקום מרכזי ושקט)`
    : `${property.street} ${property.house_number || ''}, ${property.city}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="print-page glass-panel w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Action Bar (Hidden on Print) */}
        <div className="no-print p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              {isPrintMode ? 'תצוגת דף נכס להדפסה / PDF' : 'תצוגת לקוח ציבורית (קישור שיתוף)'}
            </span>
            {property.hide_exact_address && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🔒 כתובת מוסתרת (מניעת עקיפה)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white border border-white/10 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'הקישור הועתק!' : 'העתק קישור'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>הדפסה / שמירה כ-PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-900 print:bg-white print:text-black">
          
          {/* Branded Realtor Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10 print:border-slate-300">
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 print:text-emerald-700 uppercase block">
                {agent.agency_name}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white print:text-slate-900 mt-1">
                {agent.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 print:text-slate-600 mt-1">
                <span>רישיון תיווך מקרקעין מס׳: <strong>{agent.license_number}</strong></span>
                <span>•</span>
                <span dir="ltr">{agent.phone}</span>
              </div>
            </div>

            <div className="text-left">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                property.transaction_type === 'sale' 
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 print:bg-indigo-100 print:text-indigo-800' 
                  : 'bg-teal-600/30 text-teal-300 border border-teal-500/40 print:bg-teal-100 print:text-teal-800'
              }`}>
                {property.transaction_type === 'sale' ? 'נכס למכירה' : 'נכס להשכרה'}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white print:text-slate-900 mt-2">
                {formatILS(property.price)}
                {property.transaction_type === 'rent' && <span className="text-sm font-normal text-slate-400 print:text-slate-600">/חודש</span>}
              </div>
            </div>
          </div>

          {/* Photo Gallery Showcase */}
          {property.photos && property.photos.length > 0 && (
            <div className="space-y-2">
              <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 print:border-slate-200">
                <img
                  src={property.photos[activePhotoIdx]}
                  alt="תמונת נכס ראשית"
                  className="w-full h-full object-cover"
                />

                {property.photos.length > 1 && (
                  <div className="no-print absolute inset-0 flex items-center justify-between p-3 pointer-events-none">
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}
                      className="p-2 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-black/80 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}
                      className="p-2 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-black/80 transition-colors"
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
                      className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                        activePhotoIdx === idx ? 'border-emerald-500 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
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
            <h3 className="text-sm font-bold text-slate-300 print:text-slate-800">
              📍 {addressDisplay}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-white/5 print:border-slate-200">
                <span className="text-[11px] text-slate-400 print:text-slate-500 block">מספר חדרים:</span>
                <span className="text-base font-bold text-white print:text-black">{property.rooms} חדרים</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-white/5 print:border-slate-200">
                <span className="text-[11px] text-slate-400 print:text-slate-500 block">קומה בבניין:</span>
                <span className="text-base font-bold text-white print:text-black">קומה {property.floor} מתוך {property.total_floors}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-white/5 print:border-slate-200">
                <span className="text-[11px] text-slate-400 print:text-slate-500 block">שטח בנוי:</span>
                <span className="text-base font-bold text-white print:text-black">{property.sqm} מ״ר</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-white/5 print:border-slate-200">
                <span className="text-[11px] text-slate-400 print:text-slate-500 block">תאריך כניסה:</span>
                <span className="text-base font-bold text-white print:text-black">{property.vacancy_date || 'מיידי / גמיש'}</span>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {property.has_mamad && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-slate-300 print:text-black">
                  🛡️ מרחב מוגן דירתי (ממ״ד)
                </span>
              )}
              {property.has_elevator && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 print:border-slate-300 print:text-black">
                  🛗 מעלית בבניין
                </span>
              )}
              {property.has_balcony && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 print:border-slate-300 print:text-black">
                  🌅 מרפסת שמש
                </span>
              )}
              {property.parking_type !== 'none' && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-white/10 print:border-slate-300 print:text-black">
                  🚗 חניה ({property.parking_legal === 'tabu' ? 'רשומה בטאבו' : 'משותפת'})
                </span>
              )}
              {property.has_storage && (
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-white/10 print:border-slate-300 print:text-black">
                  📦 מחסן פרטי
                </span>
              )}
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="p-4 rounded-2xl bg-slate-950/40 print:bg-slate-100 border border-white/5 print:border-slate-300 text-[11px] text-slate-400 print:text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-300 print:text-slate-800 mb-1">הבהרה משפטית (חוק המתווכים במקרקעין):</p>
            <p>
              כל הפרטים המופיעים בדף נכס זה נמסרו ע״י בעל הנכס ובאחריותו הבלעדית. התמונות להמחשה בלבד. ביקור בנכס כפוף לחתימה על הזמנה בכתב לביצוע פעולת תיווך כחוק לפני הצגת הנכס. ט.ל.ח.
            </p>
          </div>
        </div>

        {/* Client WhatsApp Floating Action Footer (Hidden on Print) */}
        <div className="no-print p-4 sm:p-5 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              {agent.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{agent.name}</p>
              <p className="text-[11px] text-slate-400">{agent.phone}</p>
            </div>
          </div>

          <button
            onClick={handleWhatsAppAgent}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>פנה למתווך בוואטסאפ לתיאום ביקור</span>
          </button>
        </div>
      </div>
    </div>
  )
}
