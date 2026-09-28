import React, { useState } from 'react'
import { Property, TransactionType, PropertyType, PropertyStatus, ParkingType, ParkingLegal } from '../types'
import { 
  Building2, 
  Save, 
  MapPin, 
  Home, 
  Coins, 
  FileText, 
  Shield, 
  Layers,
  Trash2
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface EditPropertyModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProperty: Property) => void
  onDelete?: (propertyId: string) => void
}

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen || !property) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="flex flex-row items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle>עריכת נכס ועדכון פרטים מלאים</DialogTitle>
            <DialogDescription className="truncate">
              {property.street} {property.house_number || ''}, {property.city}
            </DialogDescription>
          </div>
        </DialogHeader>

        <EditPropertyForm 
          key={property.id} 
          property={property} 
          onClose={onClose} 
          onSave={onSave}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  )
}

interface EditPropertyFormProps {
  property: Property
  onClose: () => void
  onSave: (updatedProperty: Property) => void
  onDelete?: (propertyId: string) => void
}

const EditPropertyForm: React.FC<EditPropertyFormProps> = ({
  property,
  onClose,
  onSave,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Form state initialized directly from property
  const [street, setStreet] = useState(property.street)
  const [houseNumber, setHouseNumber] = useState(property.house_number || '')
  const [apartmentNumber, setApartmentNumber] = useState(property.apartment_number || '')
  const [city, setCity] = useState(property.city)
  const [neighborhood, setNeighborhood] = useState(property.neighborhood || '')
  
  const [transactionType, setTransactionType] = useState<TransactionType>(property.transaction_type)
  const [propertyType, setPropertyType] = useState<PropertyType>(property.property_type)
  const [status, setStatus] = useState<PropertyStatus>(property.status)
  
  const [price, setPrice] = useState<string>(property.price.toString())
  const [rooms, setRooms] = useState<string>(property.rooms.toString())
  const [floor, setFloor] = useState<string>(property.floor.toString())
  const [totalFloors, setTotalFloors] = useState<string>(property.total_floors.toString())
  const [sqm, setSqm] = useState<string>(property.sqm.toString())
  
  const [isExclusive, setIsExclusive] = useState<boolean>(property.is_exclusive)
  const [exclusiveUntil, setExclusiveUntil] = useState<string>(property.exclusive_until || '')
  
  const [hasMamad, setHasMamad] = useState<boolean>(property.has_mamad)
  const [hasElevator, setHasElevator] = useState<boolean>(property.has_elevator)
  const [hasBalcony, setHasBalcony] = useState<boolean>(property.has_balcony)
  const [hasStorage, setHasStorage] = useState<boolean>(property.has_storage)
  
  const [parkingType, setParkingType] = useState<ParkingType>(property.parking_type)
  const [parkingLegal, setParkingLegal] = useState<ParkingLegal>(property.parking_legal)
  
  const [hideExactAddress, setHideExactAddress] = useState<boolean>(property.hide_exact_address)
  const [notes, setNotes] = useState<string>(property.notes || '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!street.trim() || !city.trim()) {
      setValidationError('נא להזין לפחות עיר ורחוב תקינים.')
      return
    }

    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setValidationError('נא להזין מחיר חיובי תקין.')
      return
    }

    const roomsNum = Number(rooms) || 1
    const floorNum = Number(floor) || 0
    const totalFloorsNum = Number(totalFloors) || Math.max(floorNum, 1)
    const sqmNum = Number(sqm) || 0

    const now = new Date().toISOString()
    const updatedPriceHistory = [...(property.price_history || [])]
    if (priceNum !== property.price) {
      updatedPriceHistory.push({
        price: priceNum,
        changed_at: now,
        note: 'עודכן בעריכת נכס'
      })
    }

    const updated: Property = {
      ...property,
      updated_at: now,
      street: street.trim(),
      house_number: houseNumber.trim() || undefined,
      apartment_number: apartmentNumber.trim() || undefined,
      city: city.trim(),
      neighborhood: neighborhood.trim() || 'מרכז העיר',
      transaction_type: transactionType,
      property_type: propertyType,
      status,
      price: priceNum,
      price_history: updatedPriceHistory,
      rooms: roomsNum,
      floor: floorNum,
      total_floors: totalFloorsNum,
      sqm: sqmNum,
      is_exclusive: isExclusive,
      exclusive_until: isExclusive ? (exclusiveUntil || undefined) : undefined,
      has_mamad: hasMamad,
      has_elevator: hasElevator,
      has_balcony: hasBalcony,
      has_storage: hasStorage,
      parking_type: parkingType,
      parking_legal: parkingLegal,
      hide_exact_address: hideExactAddress,
      notes: notes.trim()
    }

    onSave(updated)
    onClose()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 text-xs max-h-[80vh]">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {validationError}
            </div>
          )}

          {/* Section 1: Location */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-blue-600" />
              כתובת ומיקום
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">רחוב ומספר</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="שם הרחוב"
                    className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                    required
                  />
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="מס׳ בית"
                    className="w-16 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                  />
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="דירה"
                    className="w-16 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">עיר</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="עיר"
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">שכונה</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="שם השכונה (לדוגמה: מרכז העיר, הצפון הישן)"
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Property Type & Transaction */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Home className="size-3.5 text-blue-600" />
              סוג עסקה ונכס
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">סוג עסקה</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                >
                  <option value="sale">מכירה</option>
                  <option value="rent">השכרה</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">סוג נכס</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                >
                  <option value="apartment">דירה רגילה</option>
                  <option value="garden_apartment">דירת גן</option>
                  <option value="penthouse">פנטהאוז / מיני פנטהאוז</option>
                  <option value="duplex">דופלקס</option>
                  <option value="detached">בית פרטי / קוטג׳</option>
                  <option value="commercial">מסחרי</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">סטטוס שיווק</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                >
                  <option value="active">פעיל במאגר</option>
                  <option value="pending_approval">ממתין לאישור</option>
                  <option value="sold">נמכר</option>
                  <option value="rented">הושכר</option>
                  <option value="inactive">לא פעיל / הוקפא</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Size */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Coins className="size-3.5 text-blue-600" />
              מחיר ומידות
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="col-span-2 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">מחיר מבוקש (₪)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">חדרים</label>
                <input
                  type="number"
                  step="0.5"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">קומה</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    placeholder="סה״כ"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">שטח (מ״ר)</label>
                <input
                  type="number"
                  value={sqm}
                  onChange={(e) => setSqm(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Amenities & Features */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="size-3.5 text-blue-600" />
              מאפיינים ותוספות
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${hasMamad ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={hasMamad}
                  onChange={(e) => setHasMamad(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>ממ״ד תקני</span>
              </label>

              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${hasElevator ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={hasElevator}
                  onChange={(e) => setHasElevator(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>מעלית בבניין</span>
              </label>

              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${hasBalcony ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={hasBalcony}
                  onChange={(e) => setHasBalcony(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>מרפסת שמש</span>
              </label>

              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${hasStorage ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={hasStorage}
                  onChange={(e) => setHasStorage(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>מחסן</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">סוג חניה</label>
                <select
                  value={parkingType}
                  onChange={(e) => setParkingType(e.target.value as ParkingType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                >
                  <option value="none">ללא חניה</option>
                  <option value="single">חניה בודדת (1)</option>
                  <option value="double">חניה כפולה (2 נפרדות)</option>
                  <option value="tandem">חניה עוקבת (טורית)</option>
                  <option value="lift_stacker">מתקן / מכפיל חניה</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">מעמד משפטי לחניה</label>
                <select
                  value={parkingLegal}
                  onChange={(e) => setParkingLegal(e.target.value as ParkingLegal)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600"
                >
                  <option value="tabu">רשומה בטאבו</option>
                  <option value="shared">משותפת לבניין / הסכם שיתוף</option>
                  <option value="street_only">חניה ברחוב בלבד</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Exclusivity & Anti-Poaching */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="size-3.5 text-blue-600" />
              בלעדיות ואבטחת נכס (Anti-Poaching)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isExclusive}
                    onChange={(e) => setIsExclusive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>נכס בבלעדיות המשרד</span>
                </label>
                {isExclusive && (
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">בלעדיות בתוקף עד:</label>
                    <input
                      type="date"
                      value={exclusiveUntil}
                      onChange={(e) => setExclusiveUntil(e.target.value)}
                      className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-slate-900 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">הסתרת כתובת מדויקת בדף לקוח</span>
                  <span className="text-[11px] text-slate-500">מניעת 'ציד עסקאות' על ידי סוכנים אחרים</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideExactAddress}
                  onChange={(e) => setHideExactAddress(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 size-4 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Full Message / Notes */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="size-3.5 text-blue-600" />
                טקסט ההודעה המקורית מוואטסאפ / הערות סוכן
              </h4>
              <span className="text-[10px] text-slate-400">מוצג בכרטיס הנכס במאגר</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="העתק כאן את הודעת הוואטסאפ המלאה, פרטי קשר של בעל הנכס, או כל הערה רלוונטית..."
              rows={4}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:border-blue-600 resize-y leading-relaxed font-sans"
            />
          </div>

          {/* Footer Submit Bar */}
          <DialogFooter className="mt-3 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 flex items-center justify-between sm:justify-between w-full">
            <div>
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:bg-red-50 hover:border-red-200 border-slate-200 gap-1.5"
                >
                  <Trash2 className="size-4 text-red-500" />
                  <span>מחק נכס</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
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
                <Save className="size-4" />
                <span>שמור שינויים</span>
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Confirm Delete Property Modal */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="מחיקת נכס מהמאגר"
          subtitle="פעולה זו בלתי הפיכה"
          description={
            <p>
              האם אתה בטוח שברצונך למחוק את הנכס ב-<strong>{property.street} {property.house_number || ''}, {property.city}</strong> מהמאגר? כל נתוני הנכס, היסטוריית המחירים וההתאמות ללקוחות יימחקו לצמיתות.
            </p>
          }
          confirmLabel="אישור מחיקה"
          cancelLabel="ביטול"
          onConfirm={() => {
            if (onDelete) {
              onDelete(property.id)
            }
            setShowDeleteConfirm(false)
            onClose()
          }}
        />
      </>
    )
  }
