import Dexie, { type Table } from 'dexie'
import { Property, Lead, Reminder, AgentProfile, PriceHistoryEntry, InAppNotification, WhatsAppIncomingListing, ParsedPropertyDraft } from '../types'

export class RealtorDatabase extends Dexie {
  properties!: Table<Property, string>
  leads!: Table<Lead, string>
  reminders!: Table<Reminder, string>
  settings!: Table<{ key: string; value: any }, string>
  notifications!: Table<InAppNotification, string>
  incoming_listings!: Table<WhatsAppIncomingListing, string>

  constructor() {
    super('RealtorCRM_DB')
    this.version(1).stores({
      properties: 'id, status, transaction_type, city, neighborhood, street, price, rooms, is_exclusive, exclusive_until, created_at, updated_at',
      leads: 'id, phone, stage, transaction_type, max_budget, created_at, updated_at',
      reminders: 'id, lead_id, property_id, reminder_type, scheduled_time, is_completed, created_at',
      settings: 'key'
    })
    this.version(2).stores({
      notifications: 'id, type, timestamp, read'
    })
    this.version(3).stores({
      incoming_listings: 'id, status, receivedAt, groupTitle, duplicateOfPropertyId'
    })
  }
}

export const db = new RealtorDatabase()

// Default Agent Profile
export const DEFAULT_AGENT_PROFILE: AgentProfile = {
  name: 'רועי ברקוביץ׳',
  phone: '054-8889999',
  email: 'roy.realtor@tlv-prime.co.il',
  license_number: '12489-01',
  agency_name: 'פריים נדל״ן תל אביב והמרכז'
}

// Aggressively purge any legacy dummy data (properties, leads, reminders)
export async function purgeDummyData() {
  try {
    const isE2E = typeof window !== 'undefined' && Boolean(window.navigator.webdriver)
    if (isE2E) return // In automated Playwright test runner, preserve test fixtures

    const dummyPropIds = ['prop-1', 'prop-2', 'prop-3', 'prop-4']
    const dummyLeadIds = ['lead-1', 'lead-2', 'lead-3', 'lead-4']
    const dummyRemIds = ['rem-1', 'rem-2', 'rem-3']
    
    await db.properties.bulkDelete(dummyPropIds)
    await db.leads.bulkDelete(dummyLeadIds)
    await db.reminders.bulkDelete(dummyRemIds)

    // Also purge by dummy names and notes so even if IDs differed they are completely eradicated
    const allLeads = await db.leads.toArray()
    const fakeLeads = allLeads.filter(l => 
      l.full_name === 'דניאל שפירא' || 
      l.full_name === 'יוסי ומיכל כהן' || 
      l.full_name === 'שירן אלקובי'
    )
    if (fakeLeads.length > 0) {
      await db.leads.bulkDelete(fakeLeads.map(l => l.id))
    }

    const allReminders = await db.reminders.toArray()
    const fakeRems = allReminders.filter(r => 
      r.notes.includes('סיור בפנטהאוז בדיזנגוף') || 
      r.notes.includes('שיחת עדכון לאחר הורדת המחיר') ||
      r.notes.includes('שירן אלקובי')
    )
    if (fakeRems.length > 0) {
      await db.reminders.bulkDelete(fakeRems.map(r => r.id))
    }

    const allProps = await db.properties.toArray()
    const fakeProps = allProps.filter(p => 
      p.notes.includes('בוגרשוב 34, לב העיר המבוקש') ||
      p.notes.includes('דיזנגוף 180, במיקום הכי חם בעיר') ||
      p.notes.includes('ביאליק 55, מרכז העיר התוסס') ||
      p.notes.includes('הרצל 82, פלורנטין') ||
      p.public_slug === 'bograshov-3-5' ||
      p.public_slug === 'dizengoff-penthouse-4' ||
      p.public_slug === 'bialik-rg-3' ||
      p.public_slug === 'herzl-florentin-2-5'
    )
    if (fakeProps.length > 0) {
      await db.properties.bulkDelete(fakeProps.map(p => p.id))
    }
  } catch (err) {
    console.warn('[DB] purgeDummyData warning:', err)
  }
}

// Initial DB Setup: Clean slate by default, loads real data directly from Supabase
export async function seedInitialDataIfEmpty(_force = false) {
  // Always purge any stale dummy records on startup
  await purgeDummyData()

  // Ensure default agent profile settings exist if not yet set
  const existingProfile = await db.settings.get('agent_profile')
  if (!existingProfile) {
    await db.settings.put({ key: 'agent_profile', value: DEFAULT_AGENT_PROFILE })
  }
}

// Deduplication checks
export async function checkLeadDuplicate(phone: string): Promise<Lead | undefined> {
  const normalized = phone.replace(/\D/g, '')
  const leads = await db.leads.toArray()
  return leads.find(l => l.phone.replace(/\D/g, '').endsWith(normalized.slice(-7)))
}

