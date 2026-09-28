import React, { useState } from 'react'
import { Property } from '../types'
import { formatILS } from '../lib/utils'
import { TrendingDown, CheckCircle2 } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PriceUpdateModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onPriceUpdated: (propertyId: string, newPrice: number, note: string) => void
}

const PriceUpdateForm: React.FC<{
  property: Property
  onClose: () => void
  onPriceUpdated: (propertyId: string, newPrice: number, note: string) => void
}> = ({ property, onClose, onPriceUpdated }) => {
  const [newPrice, setNewPrice] = useState<number>(property.price)
  const [note, setNote] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPrice <= 0 || isNaN(newPrice)) return
    onPriceUpdated(property.id, newPrice, note.trim())
    onClose()
  }

  const diff = newPrice - property.price
  const percentChange = ((diff / property.price) * 100).toFixed(1)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-5 text-xs">
      <div className="p-3.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between">
        <span className="text-muted-foreground">מחיר נוכחי:</span>
        <span className="text-sm font-bold text-foreground">{formatILS(property.price)}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-foreground block font-medium">
          מחיר מבוקש חדש: <strong className="text-primary">{formatILS(newPrice)}</strong>
        </label>
        <Input
          type="number"
          step={property.transaction_type === 'sale' ? 25000 : 100}
          value={newPrice}
          onChange={(e) => setNewPrice(Number(e.target.value))}
          className="text-sm font-bold"
          required
        />
      </div>

      {diff !== 0 && (
        <div className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
          diff < 0 
            ? 'bg-blue-50 border-blue-200 text-blue-800' 
            : 'bg-muted border-border text-foreground'
        }`}>
          <span>שינוי במחיר:</span>
          <span dir="ltr">{diff < 0 ? '-' : '+'}{formatILS(Math.abs(diff))} ({percentChange}%)</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-foreground block font-medium">סיבת השינוי / הערת תיעוד:</label>
        <Input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="למשל: ירידת מחיר לרציניים / הבעלים מתפשר"
        />
      </div>

      <DialogFooter className="mt-2 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5">
        <Button type="button" variant="ghost" onClick={onClose}>
          ביטול
        </Button>
        <Button type="submit" className="gap-1.5">
          <CheckCircle2 className="size-4" />
          <span>עדכן מחיר והפעל התראות</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  property,
  isOpen,
  onClose,
  onPriceUpdated
}) => {
  if (!isOpen || !property) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <TrendingDown className="size-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle>עדכון מחיר ותיעוד היסטוריה</DialogTitle>
            <DialogDescription className="truncate">
              {property.street} {property.house_number}, {property.city}
            </DialogDescription>
          </div>
        </DialogHeader>

        <PriceUpdateForm
          key={property.id}
          property={property}
          onClose={onClose}
          onPriceUpdated={onPriceUpdated}
        />
      </DialogContent>
    </Dialog>
  )
}
