export type TransactionType = 'sale' | 'rent' // מכירה / השכרה

export type PropertyStatus = 'active' | 'pending_approval' | 'inactive' | 'sold' | 'rented'

export type PropertyType = 
  | 'apartment'          // דירה
  | 'garden_apartment'   // דירת גן
  | 'penthouse'          // פנטהאוז
  | 'detached'           // בית פרטי/קוטג'
  | 'duplex'             // דופלקס
  | 'commercial'         // מסחרי

export type ParkingType = 'none' | 'single' | 'double' | 'tandem' | 'lift_stacker'

export type ParkingLegal = 'tabu' | 'shared' | 'street_only'

export interface PriceHistoryEntry {
  price: number
  changed_at: string
  note?: string
}

export interface Property {
  id: string
  created_at: string
  updated_at: string
  status: PropertyStatus
  transaction_type: TransactionType
  is_exclusive: boolean
  exclusive_until?: string // ISO date string (YYYY-MM-DD)
  property_type: PropertyType
  city: string
  neighborhood: string
  street: string
  house_number?: string
  apartment_number?: string
  rooms: number
  floor: number
  total_floors: number
  sqm: number
  price: number
  price_history: PriceHistoryEntry[]
  maintenance_fee?: number // ועד בית / ארנונה
  vacancy_date?: string // תאריך פינוי (ריק = מיידי/גמיש)
  has_mamad: boolean
  has_elevator: boolean
  has_balcony: boolean
  has_storage: boolean
  parking_type: ParkingType
  parking_legal: ParkingLegal
  public_slug: string
  hide_exact_address: boolean // Anti-Poaching toggle
  notes: string // הערות פרטיות, פרטי בעלים, פרטי סוכן שת״פ
  photos: string[]
}

export type LeadSource = 'whatsapp' | 'yad2' | 'messenger' | 'phone_call' | 'referral' | 'direct'

export type LeadStage = 
  | 'new_lead'     // ליד חדש
  | 'discovery'    // בירור צרכים
  | 'viewings'     // סיורים בנכסים
  | 'negotiation'  // משא ומתן
  | 'signing'      // עו״ד וחתימה
  | 'closed_won'   // עסקה נסגרה!
  | 'closed_lost'  // לא רלוונטי

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  phone: string
  id_number?: string // ת.ז. עבור הסכם תיווך מחייב
  transaction_type: TransactionType
  source: LeadSource
  stage: LeadStage
  max_budget: number
  target_cities: string[]
  target_neighborhoods: string[]
  min_rooms: number
  preferred_floors: number[]
  require_mamad: boolean
  require_elevator: boolean
  require_balcony: boolean
  require_storage: boolean
  require_parking: boolean
  allowed_parking_types: ParkingType[]
  last_contact_date?: string
  next_followup?: string
  commission_agreed?: string // למשל "2% + מע״מ" או "חודש + מע״מ"
  notes: string
}

export type ReminderType = 'showing_meeting' | 'followup_call' | 'exclusivity_renewal' | 'heskem_tivuch'

export type HesekemStatus = 'not_needed' | 'draft' | 'sent_for_signature' | 'signed'

export interface Reminder {
  id: string
  lead_id?: string
  property_id?: string
  reminder_type: ReminderType
  scheduled_time: string // ISO string
  alert_offset_min: number // e.g. 60
  heskem_status: HesekemStatus
  is_completed: boolean
  notes: string
  created_at: string
}

export interface AgentProfile {
  name: string
  phone: string
  email: string
  license_number: string
  agency_name: string
  avatar_url?: string
}

export interface MatchScore {
  property: Property
  lead: Lead
  score: number // 0-100
  isDisqualified: boolean
  disqualifyReasons: string[]
  breakdown: {
    priceScore: number
    roomsScore: number
    floorScore: number
    parkingScore: number
    featuresScore: number
  }
}
