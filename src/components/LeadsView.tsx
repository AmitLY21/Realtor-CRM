import React, { useState } from 'react'
import { Lead, LeadStage, TransactionType } from '../types'
import { formatILS, formatPhone } from '../lib/utils'
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
  MapPin
} from 'lucide-react'

interface LeadsViewProps {
  leads: Lead[]
  onOpenNewLead: () => void
  onSelectLead: (lead: Lead) => void
  onUpdateLeadStage: (leadId: string, newStage: LeadStage) => void
  leadMatchesMap: Record<string, number> // leadId -> count of matching properties
}

export const STAGE_CONFIG: { id: LeadStage; title: string }[] = [
  { id: 'new_lead', title: 'ליד חדש' },
  { id: 'discovery', title: 'בירור צרכים' },
  { id: 'viewings', title: 'סיורים בנכסים' },
  { id: 'negotiation', title: 'משא ומתן' },
  { id: 'signing', title: 'עו״ד וחתימה' },
  { id: 'closed_won', title: 'עסקה נסגרה' },
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
    }
  }

  return (
    <div className="space-y-4 pb-24 md:pb-12">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 self-start">
          <button
            onClick={() => setTxTypeFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            כל הלקוחות ({leads.length})
          </button>
          <button
            onClick={() => setTxTypeFilter('sale')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'sale' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            קונים ({leads.filter(l => l.transaction_type === 'sale').length})
          </button>
          <button
            onClick={() => setTxTypeFilter('rent')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              txTypeFilter === 'rent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            שוכרים ({leads.filter(l => l.transaction_type === 'rent').length})
          </button>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="תצוגת לוח משפך"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">משפך</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="תצוגת טבלה"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">טבלה</span>
            </button>
          </div>

          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>לקוח חדש</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="ui-panel rounded-xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לקוח לפי שם, טלפון, ת.ז. או אזור מבוקש..."
            className="w-full pl-3 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x">
          {STAGE_CONFIG.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id)

            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-72 rounded-xl bg-slate-100/70 border border-slate-200 p-3 flex flex-col max-h-[75vh] snap-start"
              >
                {/* Stage Column Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{stage.title}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Leads Scroll Area */}
                <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      אין לקוחות
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const matchCount = leadMatchesMap[lead.id] || 0

                      return (
                        <div
                          key={lead.id}
                          className="bg-white rounded-lg p-3 border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors space-y-2 shadow-xs group"
                          onClick={() => onSelectLead(lead)}
                        >
                          {/* Card Header: Name & Match Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {lead.full_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {formatPhone(lead.phone)}
                              </p>
                            </div>

                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {lead.transaction_type === 'sale' ? 'רכישה' : 'שכירות'}
                            </span>
                          </div>

                          {/* Budget & Target Area */}
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center justify-between text-slate-600 font-medium">
                              <span>תקציב:</span>
                              <span className="text-slate-900 font-bold">{formatILS(lead.max_budget)}</span>
                            </div>
                            <p className="text-slate-500 text-[11px] truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{lead.target_cities.join(', ')} {lead.target_neighborhoods.length > 0 && `(${lead.target_neighborhoods.join(', ')})`}</span>
                            </p>
                          </div>

                          {/* Matching Properties Count */}
                          {matchCount > 0 && (
                            <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-between text-[11px] text-blue-700">
                              <span className="flex items-center gap-1 font-semibold">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                {matchCount} נכסים מתאימים
                              </span>
                              <span className="underline">הצג</span>
                            </div>
                          )}

                          {/* Card Footer: Quick Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
                                title="חייג"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <button
                                onClick={(e) => handleWhatsApp(e, lead.phone, lead.full_name)}
                                className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
                                title="וואטסאפ"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Advance Stage Button */}
                            {stage.id !== 'closed_won' && (
                              <button
                                onClick={(e) => handleStageAdvance(e, lead)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium border border-slate-200 transition-colors"
                                title="קדם שלב במשפך"
                              >
                                <span>הבא</span>
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
        /* VIEW MODE 2: TABLE */
        <div className="ui-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">שם הלקוח</th>
                  <th className="p-3">טלפון / ת.ז.</th>
                  <th className="p-3">סוג עסקה</th>
                  <th className="p-3">תקציב</th>
                  <th className="p-3">אזורי יעד</th>
                  <th className="p-3">שלב במשפך</th>
                  <th className="p-3">התאמות</th>
                  <th className="p-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lead => {
                  const matchCount = leadMatchesMap[lead.id] || 0
                  return (
                    <tr 
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-bold text-slate-900">{lead.full_name}</td>
                      <td className="p-3 font-mono text-slate-600">
                        {formatPhone(lead.phone)}
                        {lead.id_number && <span className="block text-[10px] text-slate-400">ת.ז. {lead.id_number}</span>}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.transaction_type === 'sale' ? 'קנייה' : 'שכירות'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{formatILS(lead.max_budget)}</td>
                      <td className="p-3 text-slate-600">{lead.target_cities.join(', ')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {STAGE_CONFIG.find(s => s.id === lead.stage)?.title}
                        </span>
                      </td>
                      <td className="p-3">
                        {matchCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                            {matchCount} נכסים
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => handleWhatsApp(e, lead.phone, lead.full_name)}
                            className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
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
