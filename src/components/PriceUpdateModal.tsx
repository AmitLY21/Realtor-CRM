import React, { useState } from 'react'
import { Property } from '../types'
import { formatILS } from '../lib/utils'
import { X, TrendingDown, CheckCircle2 } from 'lucide-react'

interface PriceUpdateModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onPriceUpdated: (propertyId: string, newPrice: number, note: string) => void
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  property,
  isOpen,
  onClose,
  onPriceUpdated
}) => {
  if (!isOpen || !property) return null

  const [newPrice, setNewPrice] = useState<number>(property.price)
  const [note, setNote] = useState('הורדת מחיר - בעלים גמיש')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPriceUpdated(property.id, newPrice, note)
    onClose()
  }

  const diff = newPrice - property.price
  const percentChange = ((diff / property.price) * 100).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">עדכון מחיר ותיעוד היסטוריה</h3>
              <p className="text-xs text-slate-500">{property.street} {property.house_number}, {property.city}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current vs New */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500">מחיר נוכחי:</span>
            <span className="text-sm font-bold text-slate-900">{formatILS(property.price)}</span>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-medium">
              מחיר מבוקש חדש: <strong className="text-blue-600">{formatILS(newPrice)}</strong>
            </label>
            <input
              type="number"
              step={property.transaction_type === 'sale' ? 25000 : 100}
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
            />
          </div>

          {diff !== 0 && (
            <div className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
              diff < 0 
                ? 'bg-blue-50 border-blue-200 text-blue-800' 
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <span>שינוי במחיר:</span>
              <span dir="ltr">{diff < 0 ? '-' : '+'}{formatILS(Math.abs(diff))} ({percentChange}%)</span>
            </div>
          )}

          <div>
            <label className="text-slate-700 block mb-1 font-medium">סיבת השינוי / הערת תיעוד:</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="למשל: ירידת מחיר לרציניים / הבעלים מתפשר"
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>עדכן מחיר והפעל התראות</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
