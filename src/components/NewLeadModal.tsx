import React, { useState } from 'react'
import { Lead, TransactionType, LeadSource } from '../types'
import { checkLeadDuplicate, db } from '../lib/db'
import { ISRAELI_MAJOR_CITIES } from '../lib/geoRegistry'
import { sendPushNotification } from '../lib/notifications'
import { formatILS } from '../lib/utils'
import { 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface NewLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadAdded: (lead: Lead) => void
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded
}) => {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('sale')
  const [source, setSource] = useState<LeadSource>('whatsapp')
  const [maxBudget, setMaxBudget] = useState<number>(4000000)
  const [cityInput, setCityInput] = useState('תל אביב-יפו')
  const [neighborhoodsInput, setNeighborhoodsInput] = useState('לב העיר, הצפון הישן')
  const [minRooms, setMinRooms] = useState<number>(3)
  const [requireMamad, setRequireMamad] = useState(true)
  const [requireElevator, setRequireElevator] = useState(true)
  const [requireBalcony, setRequireBalcony] = useState(false)
  const [requireStorage, setRequireStorage] = useState(false)
  const [requireParking, setRequireParking] = useState(true)
  const [commissionAgreed, setCommissionAgreed] = useState('2% + מע״מ')
  const [notes, setNotes] = useState('')

  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handlePhoneBlur = async () => {
    if (phone.trim().length >= 7) {
      const dup = await checkLeadDuplicate(phone)
      setDuplicateWarning(dup || null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('שם מלא ומספר טלפון הינם שדות חובה!')
      return
    }

    try {
      const now = new Date().toISOString()
      const targetNeighborhoods = neighborhoodsInput
        .split(',')
        .map(n => n.trim())
        .filter(Boolean)

      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        created_at: now,
        updated_at: now,
        full_name: fullName.trim(),
        phone: phone.trim(),
        id_number: idNumber.trim() || undefined,
        transaction_type: transactionType,
        source,
        stage: 'new_lead',
        max_budget: maxBudget,
        target_cities: [cityInput.trim()],
        target_neighborhoods: targetNeighborhoods,
        min_rooms: minRooms,
        preferred_floors: [1, 2, 3, 4, 5],
        require_mamad: requireMamad,
        require_elevator: requireElevator,
        require_balcony: requireBalcony,
        require_storage: requireStorage,
        require_parking: requireParking,
        allowed_parking_types: ['single', 'double'],
        commission_agreed: commissionAgreed,
        notes: notes.trim()
      }

      await db.leads.add(newLead)
      await sendPushNotification('לקוח חדש נוסף!', `${newLead.full_name} (${newLead.phone})`, 'match')
      onLeadAdded(newLead)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <UserCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <DialogTitle>הוספת לקוח / ליד חדש</DialogTitle>
            <DialogDescription>הגדרת תקציב, דרישות מחייבות והסכם תיווך</DialogDescription>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto flex flex-col gap- flex-1 max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Duplicate Phone Warning */}
          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="size- text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">מספר טלפון זה כבר קיים במערכת</p>
                <p className="text-[11px]">הלקוח קיים תחת השם: {duplicateWarning.full_name}</p>
              </div>
            </div>
          )}

          {/* Transaction Type Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">סוג עסקה מבוקשת:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransactionType('sale')
                  setMaxBudget(4000000)
                  setCommissionAgreed('2% + מע״מ')
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  transactionType === 'sale'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                קנייה (רכישת נכס)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransactionType('rent')
                  setMaxBudget(7500)
                  setCommissionAgreed('חודש שכירות + מע״מ')
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  transactionType === 'rent'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                שכירות (השכרת דירה)
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                שם מלא <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="למשל: דניאל שפירא"
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                טלפון נייד <span className="text-rose-500">*</span>:
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={handlePhoneBlur}
                placeholder="050-1234567"
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* National ID for Legal Heskem Tivuch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ת.ז. לקוח (לחוק המתווכים):
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="9 ספרות"
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                עמלה מוסכמת (דמי תיווך):
              </label>
              <input
                type="text"
                value={commissionAgreed}
                onChange={(e) => setCommissionAgreed(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                מקור הליד:
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value="whatsapp">וואטסאפ (WhatsApp)</option>
                <option value="yad2">יד 2 (Yad2)</option>
                <option value="phone_call">שיחה טלפונית</option>
                <option value="referral">הפניה אישית</option>
                <option value="direct">פנייה ישירה / שלט</option>
                <option value="messenger">רשתות חברתיות</option>
              </select>
            </div>
          </div>

          {/* Budget & Rooms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                תקציב מקסימלי: <strong className="text-slate-900">{formatILS(maxBudget)}</strong>
              </label>
              <input
                type="number"
                step={transactionType === 'sale' ? 50000 : 250}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                מינימום חדרים:
              </label>
              <select
                value={minRooms}
                onChange={(e) => setMinRooms(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                <option value={1.5}>1.5 חדרים</option>
                <option value={2}>2 חדרים</option>
                <option value={2.5}>2.5 חדרים</option>
                <option value={3}>3 חדרים</option>
                <option value={3.5}>3.5 חדרים</option>
                <option value={4}>4 חדרים</option>
                <option value={4.5}>4.5 חדרים</option>
                <option value={5}>5 חדרים ומעלה</option>
              </select>
            </div>
          </div>

          {/* Location Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">עיר מבוקשת:</label>
              <select
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              >
                {ISRAELI_MAJOR_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">שכונות מבוקשות (מופרד בפסיק):</label>
              <input
                type="text"
                value={neighborhoodsInput}
                onChange={(e) => setNeighborhoodsInput(e.target.value)}
                placeholder="לב העיר, הצפון הישן"
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Mandatory Feature Checkboxes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              דרישות סף מחייבות (נכס ללא פריטים אלו ייפסל):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={requireMamad}
                  onChange={(e) => setRequireMamad(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-slate-800">חובה ממ״ד</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={requireElevator}
                  onChange={(e) => setRequireElevator(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-slate-800">חובה מעלית</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={requireParking}
                  onChange={(e) => setRequireParking(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-slate-800">חובה חניה</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={requireBalcony}
                  onChange={(e) => setRequireBalcony(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-slate-800">מרפסת שמש</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={requireStorage}
                  onChange={(e) => setRequireStorage(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="text-slate-800">מחסן</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">הערות על הלקוח / שיחה:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="רקע, מצב משפחתי, אישור משכנתא, זמני התקשרות מועדפים..."
              className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <DialogFooter className="mt-2 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>שמור לקוח והפעל התאמה</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
