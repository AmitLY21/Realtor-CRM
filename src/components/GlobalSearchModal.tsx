import React, { useState, useEffect } from 'react'
import { Property, Lead } from '../types'
import { formatILS, formatPhone } from '../lib/utils'
import { Search, Building2, Users, ArrowRight, X } from 'lucide-react'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  properties: Property[]
  leads: Lead[]
  onSelectProperty: (property: Property) => void
  onSelectLead: (lead: Lead) => void
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  properties,
  leads,
  onSelectProperty,
  onSelectLead
}) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // toggle
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!isOpen) return null

  const q = query.trim().toLowerCase()

  const matchedProperties = q ? properties.filter(p => 
    p.street.toLowerCase().includes(q) ||
    p.neighborhood.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q) ||
    p.notes.toLowerCase().includes(q) ||
    p.price.toString().includes(q)
  ) : []

  const matchedLeads = q ? leads.filter(l => 
    l.full_name.toLowerCase().includes(q) ||
    l.phone.includes(q) ||
    (l.id_number && l.id_number.includes(q)) ||
    l.target_cities.some(c => c.toLowerCase().includes(q)) ||
    l.target_neighborhoods.some(n => n.toLowerCase().includes(q))
  ) : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/15 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש לפי כתובת, שם לקוח, טלפון או עיר..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">ESC</kbd>
        </div>

        {/* Results Body */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-4">
          {!q ? (
            <div className="p-6 text-center text-xs text-slate-500">
              הקלד מילת חיפוש למציאה מהירה של נכסים, לקוחות ומספרי טלפון...
            </div>
          ) : (
            <>
              {/* Matched Properties */}
              {matchedProperties.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    נכסים ({matchedProperties.length})
                  </span>
                  {matchedProperties.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProperty(p)
                        onClose()
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{p.street} {p.house_number || ''}, {p.neighborhood || p.city}</p>
                          <p className="text-[11px] text-slate-400">{p.rooms} חדרים • {formatILS(p.price)}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Leads */}
              {matchedLeads.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    לקוחות ({matchedLeads.length})
                  </span>
                  {matchedLeads.map(l => (
                    <div
                      key={l.id}
                      onClick={() => {
                        onSelectLead(l)
                        onClose()
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{l.full_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{formatPhone(l.phone)} • תקציב: {formatILS(l.max_budget)}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}

              {matchedProperties.length === 0 && matchedLeads.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  לא נמצאו תוצאות עבור "{query}"
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
