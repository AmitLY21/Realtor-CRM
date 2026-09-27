import React, { useState } from 'react'
import confetti from 'canvas-confetti'
import { Lead, LeadStage, TransactionType, STAGE_CONFIG } from '../types'
import { formatILS, formatPhone, getDaysSince } from '../lib/utils'
import { playNotificationChime } from '../lib/notifications'
import { WhatsAppMenu } from './leads/WhatsAppMenu'
import { 
  Search, 
  Plus, 
  Kanban, 
  Table as TableIcon, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft,
  ArrowRight,
  MapPin,
  Trash2,
  Archive,
  MoreVertical,
  Clock,
  Edit3,
  Check,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'

interface LeadsViewProps {
  leads: Lead[]
  onOpenNewLead: () => void
  onSelectLead: (lead: Lead) => void
  onUpdateLeadStage: (leadId: string, newStage: LeadStage) => void
  onDeleteLead?: (leadId: string) => void
  onUpdateLeadNotes?: (leadId: string, notes: string) => void
  leadMatchesMap: Record<string, number> // leadId -> count of matching properties
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onOpenNewLead,
  onSelectLead,
  onUpdateLeadStage,
  onDeleteLead,
  onUpdateLeadNotes,
  leadMatchesMap
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | TransactionType>('all')
  const [showArchived, setShowArchived] = useState(false)

  // Drag and drop state
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null)

  // Card menu & modal states
  const [activeMenuLeadId, setActiveMenuLeadId] = useState<string | null>(null)
  const [activeWhatsAppLeadId, setActiveWhatsAppLeadId] = useState<string | null>(null)
  const [editingNoteLeadId, setEditingNoteLeadId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)

  // Trigger rich confetti celebration
  const triggerCelebration = () => {
    playNotificationChime('success')
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    })
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      })
    }, 250)
  }

  // Update stage with celebration guard
  const handleSetStage = (leadId: string, newStage: LeadStage) => {
    if (newStage === 'closed_won') {
      triggerCelebration()
    }
    onUpdateLeadStage(leadId, newStage)
    setActiveMenuLeadId(null)
  }

  // Stepper handlers
  const handleStageAdvance = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    const currentIndex = STAGE_CONFIG.findIndex(s => s.id === lead.stage)
    if (currentIndex >= 0 && currentIndex < STAGE_CONFIG.length - 1) {
      const nextStage = STAGE_CONFIG[currentIndex + 1].id
      handleSetStage(lead.id, nextStage)
    }
  }

  const handleStageRevert = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    const currentIndex = STAGE_CONFIG.findIndex(s => s.id === lead.stage)
    if (currentIndex > 0) {
      const prevStage = STAGE_CONFIG[currentIndex - 1].id
      handleSetStage(lead.id, prevStage)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId)
    setDraggingLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: LeadStage) => {
    e.preventDefault()
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId
    if (leadId) {
      handleSetStage(leadId, targetStage)
    }
    setDraggingLeadId(null)
    setDragOverStage(null)
  }

  // Inline note editing
  const handleStartEditNote = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation()
    setEditingNoteLeadId(lead.id)
    setNoteDraft(lead.notes || '')
    setActiveMenuLeadId(null)
  }

  const handleSaveNote = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation()
    if (onUpdateLeadNotes) {
      onUpdateLeadNotes(leadId, noteDraft)
    }
    setEditingNoteLeadId(null)
  }

  // Filter leads
  const filtered = leads.filter(l => {
    if (txTypeFilter !== 'all' && l.transaction_type !== txTypeFilter) return false
    if (!showArchived && l.stage === 'closed_lost') return false
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

  // Inactivity calculator
  const getInactivityDays = (lead: Lead): number => {
    return getDaysSince(lead.updated_at || lead.created_at)
  }

  const archivedLeadsCount = leads.filter(l => l.stage === 'closed_lost').length

  return (
    <div className="space-y-4 pb-24 md:pb-12" onClick={() => { setActiveMenuLeadId(null); setActiveWhatsAppLeadId(null); }}>
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setTxTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                txTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              כל הלקוחות ({leads.filter(l => showArchived || l.stage !== 'closed_lost').length})
            </button>
            <button
              onClick={() => setTxTypeFilter('sale')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                txTypeFilter === 'sale' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              קונים ({leads.filter(l => l.transaction_type === 'sale' && (showArchived || l.stage !== 'closed_lost')).length})
            </button>
            <button
              onClick={() => setTxTypeFilter('rent')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                txTypeFilter === 'rent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              שוכרים ({leads.filter(l => l.transaction_type === 'rent' && (showArchived || l.stage !== 'closed_lost')).length})
            </button>
          </div>

          {/* Archive Toggle Button */}
          {archivedLeadsCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showArchived
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="הצג או הסתר עסקאות שנפלו בארכיון"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>ארכיון שנפלו ({archivedLeadsCount})</span>
            </button>
          )}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לקוח לפי שם, טלפון, ת.ז. או אזור מבוקש..."
          className="w-full pr-9 pl-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-none shadow-xs"
        />
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-thin">
          {/* Columns */}
          {STAGE_CONFIG.concat(showArchived ? [{ id: 'closed_lost', title: 'עסקה נפלה / ארכיון', color: 'bg-slate-400' }] : []).map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id)
            const isDropTarget = dragOverStage === stage.id

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl flex flex-col transition-colors border ${
                  isDropTarget 
                    ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20' 
                    : stage.id === 'closed_lost'
                      ? 'bg-slate-100/50 border-dashed border-slate-300'
                      : 'bg-slate-100/70 border-slate-200'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <h3 className="text-xs font-bold text-slate-800">{stage.title}</h3>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[11px] font-bold flex items-center justify-center border border-slate-200 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 flex-1 min-h-[350px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg m-1">
                      <span>אין לקוחות</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">גרור לכאן כרטיס</span>
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const matchCount = leadMatchesMap[lead.id] || 0
                      const daysInactive = getInactivityDays(lead)
                      const isNeedsAttention = daysInactive >= 7 && lead.stage !== 'closed_won' && lead.stage !== 'closed_lost'
                      const isMenuOpen = activeMenuLeadId === lead.id
                      const isWhatsAppMenuOpen = activeWhatsAppLeadId === lead.id
                      const isEditingNote = editingNoteLeadId === lead.id

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => onSelectLead(lead)}
                          className={`bg-white rounded-lg p-3.5 border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2.5 relative ${
                            draggingLeadId === lead.id ? 'opacity-40' : ''
                          }`}
                        >
                          {/* Card Top: Name, Transaction Type & Menu */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{lead.full_name}</h4>
                              <p className="text-[11px] text-slate-500 font-mono" dir="ltr">{formatPhone(lead.phone)}</p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                lead.transaction_type === 'sale'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {lead.transaction_type === 'sale' ? 'רכישה' : 'שכירות'}
                              </span>

                              {/* 3-dots Context Menu Button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuLeadId(isMenuOpen ? null : lead.id)
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                  title="אפשרויות נוספות"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Context Menu Dropdown */}
                                {isMenuOpen && (
                                  <div
                                    className="absolute left-0 mt-1 w-48 rounded-xl bg-white border border-slate-200 p-1 shadow-lg z-50 text-right animate-in fade-in duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100">
                                      קפוץ ישירות לשלב:
                                    </div>
                                    {STAGE_CONFIG.map(st => (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => handleSetStage(lead.id, st.id)}
                                        className={`w-full text-right px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between ${
                                          lead.stage === st.id ? 'font-bold text-blue-600 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span>{st.title}</span>
                                        {lead.stage === st.id && <Check className="w-3 h-3 text-blue-600" />}
                                      </button>
                                    ))}

                                    <div className="my-1 border-t border-slate-100" />

                                    {/* Edit Notes */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleStartEditNote(e, lead)}
                                      className="w-full text-right px-2 py-1.5 text-xs rounded-md text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Edit3 className="w-3 h-3 text-slate-400" />
                                      <span>ערוך הערה פנימית</span>
                                    </button>

                                    {/* Move to Archive */}
                                    {lead.stage !== 'closed_lost' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSetStage(lead.id, 'closed_lost')}
                                        className="w-full text-right px-2 py-1.5 text-xs rounded-md text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                      >
                                        <Archive className="w-3 h-3 text-amber-500" />
                                        <span>העבר לארכיון (נפלה)</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetStage(lead.id, 'discovery')}
                                        className="w-full text-right px-2 py-1.5 text-xs rounded-md text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                      >
                                        <RotateCcw className="w-3 h-3 text-blue-500" />
                                        <span>החזר למשפך פעיל</span>
                                      </button>
                                    )}

                                    {/* Hard Delete */}
                                    {onDeleteLead && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuLeadId(null)
                                          setLeadToDelete(lead)
                                        }}
                                        className="w-full text-right px-2 py-1.5 text-xs rounded-md text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                        <span>מחק לקוח לצמיתות</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
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

                          {/* Inactivity Alert */}
                          {isNeedsAttention && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>ללא מענה מעל {daysInactive} ימים - כדאי ליצור קשר!</span>
                            </div>
                          )}

                          {/* Inline Notes display or editor */}
                          {isEditingNote ? (
                            <div className="space-y-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                rows={2}
                                placeholder="הוסף הערה פנימית על הלקוח..."
                                className="w-full p-2 text-xs rounded border border-blue-400 bg-blue-50/20 text-slate-900 focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingNoteLeadId(null); }}
                                  className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-800"
                                >
                                  ביטול
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveNote(e, lead.id)}
                                  className="px-2.5 py-0.5 text-[10px] rounded bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>שמור</span>
                                </button>
                              </div>
                            </div>
                          ) : lead.notes ? (
                            <div
                              onClick={(e) => handleStartEditNote(e, lead)}
                              className="text-[11px] text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-200 truncate cursor-pointer transition-colors"
                              title="לחץ לעריכת הערה"
                            >
                              💬 {lead.notes}
                            </div>
                          ) : null}

                          {/* Matching Properties Count Badge */}
                          {matchCount > 0 && (
                            <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-between text-[11px] text-blue-700">
                              <span className="flex items-center gap-1 font-semibold">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span>{matchCount} נכסים מתאימים</span>
                              </span>
                              <span className="underline font-medium">הצג</span>
                            </div>
                          )}

                          {/* Card Footer: Stepper Controls & Quick Comms */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {/* Communication Shortcuts */}
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
                                title="חייג ללקוח"
                              >
                                <Phone className="w-3 h-3" />
                              </a>

                              {/* WhatsApp Template Dropdown */}
                              <WhatsAppMenu
                                phone={lead.phone}
                                name={lead.full_name}
                                isOpen={isWhatsAppMenuOpen}
                                onToggle={(e) => {
                                  e.stopPropagation()
                                  setActiveWhatsAppLeadId(isWhatsAppMenuOpen ? null : lead.id)
                                }}
                                onClose={() => setActiveWhatsAppLeadId(null)}
                              />
                            </div>

                            {/* Stepper Buttons (Back & Next) */}
                            <div className="flex items-center gap-1">
                              {/* Revert Button (ArrowRight in RTL) */}
                              {stage.id !== 'new_lead' && stage.id !== 'closed_lost' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleStageRevert(e, lead)}
                                  className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11px] font-medium border border-slate-200 transition-colors"
                                  title="החזר לשלב הקודם"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>הקודם</span>
                                </button>
                              )}

                              {/* Advance Button (ArrowLeft in RTL) */}
                              {stage.id !== 'closed_won' && stage.id !== 'closed_lost' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleStageAdvance(e, lead)}
                                  className="flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-semibold border border-slate-200 transition-colors"
                                  title="השלב הבא"
                                >
                                  <span>השלב הבא</span>
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {/* Restore Button for archived */}
                              {stage.id === 'closed_lost' && (
                                <button
                                  type="button"
                                  onClick={() => handleSetStage(lead.id, 'new_lead')}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>שחזר</span>
                                </button>
                              )}
                            </div>
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
                  <th className="p-3">שם מלא</th>
                  <th className="p-3">סוג</th>
                  <th className="p-3">טלפון</th>
                  <th className="p-3">תקציב מקסימלי</th>
                  <th className="p-3">ערים מבוקשות</th>
                  <th className="p-3">חדרים</th>
                  <th className="p-3">שלב במשפך</th>
                  <th className="p-3">התאמות</th>
                  <th className="p-3 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lead => {
                  const matchCount = leadMatchesMap[lead.id] || 0
                  const stageObj = STAGE_CONFIG.find(s => s.id === lead.stage) || { title: 'עסקה נפלה', color: 'bg-slate-400' }
                  return (
                    <tr 
                      key={lead.id} 
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-bold text-slate-900">{lead.full_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          lead.transaction_type === 'sale'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {lead.transaction_type === 'sale' ? 'רכישה' : 'שכירות'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600" dir="ltr">{formatPhone(lead.phone)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatILS(lead.max_budget)}</td>
                      <td className="p-3 text-slate-600">{lead.target_cities.join(', ')}</td>
                      <td className="p-3 text-slate-600">החל מ-{lead.min_rooms} חד׳</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <span className={`w-1.5 h-1.5 rounded-full ${stageObj.color}`} />
                          {stageObj.title}
                        </span>
                      </td>
                      <td className="p-3">
                        {matchCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {matchCount} נכסים
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                            title="חייג"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanDigits = lead.phone.replace(/\D/g, '')
                              const intlPhone = cleanDigits.startsWith('0') ? '972' + cleanDigits.slice(1) : cleanDigits
                              const text = `היי ${lead.full_name}, כאן המתווך שלך, מה שלומך?`
                              window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`, '_blank')
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                            title="וואטסאפ"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteLead && (
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600"
                              title="מחק"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* CONFIRM DELETE MODAL */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl p-5 space-y-4 text-right">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 text-red-600">
              <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">מחיקת לקוח לצמיתות</h3>
                <p className="text-xs text-slate-500">פעולה זו בלתי הפיכה</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              האם אתה בטוח שברצונך למחוק את הלקוח <strong>{leadToDelete.full_name}</strong> מהמערכת?
              כל ההיסטוריה וההתאמות של לקוח זה יימחקו.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteLead) {
                    onDeleteLead(leadToDelete.id)
                  }
                  setLeadToDelete(null)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>אישור מחיקה</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
