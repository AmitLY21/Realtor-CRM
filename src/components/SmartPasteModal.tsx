import React, { useState, useEffect } from 'react'
import { parseRawListingText, ParsedPropertyDraft } from '../lib/parser'
import { checkPropertyDuplicate, db } from '../lib/db'
import { Property } from '../types'
import { sendPushNotification } from '../lib/notifications'
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react'

interface SmartPasteModalProps {
  isOpen: boolean
  onClose: () => void
  onPropertyAdded: (newProp: Property) => void
}

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  onClose,
  onPropertyAdded
}) => {
  const [rawText, setRawText] = useState('')
  const [draft, setDraft] = useState<ParsedPropertyDraft | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<Property | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reactively parse as user types or pastes
  useEffect(() => {
    if (!rawText.trim()) {
      setDraft(null)
      setDuplicateWarning(null)
      return
    }

    const parsed = parseRawListingText(rawText)
    setDraft(parsed)

    // Check duplicate
    if (parsed.street && parsed.street !== 'לא צוין') {
      checkPropertyDuplicate(parsed.city, parsed.street, parsed.house_number, parsed.rooms, parsed.floor).then(dup => {
        setDuplicateWarning(dup || null)
      })
    }
  }, [rawText])

  if (!isOpen) return null

  const handleSampleWhatsApp = () => {
    const sample = `*דירה חדשה למכירה בבלעדיות בלב תל אביב!*
ברחוב בוגרשוב 52, פינת שלמה המלך.
3.5 חדרים מרווחת, כ-85 מ"ר, קומה 3 מתוך 5 עם מעלית!
יש מרפסת שמש מפנקת 12 מ"ר שיוצאת מהסלון.
ממ"ד תקני בדירה, חניה רגילה בטאבו.
משופצת אדריכלית, פינוי גמיש.
מחיר מבוקש: 4,650,000 ש"ח (לרציניים בלבד).
לפרטים ותיאום: רונן 054-1234567`
    setRawText(sample)
  }

  const handleSave = async () => {
    if (!draft) return
    setIsSubmitting(true)

    try {
      const now = new Date().toISOString()
      const newProperty: Property = {
        id: `prop-${Date.now()}`,
        created_at: now,
        updated_at: now,
        status: 'active',
        transaction_type: draft.transaction_type,
        is_exclusive: rawText.includes('בלעדיות') || rawText.includes('בלעדי'),
        property_type: draft.property_type,
        city: draft.city,
        neighborhood: draft.neighborhood,
        street: draft.street,
        house_number: draft.house_number || '',
        rooms: draft.rooms || 3,
        floor: draft.floor || 1,
        total_floors: draft.total_floors || 4,
        sqm: draft.sqm || 75,
        price: draft.price || 3500000,
        price_history: [
          { price: draft.price || 3500000, changed_at: now, note: 'קליטה ראשונית מוואטסאפ' }
        ],
        has_mamad: draft.has_mamad,
        has_elevator: draft.has_elevator,
        has_balcony: draft.has_balcony,
        has_storage: draft.has_storage,
        parking_type: draft.parking_type,
        parking_legal: draft.parking_legal,
        public_slug: `${draft.street.replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
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
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">קליטה מהירה מוואטסאפ / יד2</h3>
              <p className="text-xs text-slate-500">הדבק הודעה טקסטואלית לחילוץ אוטומטי</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                הדבק כאן את הודעת הנכס:
              </label>
              <button
                type="button"
                onClick={handleSampleWhatsApp}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                טען דוגמה מוואטסאפ שת״פ
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="לדוגמה: למכירה בבוגרשוב 3.5 חדרים קומה 3 עם מעלית וממ״ד, חניה בטאבו 4.65M ש״ח..."
              rows={4}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
            />
          </div>

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

          {/* Live Extraction Preview */}
          {draft && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
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
                    {draft.street} {draft.house_number || ''}, {draft.city}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">מחיר</span>
                  <span className="font-bold text-slate-900">
                    {draft.price ? `${draft.price.toLocaleString()} ₪` : 'לא צוין'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">חדרים וקומה</span>
                  <span className="font-semibold text-slate-800">
                    {draft.rooms || '-'} חד׳ • קומה {draft.floor ?? '-'}
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
