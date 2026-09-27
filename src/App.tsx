import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  db, 
  seedInitialDataIfEmpty, 
  DEFAULT_AGENT_PROFILE, 
  updatePropertyPrice 
} from './lib/db'
import { calculateMatchScore } from './lib/matchingEngine'
import { 
  getNotifications, 
  saveNotifications, 
  sendPushNotification, 
  InAppNotification 
} from './lib/notifications'
import { ensureStoragePersistence } from './lib/imageCompressor'
import { Property, Lead, Reminder, AgentProfile, MatchScore } from './types'

// Components
import { Header } from './components/Header'
import { Navigation, TabType } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { PropertiesView } from './components/PropertiesView'
import { LeadsView } from './components/LeadsView'
import { MatchesView } from './components/MatchesView'
import { SettingsView } from './components/SettingsView'
import { SmartPasteModal } from './components/SmartPasteModal'
import { NewLeadModal } from './components/NewLeadModal'
import { PropertyPublicView } from './components/PropertyPublicView'
import { PriceUpdateModal } from './components/PriceUpdateModal'
import { GlobalSearchModal } from './components/GlobalSearchModal'
import { NotificationCenter } from './components/NotificationCenter'
import { OnboardingTourModal } from './components/OnboardingTourModal'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isInitialized, setIsInitialized] = useState(false)

  // Modals state
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false)
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [publicPreviewProp, setPublicPreviewProp] = useState<Property | null>(null)
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [priceUpdateProp, setPriceUpdateProp] = useState<Property | null>(null)
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState<InAppNotification[]>([])

  const properties = useLiveQuery(() => db.properties.toArray(), [], [] as Property[])
  const leads = useLiveQuery(() => db.leads.toArray(), [], [] as Lead[])
  const reminders = useLiveQuery(() => db.reminders.toArray(), [], [] as Reminder[])
  const profileSetting = useLiveQuery(() => db.settings.get('agent_profile'), [], undefined)
  const agentProfile: AgentProfile = profileSetting?.value || DEFAULT_AGENT_PROFILE

  // Initialize DB and Seed Data
  useEffect(() => {
    async function init() {
      await seedInitialDataIfEmpty()
      await ensureStoragePersistence()
      setNotifications(getNotifications())
      setIsInitialized(true)

      // First-time onboarding tour auto-launch
      const hasSeenTour = typeof window !== 'undefined' && localStorage.getItem('realtor_crm_onboarded') === 'true'
      if (!hasSeenTour) {
        setIsOnboardingTourOpen(true)
      }

      // Handle Web Share Target API query params (e.g. /?share=1&text=...)
      const params = new URLSearchParams(window.location.search)
      if (params.get('share') || params.get('text')) {
        setIsSmartPasteOpen(true)
      }
    }
    init()
  }, [])

  // Calculate Real-Time Matches Matrix
  const { allMatches, hotMatches, propMatchesMap, leadMatchesMap } = useMemo(() => {
    const matches: MatchScore[] = []
    const propMap: Record<string, number> = {}
    const leadMap: Record<string, number> = {}

    for (const prop of properties) {
      if (prop.status !== 'active') continue
      for (const lead of leads) {
        if (lead.stage === 'closed_lost') continue
        const result = calculateMatchScore(prop, lead)
        if (!result.isDisqualified && result.score >= 50) {
          matches.push(result)
          if (result.score >= 70) {
            propMap[prop.id] = (propMap[prop.id] || 0) + 1
            leadMap[lead.id] = (leadMap[lead.id] || 0) + 1
          }
        }
      }
    }

    const hot = matches.filter(m => m.score >= 85)
    return {
      allMatches: matches,
      hotMatches: hot,
      propMatchesMap: propMap,
      leadMatchesMap: leadMap
    }
  }, [properties, leads])

  // Unread notification count
  const unreadCount = notifications.filter(n => !n.read).length

  // Handlers
  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    saveNotifications(updated)
  }

  const handleToggleAntiPoach = async (propertyId: string, currentVal: boolean) => {
    await db.properties.update(propertyId, { hide_exact_address: !currentVal })
  }

  const handlePriceUpdate = async (propertyId: string, newPrice: number, note: string) => {
    const updated = await updatePropertyPrice(propertyId, newPrice, note)
    if (updated) {
      await sendPushNotification('ירידת מחיר עודכנה!', `${updated.street}: המחיר עודכן ל-${newPrice.toLocaleString()} ₪`, 'price_drop')
      setNotifications(getNotifications())
    }
  }

  const handleUpdateReminderStatus = async (reminderId: string, isCompleted: boolean) => {
    await db.reminders.update(reminderId, { is_completed: isCompleted })
  }

  const handleUpdateHeskemStatus = async (reminderId: string, status: Reminder['heskem_status']) => {
    await db.reminders.update(reminderId, { heskem_status: status })
  }

  const handleUpdateLeadStage = async (leadId: string, newStage: Lead['stage']) => {
    await db.leads.update(leadId, { stage: newStage, updated_at: new Date().toISOString() })
  }

  const handleDeleteLead = async (leadId: string) => {
    await db.leads.delete(leadId)
  }

  const handleUpdateLeadNotes = async (leadId: string, notes: string) => {
    await db.leads.update(leadId, { notes, updated_at: new Date().toISOString() })
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="w-10 h-10 rounded-xl bg-blue-600 animate-pulse mb-3" />
        <p className="text-sm font-medium text-slate-600">טוען נתוני מאגר מקומי...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top App Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSmartPaste={() => setIsSmartPasteOpen(true)}
        onOpenNewLead={() => setIsNewLeadOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Navigation (Tabs for Desktop & Bottom Bar for Mobile) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={hotMatches.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            properties={properties}
            leads={leads}
            reminders={reminders}
            hotMatches={hotMatches}
            onSelectProperty={(prop) => {
              setPublicPreviewProp(prop)
              setIsPrintMode(false)
            }}
            onSelectLead={(_lead) => {
              setActiveTab('leads')
            }}
            onUpdateReminderStatus={handleUpdateReminderStatus}
            onUpdateHeskemStatus={handleUpdateHeskemStatus}
            onNavigateToMatches={() => setActiveTab('matches')}
            onOpenSmartPaste={() => setIsSmartPasteOpen(true)}
            onOpenNewLead={() => setIsNewLeadOpen(true)}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesView
            properties={properties}
            onOpenSmartPaste={() => setIsSmartPasteOpen(true)}
            onSelectProperty={(prop) => {
              setPublicPreviewProp(prop)
              setIsPrintMode(false)
            }}
            onOpenPublicPreview={(prop) => {
              setPublicPreviewProp(prop)
              setIsPrintMode(false)
            }}
            onOpenPrintSheet={(prop) => {
              setPublicPreviewProp(prop)
              setIsPrintMode(true)
            }}
            onToggleAntiPoach={handleToggleAntiPoach}
            onUpdatePrice={(prop) => setPriceUpdateProp(prop)}
            matchesMap={propMatchesMap}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsView
            leads={leads}
            onOpenNewLead={() => setIsNewLeadOpen(true)}
            onSelectLead={(_lead) => {
              // Switch to matches filtered for this lead
              setActiveTab('matches')
            }}
            onUpdateLeadStage={handleUpdateLeadStage}
            onDeleteLead={handleDeleteLead}
            onUpdateLeadNotes={handleUpdateLeadNotes}
            leadMatchesMap={leadMatchesMap}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            matches={allMatches}
            onSelectProperty={(prop) => {
              setPublicPreviewProp(prop)
              setIsPrintMode(false)
            }}
            onSelectLead={(_lead) => {
              setActiveTab('leads')
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            key={`${agentProfile.name}-${agentProfile.phone}-${agentProfile.agency_name}`}
            agentProfile={agentProfile}
            onUpdateAgentProfile={async (newProfile) => {
              await db.settings.put({ key: 'agent_profile', value: newProfile })
            }}
            onOpenOnboardingTour={() => setIsOnboardingTourOpen(true)}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <SmartPasteModal
        isOpen={isSmartPasteOpen}
        onClose={() => setIsSmartPasteOpen(false)}
        onPropertyAdded={(_newProp) => {
          setActiveTab('properties')
        }}
      />

      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onLeadAdded={(_newLead) => {
          setActiveTab('leads')
        }}
      />

      <PropertyPublicView
        property={publicPreviewProp}
        agent={agentProfile}
        isOpen={!!publicPreviewProp}
        onClose={() => setPublicPreviewProp(null)}
        isPrintMode={isPrintMode}
      />

      <PriceUpdateModal
        property={priceUpdateProp}
        isOpen={!!priceUpdateProp}
        onClose={() => setPriceUpdateProp(null)}
        onPriceUpdated={handlePriceUpdate}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        properties={properties}
        leads={leads}
        onSelectProperty={(prop) => {
          setPublicPreviewProp(prop)
          setIsPrintMode(false)
        }}
        onSelectLead={() => {
          setActiveTab('leads')
        }}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />

      <OnboardingTourModal
        isOpen={isOnboardingTourOpen}
        onClose={() => {
          localStorage.setItem('realtor_crm_onboarded', 'true')
          setIsOnboardingTourOpen(false)
        }}
        initialProfile={agentProfile}
        onComplete={async (newProfile) => {
          await db.settings.put({ key: 'agent_profile', value: newProfile })
          localStorage.setItem('realtor_crm_onboarded', 'true')
          await sendPushNotification('ברוך הבא ל-Realtor CRM!', `פרופיל המתווך של ${newProfile.name} הוגדר בהצלחה.`, 'match')
          setNotifications(getNotifications())
        }}
      />
    </div>
  )
}

export default App
