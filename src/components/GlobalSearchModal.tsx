import React, { useState } from 'react'
import { Property, Lead } from '../types'
import { formatILS, formatPhone } from '../lib/utils'
import { Search, Building2, Users, ArrowLeft, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-xl p-0 overflow-hidden top-[15%] translate-y-0" showCloseButton={false} onClose={onClose}>
        <DialogTitle className="sr-only">חיפוש מהיר במאגר</DialogTitle>

        {/* Search Bar */}
        <div className="p-3.5 border-b border-border flex items-center gap-2.5 bg-card">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש לפי כתובת, שם לקוח, טלפון או עיר..."
            className="w-full bg-transparent text-foreground placeholder-muted-foreground text-xs focus:outline-none"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded border border-border">ESC</kbd>
        </div>

        {/* Results Body */}
        <div className="p-2 max-h-96 overflow-y-auto flex flex-col gap-3">
          {!q ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              הקלד מילת חיפוש למציאה מהירה של נכסים, לקוחות ומספרי טלפון...
            </div>
          ) : (
            <>
              {/* Matched Properties */}
              {matchedProperties.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    נכסים ({matchedProperties.length})
                  </span>
                  {matchedProperties.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProperty(p)
                        onClose()
                      }}
                      className="p-2 rounded-lg hover:bg-muted cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-muted text-foreground">
                          <Building2 className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{p.street} {p.house_number || ''}, {p.neighborhood || p.city}</p>
                          <p className="text-[11px] text-muted-foreground">{p.rooms} חדרים • {formatILS(p.price)}</p>
                        </div>
                      </div>
                      <ArrowLeft className="size-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {/* Matched Leads */}
              {matchedLeads.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    לקוחות ({matchedLeads.length})
                  </span>
                  {matchedLeads.map(l => (
                    <div
                      key={l.id}
                      onClick={() => {
                        onSelectLead(l)
                        onClose()
                      }}
                      className="p-2 rounded-lg hover:bg-muted cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-muted text-foreground">
                          <Users className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{l.full_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{formatPhone(l.phone)} • תקציב: {formatILS(l.max_budget)}</p>
                        </div>
                      </div>
                      <ArrowLeft className="size-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}

              {matchedProperties.length === 0 && matchedLeads.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  לא נמצאו תוצאות עבור "{query}"
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
