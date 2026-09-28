import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  db, 
  seedInitialDataIfEmpty, 
  DEFAULT_AGENT_PROFILE, 
  updatePropertyPrice 
} from './lib/db'
import { calculateMatchMatrix } from './lib/matchingEngine'
import { 
  sendPushNotification, 
  markAllNotificationsAsRead 
} from './lib/notifications'
import { ensureStoragePersistence } from './lib/imageCompressor'
import { Property, Lead, Reminder, AgentProfile, InAppNotification, ActiveModal } from './types'

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
import { EditPropertyModal } from './components/EditPropertyModal'
import { GlobalSearchModal } from './components/GlobalSearchModal'
import { NotificationCenter } from './components/NotificationCenter'
import { OnboardingTourModal } from './components/OnboardingTourModal'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // Live queries from Dexie
  const properties = useLiveQuery(() => db.properties.toArray(), [], [] as Property[])
  const leads = useLiveQuery(() => db.leads.toArray(), [], [] as Lead[])
  const reminders = useLiveQuery(() => db.reminders.toArray(), [], [] as Reminder[])
  const notifications = useLiveQuery(
    () => db.notifications.orderBy('timestamp').reverse().toArray(),
    [],
    [] as InAppNotification[]
  )
  const profileSetting = useLiveQuery(() => db.settings.get('agent_profile'), [], undefined)
  const agentProfile: AgentProfile = profileSetting?.value || DEFAULT_AGENT_PROFILE

  // Initialize DB and Seed Data
  useEffect(() => {
    async function init() {
      await seedInitialDataIfEmpty()
      await ensureStoragePersistence()
      setIsInitialized(true)

      // First-time onboarding tour auto-launch
      const hasSeenTour = typeof window !== 'undefined' && localStorage.getItem('realtor_crm_onboarded') === 'true'
      if (!hasSeenTour) {
        setActiveModal({ type: 'onboarding_tour' })
      }

      // Handle Web Share Target API query params (e.g. /?share=1&text=...)
      const params = new URLSearchParams(window.location.search)
      const shareText = params.get('text') || params.get('title') || params.get('url')
      if (params.get('share') || shareText) {
        setActiveModal({ type: 'smart_paste', initialText: shareText || '' })
        try {
          window.history.replaceState({}, '', window.location.pathname)
        } catch {
          // Ignore history errors
        }
      }
    }
    init()
  }, [])

  // Calculate Real-Time Matches Matrix via deep module
  const { allMatches, hotMatches, propMatchesMap, leadMatchesMap } = useMemo(
    () => calculateMatchMatrix(properties, leads),
    [properties, leads]
  )

  // Unread notification count
  const unreadCount = notifications.filter(n => !n.read).length

  // Handlers
  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsAsRead()
  }

  const handleToggleAntiPoach = async (propertyId: string, currentVal: boolean) => {
    await db.properties.update(propertyId, { hide_exact_address: !currentVal })
  }

  const handlePriceUpdate = async (propertyId: string, newPrice: number, note: string) => {
    const updated = await updatePropertyPrice(propertyId, newPrice, note)
    if (updated) {
      await sendPushNotification('ירידת מחיר עודכנה!', `${updated.street}: המחיר עודכן ל-${newPrice.toLocaleString()} ₪`, 'price_drop')
    }
  }

  const handleUpdateProperty = async (updated: Property) => {
    await db.properties.put(updated)
    await sendPushNotification('נכס עודכן בהצלחה', `${updated.street} ${updated.house_number || ''}, ${updated.city}`, 'system')
    setActiveModal(null)
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
        onOpenSearch={() => setActiveModal({ type: 'search' })}
        onOpenSmartPaste={() => setActiveModal({ type: 'smart_paste' })}
        onOpenNewLead={() => setActiveModal({ type: 'new_lead' })}
        onOpenNotifications={() => setActiveModal({ type: 'notifications' })}
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
              setActiveModal({ type: 'public_preview', property: prop, isPrintMode: false })
            }}
            onSelectLead={(_lead) => {
              setActiveTab('leads')
            }}
            onUpdateReminderStatus={handleUpdateReminderStatus}
            onUpdateHeskemStatus={handleUpdateHeskemStatus}
            onNavigateToMatches={() => setActiveTab('matches')}
            onOpenSmartPaste={() => setActiveModal({ type: 'smart_paste' })}
            onOpenNewLead={() => setActiveModal({ type: 'new_lead' })}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesView
            properties={properties}
            onOpenSmartPaste={() => setActiveModal({ type: 'smart_paste' })}
            onSelectProperty={(prop) => {
              setActiveModal({ type: 'public_preview', property: prop, isPrintMode: false })
            }}
            onOpenPublicPreview={(prop) => {
              setActiveModal({ type: 'public_preview', property: prop, isPrintMode: false })
            }}
            onOpenPrintSheet={(prop) => {
              setActiveModal({ type: 'public_preview', property: prop, isPrintMode: true })
            }}
            onToggleAntiPoach={handleToggleAntiPoach}
            onUpdatePrice={(prop) => setActiveModal({ type: 'price_update', property: prop })}
            onEditProperty={(prop) => setActiveModal({ type: 'edit_property', property: prop })}
            matchesMap={propMatchesMap}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsView
            leads={leads}
            onOpenNewLead={() => setActiveModal({ type: 'new_lead' })}
            onSelectLead={(_lead) => {
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
              setActiveModal({ type: 'public_preview', property: prop, isPrintMode: false })
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
            onOpenOnboardingTour={() => setActiveModal({ type: 'onboarding_tour' })}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <SmartPasteModal
        isOpen={activeModal?.type === 'smart_paste'}
        initialText={activeModal?.type === 'smart_paste' ? activeModal.initialText : undefined}
        onClose={() => setActiveModal(null)}
        onPropertyAdded={(_newProp) => {
          setActiveTab('properties')
        }}
      />

      <NewLeadModal
        isOpen={activeModal?.type === 'new_lead'}
        onClose={() => setActiveModal(null)}
        onLeadAdded={(_newLead) => {
          setActiveTab('leads')
        }}
      />

      <PropertyPublicView
        property={activeModal?.type === 'public_preview' ? activeModal.property : null}
        agent={agentProfile}
        isOpen={activeModal?.type === 'public_preview'}
        onClose={() => setActiveModal(null)}
        isPrintMode={activeModal?.type === 'public_preview' ? activeModal.isPrintMode : false}
      />

      <PriceUpdateModal
        property={activeModal?.type === 'price_update' ? activeModal.property : null}
        isOpen={activeModal?.type === 'price_update'}
        onClose={() => setActiveModal(null)}
        onPriceUpdated={handlePriceUpdate}
      />

      <EditPropertyModal
        property={activeModal?.type === 'edit_property' ? activeModal.property : null}
        isOpen={activeModal?.type === 'edit_property'}
        onClose={() => setActiveModal(null)}
        onSave={handleUpdateProperty}
      />

      <GlobalSearchModal
        isOpen={activeModal?.type === 'search'}
        onClose={() => setActiveModal(null)}
        properties={properties}
        leads={leads}
        onSelectProperty={(prop) => {
          setActiveModal({ type: 'public_preview', property: prop, isPrintMode: false })
        }}
        onSelectLead={() => {
          setActiveTab('leads')
        }}
      />

      <NotificationCenter
        isOpen={activeModal?.type === 'notifications'}
        onClose={() => setActiveModal(null)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />

      <OnboardingTourModal
        isOpen={activeModal?.type === 'onboarding_tour'}
        onClose={() => {
          localStorage.setItem('realtor_crm_onboarded', 'true')
          setActiveModal(null)
        }}
        initialProfile={agentProfile}
        onComplete={async (newProfile) => {
          await db.settings.put({ key: 'agent_profile', value: newProfile })
          localStorage.setItem('realtor_crm_onboarded', 'true')
          await sendPushNotification('ברוך הבא ל-Realtor CRM!', `פרופיל המתווך של ${newProfile.name} הוגדר בהצלחה.`, 'match')
        }}
      />
    </div>
  )
}

export default App

