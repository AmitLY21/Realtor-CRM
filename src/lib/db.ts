import Dexie, { type Table } from 'dexie'
import { Property, Lead, Reminder, AgentProfile, PriceHistoryEntry, InAppNotification } from '../types'

export class RealtorDatabase extends Dexie {
  properties!: Table<Property, string>
  leads!: Table<Lead, string>
  reminders!: Table<Reminder, string>
  settings!: Table<{ key: string; value: any }, string>
  notifications!: Table<InAppNotification, string>

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

// Initial realistic Israeli Seed Data
export async function seedInitialDataIfEmpty(force = false) {
  if (!force && typeof window !== 'undefined' && localStorage.getItem('realtor_crm_clean_slate') === 'true') {
    return
  }

  const count = await db.properties.count()
  if (!force && count > 0) return

  const now = new Date()
  
  // 14 days from now for exclusivity alert
  const exclusivityDate1 = new Date()
  exclusivityDate1.setDate(now.getDate() + 9) // 9 days left (T-14 alert active!)
  
  const exclusivityDate2 = new Date()
  exclusivityDate2.setDate(now.getDate() + 45) // safe

  // Pre-seed Properties
  const initialProperties: Property[] = [
    {
      id: 'prop-1',
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: true,
      exclusive_until: exclusivityDate1.toISOString().split('T')[0],
      property_type: 'apartment',
      city: 'תל אביב-יפו',
      neighborhood: 'לב העיר',
      street: 'בוגרשוב',
      house_number: '34',
      apartment_number: '6',
      rooms: 3.5,
      floor: 3,
      total_floors: 5,
      sqm: 88,
      price: 4350000,
      price_history: [
        { price: 4500000, changed_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), note: 'מחיר פתיחה' },
        { price: 4350000, changed_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), note: 'ירידת מחיר - בעלים גמיש!' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: true,
      parking_type: 'single',
      parking_legal: 'tabu',
      public_slug: 'bograshov-3-5',
      hide_exact_address: true,
      notes: 'בעל הנכס: אבי 050-1112233. מפתח אצלי במשרד. שת״פ פתוח 50/50. לפנות בכל שעה.',
      photos: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-2',
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: false,
      property_type: 'penthouse',
      city: 'תל אביב-יפו',
      neighborhood: 'הצפון הישן',
      street: 'דיזנגוף',
      house_number: '180',
      apartment_number: '12',
      rooms: 4,
      floor: 5,
      total_floors: 5,
      sqm: 125,
      price: 6800000,
      price_history: [
        { price: 6800000, changed_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), note: 'מחיר פתיחה' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: true,
      parking_type: 'double',
      parking_legal: 'tabu',
      public_slug: 'dizengoff-penthouse-4',
      hide_exact_address: false,
      notes: 'סוכן שת״פ: אלון מרימקס 052-4445555. מתואם למחר בערב.',
      photos: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-3',
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'rent',
      is_exclusive: true,
      exclusive_until: exclusivityDate2.toISOString().split('T')[0],
      property_type: 'apartment',
      city: 'רמת גן',
      neighborhood: 'מרכז העיר',
      street: 'ביאליק',
      house_number: '55',
      apartment_number: '4',
      rooms: 3,
      floor: 2,
      total_floors: 4,
      sqm: 75,
      price: 6400,
      maintenance_fee: 250,
      price_history: [
        { price: 6400, changed_at: new Date().toISOString(), note: 'מחיר פתיחה' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: false,
      parking_type: 'single',
      parking_legal: 'tabu',
      public_slug: 'bialik-rg-3',
      hide_exact_address: true,
      notes: 'פינוי מיידי, משופצת קומפלט מהיסוד. דמי תיווך: חודש שכירות + מע״מ.',
      photos: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-4',
      created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: false,
      property_type: 'apartment',
      city: 'תל אביב-יפו',
      neighborhood: 'פלורנטין',
      street: 'הרצל',
      house_number: '82',
      apartment_number: '9',
      rooms: 2.5,
      floor: 2,
      total_floors: 6,
      sqm: 60,
      price: 2950000,
      price_history: [
        { price: 3100000, changed_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), note: 'מחיר פתיחה' },
        { price: 2950000, changed_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), note: 'הורדת מחיר לרציניים' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: false,
      parking_type: 'none',
      parking_legal: 'street_only',
      public_slug: 'herzl-florentin-2-5',
      hide_exact_address: false,
      notes: 'בניין חדש יחסית, מושכרת כרגע ב-6,800 ש״ח (תשואה מצוינת למשקיעים).',
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
      ]
    }
  ]

  // Pre-seed Leads
  const initialLeads: Lead[] = [
    {
      id: 'lead-1',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'יוסי ומיכל כהן',
      phone: '052-3344556',
      id_number: '034981245',
      transaction_type: 'sale',
      source: 'whatsapp',
      stage: 'discovery',
      max_budget: 4500000,
      target_cities: ['תל אביב-יפו'],
      target_neighborhoods: ['לב העיר', 'הצפון הישן'],
      min_rooms: 3.5,
      preferred_floors: [2, 3, 4],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: false,
      require_parking: true,
      allowed_parking_types: ['single', 'double'],
      commission_agreed: '2% + מע״מ',
      next_followup: new Date(Date.now() + 3600000 * 4).toISOString(), // Today!
      notes: 'מחפשים דירה מוארת, הילד מתחיל בית ספר בשנה הבאה. אישרו תקציב ומשכנתא בבנק לאומי.'
    },
    {
      id: 'lead-2',
      created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'דניאל שפירא',
      phone: '050-7788990',
      id_number: '012398471',
      transaction_type: 'sale',
      source: 'yad2',
      stage: 'viewings',
      max_budget: 7200000,
      target_cities: ['תל אביב-יפו'],
      target_neighborhoods: ['הצפון הישן'],
      min_rooms: 4,
      preferred_floors: [4, 5],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: true,
      require_parking: true,
      allowed_parking_types: ['single', 'double'],
      commission_agreed: '2% + מע״מ',
      next_followup: new Date(Date.now() + 3600000 * 2).toISOString(), // Today!
      notes: 'הייטקיסט, מחפש פנטהאוז או קומה גבוהה עם נוף פתוח. רוצה לראות את דיזנגוף 180.'
    },
    {
      id: 'lead-3',
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'שירן אלקובי',
      phone: '054-9988776',
      transaction_type: 'rent',
      source: 'whatsapp',
      stage: 'new_lead',
      max_budget: 6500,
      target_cities: ['רמת גן', 'גבעתיים'],
      target_neighborhoods: ['מרכז העיר'],
      min_rooms: 3,
      preferred_floors: [1, 2, 3],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: false,
      require_parking: true,
      allowed_parking_types: ['single', 'double', 'lift_stacker'],
      commission_agreed: 'חודש שכירות + מע״מ',
      notes: 'מעוניינת להיכנס תוך חודש, עובדת בבורסה. מחפשת דירה מסודרת עם חניה.'
    }
  ]

  // Pre-seed Reminders (Today's Showing & Followup)
  const showingTime = new Date()
  showingTime.setHours(showingTime.getHours() + 1) // 1 hour from now (triggers 1-hr Heskem Tivuch warning!)

  const initialReminders: Reminder[] = [
    {
      id: 'rem-1',
      lead_id: 'lead-2',
      property_id: 'prop-2',
      reminder_type: 'showing_meeting',
      scheduled_time: showingTime.toISOString(),
      alert_offset_min: 60,
      heskem_status: 'draft', // Warning: Not signed yet!
      is_completed: false,
      notes: 'סיור בפנטהאוז בדיזנגוף. לוודא חתימה על הסכם תיווך לפני העלייה לדירה!',
      created_at: new Date().toISOString()
    },
    {
      id: 'rem-2',
      lead_id: 'lead-1',
      property_id: 'prop-1',
      reminder_type: 'followup_call',
      scheduled_time: new Date(Date.now() + 3600000 * 3).toISOString(),
      alert_offset_min: 15,
      heskem_status: 'signed',
      is_completed: false,
      notes: 'שיחת עדכון לאחר הורדת המחיר בבוגרשוב ל-4.35M ₪.',
      created_at: new Date().toISOString()
    }
  ]

  await db.properties.bulkAdd(initialProperties)
  await db.leads.bulkAdd(initialLeads)
  await db.reminders.bulkAdd(initialReminders)
  await db.settings.put({ key: 'agent_profile', value: DEFAULT_AGENT_PROFILE })
}

// Deduplication checks
export async function checkLeadDuplicate(phone: string): Promise<Lead | undefined> {
  const normalized = phone.replace(/\D/g, '')
  const leads = await db.leads.toArray()
  return leads.find(l => l.phone.replace(/\D/g, '').endsWith(normalized.slice(-7)))
}

export async function checkPropertyDuplicate(
  city: string,
  street: string,
  houseNumber?: string,
  rooms?: number,
  floor?: number
): Promise<Property | undefined> {
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

  const data = {
    exported_at: new Date().toISOString(),
    version: '5.0',
    properties,
    leads,
    reminders,
    settings,
    notifications
  }
  return JSON.stringify(data, null, 2)
}

// Clean Slate Operations (Local Database Reset)
export async function clearAllDataToCleanSlate(): Promise<void> {
  await db.properties.clear()
  await db.leads.clear()
  await db.reminders.clear()
  await db.notifications.clear()
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