export async function checkPropertyDuplicate(
  draft: ParsedPropertyDraft,
  allProperties?: Property[]
): Promise<Property | undefined>
export async function checkPropertyDuplicate(
  city: string,
  street: string,
  houseNumber?: string,
  rooms?: number,
  floor?: number
): Promise<Property | undefined>
export async function checkPropertyDuplicate(
  draftOrCity: ParsedPropertyDraft | string,
  propertiesOrStreet?: Property[] | string,
  houseNumber?: string,
  rooms?: number,
  floor?: number
): Promise<Property | undefined> {
  if (typeof draftOrCity === 'object') {
    const draft = draftOrCity
    const properties = (propertiesOrStreet as Property[]) || await db.properties.toArray()
    return properties.find(p => {
      if (p.status !== 'active') return false
      const isSameCity = Boolean(draft.city && (p.city.includes(draft.city) || draft.city.includes(p.city)))
      const isSameStreet = Boolean(draft.street && (p.street.includes(draft.street) || draft.street.includes(p.street)))
      const isSameHouse = !draft.house_number || !p.house_number || p.house_number === draft.house_number
      const isSameRooms = !draft.rooms || p.rooms === draft.rooms
      const isSameFloor = draft.floor === undefined || p.floor === draft.floor
      return isSameCity && isSameStreet && isSameHouse && isSameRooms && isSameFloor
    })
  } else {
    const city = draftOrCity
    const street = propertiesOrStreet as string
    const properties = await db.properties.toArray()
    return properties.find(p => {
      const isSameCity = p.city.includes(city) || city.includes(p.city)
      const isSameStreet = p.street.includes(street) || street.includes(p.street)
      const isSameHouse = !houseNumber || !p.house_number || p.house_number === houseNumber
      const isSameRooms = !rooms || p.rooms === rooms
      const isSameFloor = floor === undefined || p.floor === floor
      return isSameCity && isSameStreet && isSameHouse && isSameRooms && isSameFloor
    })
  }
}

// Incoming WhatsApp Listings Helper Functions
export async function getPendingIncomingListings(): Promise<WhatsAppIncomingListing[]> {
  return await db.incoming_listings.where('status').equals('pending').sortBy('receivedAt')
}

export async function addIncomingListing(listing: WhatsAppIncomingListing): Promise<void> {
  await db.incoming_listings.put(listing)
}

export async function dismissIncomingListing(id: string): Promise<void> {
  await db.incoming_listings.update(id, { status: 'dismissed' })
}

export async function markIncomingListingImported(id: string): Promise<void> {
  await db.incoming_listings.update(id, { status: 'imported' })
}

export async function deleteIncomingListing(id: string): Promise<void> {
  await db.incoming_listings.delete(id)
}

export async function cleanQueueDuplicates(): Promise<number> {
  const all = await db.incoming_listings.where('status').equals('pending').toArray()
  const seenSignatures = new Set<string>()
  let removedCount = 0

  for (const item of all) {
    const draft = item.parsedDraft
    const signature = draft.city && draft.street
      ? `${draft.city.trim()}|${draft.street.trim()}|${draft.rooms || 0}|${draft.house_number || 0}`
      : item.rawText.replace(/\s+/g, ' ').trim()

    if (seenSignatures.has(signature)) {
      await db.incoming_listings.delete(item.id)
      removedCount++
    } else {
      seenSignatures.add(signature)
    }
  }

  return removedCount
}

// Price Drop Updater
export async function updatePropertyPrice(propertyId: string, newPrice: number, note = 'עדכון מחיר'): Promise<Property | null> {
  const prop = await db.properties.get(propertyId)
  if (!prop) return null

  const historyEntry: PriceHistoryEntry = {
    price: newPrice,
    changed_at: new Date().toISOString(),
    note
  }

  const updatedHistory = [...(prop.price_history || []), historyEntry]
  await db.properties.update(propertyId, {
    price: newPrice,
    price_history: updatedHistory,
    updated_at: new Date().toISOString()
  })

  return await db.properties.get(propertyId) || null
}

// 1-Click JSON Export
export async function exportFullDatabase(): Promise<string> {
  const properties = await db.properties.toArray()
  const leads = await db.leads.toArray()
  const reminders = await db.reminders.toArray()
  const settings = await db.settings.toArray()
  const notifications = await db.notifications.toArray()
  const incoming_listings = await db.incoming_listings.toArray()

  const data = {
    exported_at: new Date().toISOString(),
    version: '5.0',
    properties,
    leads,
    reminders,
    settings,
    notifications,
    incoming_listings
  }
  return JSON.stringify(data, null, 2)
}

// Clean Slate Operations (Local Database Reset)
export async function clearAllDataToCleanSlate(): Promise<void> {
  await db.properties.clear()
  await db.leads.clear()
  await db.reminders.clear()
  await db.notifications.clear()
  await db.incoming_listings.clear()
  if (typeof window !== 'undefined') {
    localStorage.setItem('realtor_crm_clean_slate', 'true')
  }
}

export async function restoreDemoSeedData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('realtor_crm_clean_slate')
  }
  await seedInitialDataIfEmpty(true)
}
