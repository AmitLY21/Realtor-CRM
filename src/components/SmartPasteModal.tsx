import React, { useState } from 'react'
import { parseRawListingText, ParsedPropertyDraft } from '../lib/parser'
import { checkPropertyDuplicate, db } from '../lib/db'
import { Property } from '../types'
import { sendPushNotification } from '../lib/notifications'
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Clipboard,
  Info
} from 'lucide-react'

interface SmartPasteModalProps {
  isOpen: boolean
  initialText?: string
  onClose: () => void
  onPropertyAdded: (newProp: Property) => void
}

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  initialText,
  onClose,
  onPropertyAdded
}) => {
  const initialDraft = initialText ? parseRawListingText(initialText) : null

  const [rawText, setRawText] = useState(initialText || '')
  const [draft, setDraft] = useState<ParsedPropertyDraft | null>(initialDraft)
  const [duplicateWarning, setDuplicateWarning] = useState<Property | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showShareHelp, setShowShareHelp] = useState(false)

  // Editable fields state for manual completion/corrections
  const [formCity, setFormCity] = useState(initialDraft?.city || '')
  const [formStreet, setFormStreet] = useState(initialDraft?.street || '')
  const [formHouseNumber, setFormHouseNumber] = useState(initialDraft?.house_number || '')
  const [formPrice, setFormPrice] = useState<string>(initialDraft?.price !== undefined ? String(initialDraft.price) : '')
  const [formRooms, setFormRooms] = useState<string>(initialDraft?.rooms !== undefined ? String(initialDraft.rooms) : '')
  const [formFloor, setFormFloor] = useState<string>(initialDraft?.floor !== undefined ? String(initialDraft.floor) : '')
  const [formTotalFloors, setFormTotalFloors] = useState<string>(initialDraft?.total_floors !== undefined ? String(initialDraft.total_floors) : '')
  const [formSqm, setFormSqm] = useState<string>(initialDraft?.sqm !== undefined ? String(initialDraft.sqm) : '')
  const [formNeighborhood, setFormNeighborhood] = useState(initialDraft?.neighborhood || '')

  const handleRawTextChange = (text: string) => {
    setRawText(text)
    if (!text.trim()) {
      setDraft(null)
      setDuplicateWarning(null)
      setValidationError(null)
      return
    }

    const parsed = parseRawListingText(text)
    setDraft(parsed)
    setValidationError(null)

    // Populate editable inputs with parsed results (or blank if unassured)
    setFormCity(parsed.city || '')
    setFormStreet(parsed.street || '')
    setFormHouseNumber(parsed.house_number || '')
    setFormPrice(parsed.price !== undefined ? String(parsed.price) : '')
    setFormRooms(parsed.rooms !== undefined ? String(parsed.rooms) : '')
    setFormFloor(parsed.floor !== undefined ? String(parsed.floor) : '')
    setFormTotalFloors(parsed.total_floors !== undefined ? String(parsed.total_floors) : '')
    setFormSqm(parsed.sqm !== undefined ? String(parsed.sqm) : '')
    setFormNeighborhood(parsed.neighborhood || '')

    // Check duplicate
    if (parsed.street && parsed.city) {
      checkPropertyDuplicate(parsed.city, parsed.street, parsed.house_number, parsed.rooms, parsed.floor).then(dup => {
        setDuplicateWarning(dup || null)
      })
    }
  }

  if (!isOpen) return null

  // Calculate fields currently requiring manual completion
  const missingFieldList: { field: string; label: string }[] = []
  if (!formStreet.trim()) missingFieldList.push({ field: 'street', label: 'רחוב' })
  if (!formCity.trim()) missingFieldList.push({ field: 'city', label: 'עיר' })
  if (!formPrice.trim() || Number(formPrice) <= 0) missingFieldList.push({ field: 'price', label: 'מחיר' })
  if (!formRooms.trim() || Number(formRooms) <= 0) missingFieldList.push({ field: 'rooms', label: 'חדרים' })
  if (!formFloor.trim()) missingFieldList.push({ field: 'floor', label: 'קומה' })
  if (!formSqm.trim() || Number(formSqm) <= 0) missingFieldList.push({ field: 'sqm', label: 'שטח מ״ר' })

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          handleRawTextChange(text)
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err)
    }
  }

  const handleSampleWhatsApp = () => {
    const sample = `*דירה חדשה למכירה בבלעדיות בלב תל אביב!*
ברחוב בוגרשוב 52, פינת שלמה המלך.
3.5 חדרים מרווחת, כ-85 מ"ר, קומה 3 מתוך 5 עם מעלית!
יש מרפסת שמש מפנקת 12 מ"ר שיוצאת מהסלון.
ממ"ד תקני בדירה, חניה רגילה בטאבו.
משופצת אדריכלית, פינוי גמיש.
מחיר מבוקש: 4,650,000 ש"ח (לרציניים בלבד).
לפרטים ותיאום: רונן 054-1234567`
    handleRawTextChange(sample)
  }

  const handleSave = async () => {
    if (!draft) return

    // Require critical minimum fields
    if (!formStreet.trim() || !formCity.trim()) {
      setValidationError('נא להזין לפחות עיר ורחוב לפני השמירה למאגר.')
      return
    }

    const priceNum = Number(formPrice) || 0
    if (priceNum <= 0) {
      setValidationError('נא להזין מחיר תקין עבור הנכס.')
      return
    }

    setIsSubmitting(true)
    setValidationError(null)

    try {
      const now = new Date().toISOString()
      const roomsNum = Number(formRooms) || 3
      const floorNum = formFloor ? Number(formFloor) : 0
      const totalFloorsNum = formTotalFloors ? Number(formTotalFloors) : Math.max(floorNum, 1)
      const sqmNum = Number(formSqm) || 0

      const newProperty: Property = {
        id: `prop-${Date.now()}`,
        created_at: now,
        updated_at: now,
        status: 'active',
        transaction_type: draft.transaction_type,
        is_exclusive: draft.is_exclusive,
        exclusive_until: draft.is_exclusive
          ? new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0]
          : undefined,
        property_type: draft.property_type,
        city: formCity.trim(),
        neighborhood: formNeighborhood.trim() || 'מרכז העיר',
        street: formStreet.trim(),
        house_number: formHouseNumber.trim(),
        rooms: roomsNum,
        floor: floorNum,
        total_floors: totalFloorsNum,
        sqm: sqmNum,
        price: priceNum,
        price_history: [
          { price: priceNum, changed_at: now, note: 'קליטה ראשונית מוואטסאפ' }
        ],
        has_mamad: draft.has_mamad,
        has_elevator: draft.has_elevator,
        has_balcony: draft.has_balcony,
        has_storage: draft.has_storage,
        parking_type: draft.parking_type,
        parking_legal: draft.parking_legal,
        public_slug: `${formStreet.trim().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
        hide_exact_address: true, // Default to protected anti-poaching mode
        notes: draft.raw_text,
        photos: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ]
      }

      await db.properties.add(newProperty)
      await sendPushNotification('נכס חדש נקלט בהצלחה!', `${newProperty.rooms} חדרים ב${newProperty.street}, ${newProperty.city}`, 'match')
      onPropertyAdded(newProperty)
      onClose()
      setRawText('')
    } catch (e) {
      console.error('Failed to add property:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">קליטה מהירה מוואטסאפ / יד2</h3>
              <p className="text-xs text-slate-500">הדבק הודעה טקסטואלית לחילוץ אוטומטי ובקרה ידנית</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Text Area */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                הדבק כאן את הודעת הנכס:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                  title="הדבק אוטומטית הודעה שהועתקה מוואטסאפ"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  הדבק מהלוח (Clipboard)
                </button>
                <button
                  type="button"
                  onClick={handleSampleWhatsApp}
                  className="text-xs text-slate-500 hover:text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  טען דוגמה מוואטסאפ שת״פ
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareHelp(!showShareHelp)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                  title="איך לשתף ישירות מוואטסאפ?"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showShareHelp && (
              <div className="mb-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed animate-in fade-in duration-100">
                <span className="font-bold text-blue-950">💡 אפשרויות שיתוף מוואטסאפ: </span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
                  <li><strong>אנדרואיד:</strong> התקן את האפליקציה למסך הבית (מתפריט הדפדפן ⁝ &gt; 'התקנת אפליקציה') כדי שתופיע ישירות בלחיצה על "שתף" בוואטסאפ.</li>
                  <li><strong>אייפון (iOS):</strong> מערכת iOS חוסמת שיתוף ישיר ל-PWA – פשוט העתק את ההודעה בוואטסאפ ולחץ כאן <strong>'הדבק מהלוח'</strong> בלחיצה אחת!</li>
                </ul>
              </div>
            )}
            <textarea
              value={rawText}
              onChange={(e) => handleRawTextChange(e.target.value)}
              placeholder="לדוגמה: למכירה בבוגרשוב 52, 3.5 חדרים קומה 3 עם מעלית וממ״ד, חניה בטאבו 4.65M ש״ח..."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Missing Fields Warning Banner */}
          {draft && missingFieldList.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">
                    שים לב: {missingFieldList.length} שדות לא זוהו בוודאות והושארו ריקים
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                    נדרשת השלמה ידנית
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  הטקסט לא הכיל זיהוי חד-משמעי עבור שדות אלו. אנא השלם אותם ידנית בטופס שלמטה לפני ההוספה למאגר.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {missingFieldList.map(({ field, label }) => (
                    <span key={field} className="px-2 py-0.5 rounded bg-white/90 border border-amber-300 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {label} דורש מילוי
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">נכס קיים זוהה במאגר שלך</p>
                <p className="text-[11px] mt-0.5">
                  קיים נכס ברחוב {duplicateWarning.street} {duplicateWarning.house_number} ({duplicateWarning.price.toLocaleString()} ₪).
                </p>
              </div>
            </div>
          )}

          {/* Live Extraction Preview Badges */}
          {draft && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  פרטים שחולצו אוטומטית:
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  דיוק זיהוי: {draft.confidenceScore}%
                </span>
              </div>

              {/* Extracted Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">עסקה וסוג</span>
                  <span className="font-semibold text-slate-800">
                    {draft.transaction_type === 'sale' ? 'מכירה' : 'השכרה'} ({draft.property_type})
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">מיקום</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {formStreet || 'רחוב לא זוהה'} {formHouseNumber || ''}{formCity ? `, ${formCity}` : ''}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">מחיר</span>
                  <span className="font-bold text-slate-900">
                    {formPrice ? `${Number(formPrice).toLocaleString()} ₪` : 'דורש מילוי ידני'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">חדרים וקומה</span>
                  <span className="font-semibold text-slate-800">
                    {formRooms ? `${formRooms} חד׳` : 'לא זוהה'} • קומה {formFloor || '-'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">מאפיינים</span>
                  <span className="font-medium text-slate-700 truncate block">
                    {[
                      draft.has_mamad ? 'ממ״ד' : null,
                      draft.has_elevator ? 'מעלית' : null,
                      draft.has_balcony ? 'מרפסת' : null
                    ].filter(Boolean).join(', ') || 'סטנדרט'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">חניה</span>
                  <span className="font-medium text-slate-700">
                    {draft.parking_type !== 'none' ? `חניה (${draft.parking_legal})` : 'ללא חניה'}
                  </span>
                </div>
              </div>

              {/* Manual Review and Completion Inputs */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    עריכה והשלמת פרטים ידנית:
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ניתן לערוך כל שדה לפני השמירה
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Street & House Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">רחוב ומספר</label>
                      {!formStreet.trim() ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formStreet}
                        onChange={(e) => setFormStreet(e.target.value)}
                        placeholder="שם הרחוב..."
                        className={`flex-1 p-2 rounded-lg text-xs border transition-colors ${
                          !formStreet.trim()
                            ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                        }`}
                      />
                      <input
                        type="text"
                        value={formHouseNumber}
                        onChange={(e) => setFormHouseNumber(e.target.value)}
                        placeholder="מס׳"
                        className="w-16 p-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">עיר</label>
                      {!formCity.trim() ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="שם העיר..."
                      className={`w-full p-2 rounded-lg text-xs border transition-colors ${
                        !formCity.trim()
                          ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">מחיר (₪)</label>
                      {!formPrice.trim() || Number(formPrice) <= 0 ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="לדוגמה: 3500000"
                      className={`w-full p-2 rounded-lg text-xs border transition-colors ${
                        !formPrice.trim() || Number(formPrice) <= 0
                          ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  {/* Rooms */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">מספר חדרים</label>
                      {!formRooms.trim() || Number(formRooms) <= 0 ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      value={formRooms}
                      onChange={(e) => setFormRooms(e.target.value)}
                      placeholder="לדוגמה: 3.5"
                      className={`w-full p-2 rounded-lg text-xs border transition-colors ${
                        !formRooms.trim() || Number(formRooms) <= 0
                          ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>

                  {/* Floor and Total Floors */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">קומה ומתוך קומות</label>
                      {!formFloor.trim() ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        value={formFloor}
                        onChange={(e) => setFormFloor(e.target.value)}
                        placeholder="קומה"
                        className={`w-1/2 p-2 rounded-lg text-xs border transition-colors ${
                          !formFloor.trim()
                            ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                        }`}
                      />
                      <span className="text-slate-400 text-xs">מתוך</span>
                      <input
                        type="number"
                        value={formTotalFloors}
                        onChange={(e) => setFormTotalFloors(e.target.value)}
                        placeholder="קומות"
                        className="w-1/2 p-2 rounded-lg text-xs border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Sqm */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">שטח בנוי (מ״ר)</label>
                      {!formSqm.trim() || Number(formSqm) <= 0 ? (
                        <span className="text-[10px] text-amber-600 font-semibold">נדרשת השלמה</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">✓ הוזן</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={formSqm}
                      onChange={(e) => setFormSqm(e.target.value)}
                      placeholder="לדוגמה: 85"
                      className={`w-full p-2 rounded-lg text-xs border transition-colors ${
                        !formSqm.trim() || Number(formSqm) <= 0
                          ? 'border-amber-300 bg-amber-50/40 text-amber-900 placeholder-amber-400 focus:bg-white focus:border-amber-500'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            ביטול
          </button>

          <button
            onClick={handleSave}
            disabled={!draft || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>אישור והוספה למאגר</span>
          </button>
        </div>
      </div>
    </div>
  )
}
