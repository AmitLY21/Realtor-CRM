import { Property, Lead, ParkingType, ParkingLegal, PropertyType, TransactionType } from '../types'
import { ISRAELI_STREET_REGISTRY, lookupNeighborhoodByStreet } from './geoRegistry'

export interface ParsedPropertyDraft {
  transaction_type: TransactionType
  property_type: PropertyType
  city: string
  neighborhood: string
  street: string
  house_number?: string
  rooms?: number
  floor?: number
  total_floors?: number
  sqm?: number
  price?: number
  has_mamad: boolean
  has_elevator: boolean
  has_balcony: boolean
  has_storage: boolean
  parking_type: ParkingType
  parking_legal: ParkingLegal
  contact_name?: string
  contact_phone?: string
  raw_text: string
  confidenceScore: number // 0-100%
  extractedFields: string[]
}

export function parseRawListingText(rawText: string): ParsedPropertyDraft {
  const text = rawText.trim()
  const extractedFields: string[] = []

  // 1. Transaction Type
  let transaction_type: TransactionType = 'sale'
  if (/(להשכרה|שכירות|דמי שכירות|שכר דירה|לחודש|\/חודש)/i.test(text)) {
    transaction_type = 'rent'
    extractedFields.push('סוג עסקה: השכרה')
  } else if (/(למכירה|מכירה|למכירה בבלעדיות)/i.test(text)) {
    transaction_type = 'sale'
    extractedFields.push('סוג עסקה: מכירה')
  }

  // 2. Property Type
  let property_type: PropertyType = 'apartment'
  if (/(דירת גן|ד\.גן)/i.test(text)) {
    property_type = 'garden_apartment'
    extractedFields.push('סוג: דירת גן')
  } else if (/(פנטהאוז|פנטהאוזים|מיני פנטהאוז|רוף טופ)/i.test(text)) {
    property_type = 'penthouse'
    extractedFields.push('סוג: פנטהאוז')
  } else if (/(דופלקס)/i.test(text)) {
    property_type = 'duplex'
    extractedFields.push('סוג: דופלקס')
  } else if (/(קוטג'|קוטג׳|בית פרטי|וילה)/i.test(text)) {
    property_type = 'detached'
    extractedFields.push('סוג: בית פרטי/קוטג׳')
  } else {
    extractedFields.push('סוג: דירה')
  }

  // 3. Rooms
  let rooms: number | undefined
  const roomsMatch = text.match(/(\d+(?:\.5|\.0)?)\s*(?:חדרים|חדר|חד['׳]|ח['׳])/i)
  if (roomsMatch) {
    rooms = parseFloat(roomsMatch[1])
    extractedFields.push(`${rooms} חדרים`)
  }

  // 4. Floor
  let floor: number | undefined
  let total_floors: number | undefined
  const floorMatch = text.match(/(?:קומה|ק['׳])\s*(\d+)(?:\s*(?:מתוך|\/)\s*(\d+))?/i)
  if (floorMatch) {
    floor = parseInt(floorMatch[1], 10)
    if (floorMatch[2]) {
      total_floors = parseInt(floorMatch[2], 10)
      extractedFields.push(`קומה ${floor} מתוך ${total_floors}`)
    } else {
      extractedFields.push(`קומה ${floor}`)
    }
  } else if (/קרקע|ק\.קרקע/i.test(text)) {
    floor = 0
    extractedFields.push('קומת קרקע')
  }

  // 5. Square Meters (מ״ר)
  let sqm: number | undefined
  const sqmMatch = text.match(/(\d+)\s*(?:מ"ר|מר|מ״ר|מטר|sqm)/i)
  if (sqmMatch) {
    sqm = parseInt(sqmMatch[1], 10)
    extractedFields.push(`${sqm} מ״ר`)
  }

  // 6. Price
  let price: number | undefined
  // Look for patterns like 3,850,000 or 3850000 or 8,500 ₪
  const priceMatches = text.match(/(?:מחיר|מחיר מבוקש|דמי שכירות|ש"ח|₪)?\s*[:=\-]?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|\d{4,9})\s*(?:₪|ש"ח|שח|אלף|מיליון)?/i)
  if (priceMatches) {
    // Find numeric chunks that resemble prices
    const potentialNumbers = text.match(/\b\d{1,3}(?:,\d{3})+\b|\b\d{4,8}\b/g)
    if (potentialNumbers) {
      for (const numStr of potentialNumbers) {
        const val = parseInt(numStr.replace(/,/g, ''), 10)
        if (transaction_type === 'sale' && val >= 500000 && val <= 50000000) {
          price = val
          extractedFields.push(`${val.toLocaleString()} ₪`)
          break
        } else if (transaction_type === 'rent' && val >= 2000 && val <= 80000) {
          price = val
          extractedFields.push(`${val.toLocaleString()} ₪/חודש`)
          break
        }
      }
    }
  }

  // 7. Amenities: Mamad, Elevator, Balcony, Storage
  const has_mamad = /(ממ"ד|ממד|מרחב מוגן)/i.test(text)
  if (has_mamad) extractedFields.push('ממ״ד')

  const has_elevator = /(מעלית|יש מעלית)/i.test(text)
  if (has_elevator) extractedFields.push('מעלית')

  const has_balcony = /(מרפסת|מרפסת שמש|מרפסת גג|טראסה)/i.test(text)
  if (has_balcony) extractedFields.push('מרפסת')

  const has_storage = /(מחסן|יש מחסן)/i.test(text)
  if (has_storage) extractedFields.push('מחסן')

  // 8. Parking
  let parking_type: ParkingType = 'none'
  let parking_legal: ParkingLegal = 'street_only'

  if (/(חניה כפולה|2 חניות)/i.test(text)) {
    parking_type = 'double'
    extractedFields.push('חניה כפולה')
  } else if (/(חניה עוקבת|טורית|טנדם)/i.test(text)) {
    parking_type = 'tandem'
    extractedFields.push('חניה עוקבת')
  } else if (/(מכפיל|מכפיל חניה|מעלית רכב)/i.test(text)) {
    parking_type = 'lift_stacker'
    extractedFields.push('חניה במכפיל')
  } else if (/(חניה|חנייה|יש חניה)/i.test(text)) {
    parking_type = 'single'
    extractedFields.push('חניה')
  }

  if (/(חניה בטאבו|טאבו)/i.test(text)) {
    parking_legal = 'tabu'
    extractedFields.push('רשומה בטאבו')
  } else if (/(חניה משותפת)/i.test(text)) {
    parking_legal = 'shared'
  }

  // 9. Street and City Detection
  let city = 'תל אביב-יפו' // Default major hub
  let neighborhood = ''
  let street = ''
  let house_number: string | undefined

  for (const entry of ISRAELI_STREET_REGISTRY) {
    if (text.includes(entry.street)) {
      street = entry.street
      city = entry.city
      neighborhood = entry.neighborhood
      extractedFields.push(`רחוב: ${street}`)
      extractedFields.push(`שכונה: ${neighborhood}`)
      break
    }
  }

  // If no street from registry, try extracting from "ברחוב X" or "רחוב X"
  if (!street) {
    const streetMatch = text.match(/(?:ברחוב|רחוב|ב?שד(?:רות)?)\s+([א-ת\s]+?)(?:\s+(\d+)|[,\.\n]|$)/i)
    if (streetMatch && streetMatch[1].trim().length > 2) {
      street = streetMatch[1].trim()
      if (streetMatch[2]) {
        house_number = streetMatch[2]
      }
      const guessedNeighbor = lookupNeighborhoodByStreet(street, city)
      if (guessedNeighbor) {
        neighborhood = guessedNeighbor
      }
      extractedFields.push(`רחוב: ${street}`)
    }
  }

  // Look for house number if street was found
  if (street && !house_number) {
    const numRegex = new RegExp(`${street}\\s+(\\d+)`, 'i')
    const matchNum = text.match(numRegex)
    if (matchNum) {
      house_number = matchNum[1]
      extractedFields.push(`מספר בית: ${house_number}`)
    }
  }

  // 10. Phone and Name
  let contact_phone: string | undefined
  const phoneMatch = text.match(/(?:05\d-?\d{7}|05\d{8})/i)
  if (phoneMatch) {
    contact_phone = phoneMatch[0]
    extractedFields.push(`טלפון: ${contact_phone}`)
  }

  let contact_name: string | undefined
  const nameMatch = text.match(/(?:לפרטים|איש קשר|סוכן|מתווך|בעל הנכס)[:\s]+([א-ת\s]{2,15})(?:\s|05|\n|$)/i)
  if (nameMatch) {
    contact_name = nameMatch[1].trim()
    extractedFields.push(`איש קשר: ${contact_name}`)
  }

  // Calculate Confidence Score
  let score = 20
  if (rooms) score += 20
  if (price) score += 20
  if (street) score += 20
  if (floor !== undefined) score += 10
  if (sqm) score += 10

  return {
    transaction_type,
    property_type,
    city: city || 'תל אביב-יפו',
    neighborhood: neighborhood || 'מרכז העיר',
    street: street || 'לא צוין',
    house_number,
    rooms,
    floor: floor ?? 1,
    total_floors: total_floors ?? 4,
    sqm: sqm ?? 80,
    price,
    has_mamad,
    has_elevator,
    has_balcony,
    has_storage,
    parking_type,
    parking_legal,
    contact_name,
    contact_phone,
    raw_text: text,
    confidenceScore: Math.min(score, 100),
    extractedFields
  }
}
