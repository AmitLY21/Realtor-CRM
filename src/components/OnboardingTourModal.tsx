import React, { useState } from 'react'
import { AgentProfile } from '../types'
import confetti from 'canvas-confetti'
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  Users, 
  ShieldCheck, 
  FileText, 
  User, 
  Phone, 
  BadgeCheck, 
  Briefcase, 
  Mail 
} from 'lucide-react'

interface OnboardingTourModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (profile: AgentProfile) => void
  initialProfile: AgentProfile
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProfile
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Start with blank fields so user sees only hint placeholders, not dummy demo data
  const [profile, setProfile] = useState<AgentProfile>(() => {
    const isDefaultDummy = initialProfile.name === 'רועי ברקוביץ׳' && initialProfile.phone === '054-8889999'
    if (isDefaultDummy) {
      return {
        name: '',
        phone: '',
        email: '',
        license_number: '',
        agency_name: ''
      }
    }
    return {
      name: initialProfile.name || '',
      phone: initialProfile.phone || '',
      email: initialProfile.email || '',
      license_number: initialProfile.license_number || '',
      agency_name: initialProfile.agency_name || ''
    }
  })

  const [validationError, setValidationError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFinish = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!profile.name.trim() || !profile.phone.trim()) {
      setValidationError('נא להזין לפחות שם מלא ומספר טלפון כדי להשלים את ההגדרה.')
      return
    }

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch {
      // Ignore if canvas-confetti fails in test environment
    }

    onComplete(profile)
    onClose()
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Interactive Step Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900">סיור היכרות והגדרת בסיס</span>
              <span className="text-[11px] text-slate-500 block">שלב {step} מתוך 3</span>
            </div>
          </div>

          {/* Interactive Step Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                step === 1 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. היכרות
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                step === 2 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. איך זה עובד
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                step === 3 ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. פרטי מתווך
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded transition-colors"
            >
              דלג
            </button>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: WELCOME & VALUE PROPOSITION */}
          {step === 1 && (
            <div className="space-y-4 text-center sm:text-right">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto sm:mx-0">
                <Building2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ברוך הבא ל-Realtor CRM! 🇮🇱
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  המערכת החכמה שנבנתה במיוחד עבור סוכנים ומתווכי נדל״ן בישראל – בריבונות נתונים מלאה, ללא תלות ברשת ובמהירות עבודה מקסימלית.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-right">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>קליטה מהירה מוואטסאפ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    הדבק הודעות מקבוצות שת״פ – המערכת מחלצת ומסדרת את כרטיס הנכס תוך שניות.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>הגנת בלעדיות (Anti-Poaching)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    דפי שיתוף ללקוחות ללא חשיפת כתובת מדויקת לשמירה על העסקאות שלך.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>משפך לקוחות והתאמות 85%+</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    מנוע חכם שמצליב בין דרישות קונים למאגר הנכסים הפעילים.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>הסכמי תיווך כחוק</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    מעקב חתימות בסיורים לפי חוק המתווכים הישראלי למניעת אובדן עמלות.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HOW IT WORKS IN 3 STEPS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  איך מתחילים לעבוד ביומיום?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  שלושה צעדים פשוטים להפקת ערך מקסימלי:
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">קלוט נכס ראשון (Smart Paste)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      לחץ על כפתור ״הוספה״ ובחר ״הדבקה מהירה״. הדבק טקסט חופשי, אמת את השדות ושמור למאגר שלך.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">נהל את משפך הלקוחות (Kanban)</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      הזן לקוחות מחפשים לפי תקציב ומספר חדרים. המערכת תסמן לך התאמות חמות ותאפשר לשלוח הצעות בוואטסאפ ב-1 קליק.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900">שתף דפי נכס ממותגים</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      הפק דף לקוח מעוצב הכולל את הפרטים שלך כמתווך, גלריית תמונות, ופרטי נכס מסודרים.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REALTOR PROFILE FORM */}
          {step === 3 && (
            <form id="onboarding-profile-form" onSubmit={handleFinish} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  הגדרת פרטי המתווך והסוכנות (הבסיס שלך)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  הפרטים שתזין יופיעו בכל דפי הנכס ללקוחות, בהודעות הוואטסאפ ובהסכמי התיווך.
                </p>
              </div>

              {validationError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>שם מלא / שם המתווך *</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="הזן שם מלא (לדוגמה: ישראל ישראלי)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>טלפון ישיר לוואטסאפ *</span>
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="הזן טלפון (לדוגמה: 054-1234567)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>שם המשרד / סוכנות</span>
                  </label>
                  <input
                    type="text"
                    value={profile.agency_name}
                    onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
                    placeholder="שם המשרד או הסוכנות..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>מספר רישיון תיווך</span>
                  </label>
                  <input
                    type="text"
                    value={profile.license_number}
                    onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                    placeholder="מספר רישיון תיווך..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>דוא״ל ליצירת קשר</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="כתובת דוא״ל (לדוגמה: agent@prime.co.il)"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזור</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{step === 1 ? 'הבא: איך המערכת עובדת' : 'הבא: הגדרת פרטי המתווך'}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinish()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>סיים והתחל לעבוד!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
