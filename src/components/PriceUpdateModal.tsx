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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">עדכון מחיר ותיעוד היסטוריה</h3>
              <p className="text-[11px] text-slate-400">{property.street} {property.house_number}, {property.city}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current vs New */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">מחיר נוכחי:</span>
            <span className="text-sm font-bold text-slate-200">{formatILS(property.price)}</span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              מחיר מבוקש חדש: <strong className="text-emerald-400">{formatILS(newPrice)}</strong>
            </label>
            <input
              type="number"
              step={property.transaction_type === 'sale' ? 25000 : 100}
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {diff !== 0 && (
            <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              diff < 0 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <span>שינוי במחיר:</span>
              <span dir="ltr">{diff < 0 ? '-' : '+'}{formatILS(Math.abs(diff))} ({percentChange}%)</span>
            </div>
          )}

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">סיבת השינוי / הערת תיעוד:</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="למשל: ירידת מחיר לרציניים / הבעלים מתפשר"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
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
