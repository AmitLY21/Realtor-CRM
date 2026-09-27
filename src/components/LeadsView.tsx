import React, { useState } from 'react'
import { Lead, LeadStage, TransactionType } from '../types'
import { formatILS, formatPhone } from '../lib/utils'
import confetti from 'canvas-confetti'
import { 
  Users, 
  Search, 
  Plus, 
  Kanban, 
  Table as TableIcon, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  DollarSign,
  ShieldAlert,
  FileCheck
} from 'lucide-react'

interface LeadsViewProps {
  leads: Lead[]
  onOpenNewLead: () => void
  onSelectLead: (lead: Lead) => void
  onUpdateLeadStage: (leadId: string, newStage: LeadStage) => void
  leadMatchesMap: Record<string, number> // leadId -> count of matching properties
}

export const STAGE_CONFIG: { id: LeadStage; title: string; color: string; border: string }[] = [
  { id: 'new_lead', title: 'ליד חדש', color: 'from-blue-500/20 to-blue-600/10 text-blue-400', border: 'border-blue-500/30' },
  { id: 'discovery', title: 'בירור צרכים', color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400', border: 'border-indigo-500/30' },
  { id: 'viewings', title: 'סיורים בנכסים', color: 'from-amber-500/20 to-amber-600/10 text-amber-400', border: 'border-amber-500/30' },
  { id: 'negotiation', title: 'משא ומתן', color: 'from-purple-500/20 to-purple-600/10 text-purple-400', border: 'border-purple-500/30' },
  { id: 'signing', title: 'עו״ד וחתימה', color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'closed_won', title: 'עסקה נסגרה 🎉', color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400', border: 'border-emerald-500/30' },
]

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onOpenNewLead,
  onSelectLead,
  onUpdateLeadStage,
  leadMatchesMap
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all')

  const filtered = leads.filter(l => {
    if (txTypeFilter !== 'all' && l.transaction_type !== txTypeFilter) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      l.full_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.id_number && l.id_number.includes(q)) ||
      l.target_cities.some(c => c.toLowerCase().includes(q)) ||
      l.target_neighborhoods.some(n => n.toLowerCase().includes(q))
    )
  })

  const handleWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation()
    const cleanDigits = phone.replace(/\D/g, '')
    const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(`היי ${name}, כאן המתווך שלך, מה שלומך? רציתי לעדכן אותך בהתפתחויות האחרונות בחיפוש הנכס.`)}`, '_blank')
  }

  const handleStageAdvance = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    const currentIndex = STAGE_CONFIG.findIndex(s => s.id === lead.stage)
    if (currentIndex < STAGE_CONFIG.length - 1) {
      const nextStage = STAGE_CONFIG[currentIndex + 1].id
      onUpdateLeadStage(lead.id, nextStage)

      if (nextStage === 'closed_won') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }
  }

  return (
    <div className="space-y-5 pb-24 md:pb-12">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10 self-start">
          <button
            onClick={() => setTxTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            כל הלקוחות ({leads.length})
          </button>
          <button
            onClick={() => setTxTypeFilter('sale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'sale' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            קונים ({leads.filter(l => l.transaction_type === 'sale').length})
          </button>
          <button
            onClick={() => setTxTypeFilter('rent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              txTypeFilter === 'rent' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            שוכרים ({leads.filter(l => l.transaction_type === 'rent').length})
          </button>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת לוח קנבן"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">משפך</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold transition-all ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת טבלה מרוכזת"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">טבלה</span>
            </button>
          </div>

          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card rounded-2xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לקוח לפי שם, טלפון, ת.ז. או אזור מבוקש..."
            className="w-full pl-4 pr-9 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x">
          {STAGE_CONFIG.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id)

            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-80 rounded-2xl glass-panel p-3.5 flex flex-col max-h-[75vh] border-white/10 snap-start"
              >
                {/* Stage Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{stage.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-white/10">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Leads Scroll Area */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                      אין לקוחות בשלב זה
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const matchCount = leadMatchesMap[lead.id] || 0

                      return (
                        <div
                          key={lead.id}
                          className="glass-card rounded-xl p-3.5 border-white/10 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2.5 group"
                          onClick={() => onSelectLead(lead)}
                        >
                          {/* Card Header: Name & Match Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                {lead.full_name}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {formatPhone(lead.phone)}
                              </p>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              lead.transaction_type === 'sale' 
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}>
                              {lead.transaction_type === 'sale' ? 'רכישה' : 'שכירות'}
                            </span>
                          </div>

                          {/* Budget & Target Area */}
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between text-slate-300 font-semibold">
                              <span>תקציב מקסימלי:</span>
                              <span className="text-emerald-400 font-bold">{formatILS(lead.max_budget)}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] truncate">
                              📍 {lead.target_cities.join(', ')} {lead.target_neighborhoods.length > 0 && `(${lead.target_neighborhoods.join(', ')})`}
                            </p>
                          </div>

                          {/* Matching Properties Count */}
                          {matchCount > 0 && (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300">
                              <span className="flex items-center gap-1 font-semibold">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                {matchCount} נכסים מתאימים
                              </span>
                              <span className="underline">הצג</span>
                            </div>
                          )}

                          {/* Card Footer: Quick Actions */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
                                title="חייג"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={(e) => handleWhatsApp(e, lead.phone, lead.full_name)}
                                className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30"
                                title="וואטסאפ"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Advance Stage Button */}
                            {stage.id !== 'closed_won' && (
                              <button
                                onClick={(e) => handleStageAdvance(e, lead)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors"
                                title="קדם שלב במשפך"
                              >
                                <span>השלב הבא</span>
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VIEW MODE 2: HIGH DENSITY TABLE */
        <div className="glass-card rounded-2xl overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3.5">שם הלקוח</th>
                  <th className="p-3.5">טלפון / ת.ז.</th>
                  <th className="p-3.5">סוג עסקה</th>
                  <th className="p-3.5">תקציב</th>
                  <th className="p-3.5">אזורי יעד</th>
                  <th className="p-3.5">שלב במשפך</th>
                  <th className="p-3.5">התאמות</th>
                  <th className="p-3.5 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(lead => {
                  const matchCount = leadMatchesMap[lead.id] || 0
                  return (
                    <tr 
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-bold text-white">{lead.full_name}</td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {formatPhone(lead.phone)}
                        {lead.id_number && <span className="block text-[10px] text-slate-500">ת.ז. {lead.id_number}</span>}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.transaction_type === 'sale' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-teal-500/20 text-teal-300'
                        }`}>
                          {lead.transaction_type === 'sale' ? 'קנייה' : 'שכירות'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">{formatILS(lead.max_budget)}</td>
                      <td className="p-3.5 text-slate-300">{lead.target_cities.join(', ')}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 border border-white/10 font-medium">
                          {STAGE_CONFIG.find(s => s.id === lead.stage)?.title}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {matchCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                            {matchCount} נכסים
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => handleWhatsApp(e, lead.phone, lead.full_name)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
