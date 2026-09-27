import { ParkingType, ParkingLegal, PropertyType, TransactionType } from '../types'
import { ISRAELI_STREET_REGISTRY, ISRAELI_CITY_ABBREVIATIONS, lookupNeighborhoodByStreet } from './geoRegistry'

export interface ParsedPropertyDraft {
  transaction_type: TransactionType
  property_type: PropertyType
  is_exclusive: boolean
  city?: string
  neighborhood?: string
  street?: string
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
  missingFields: string[]
}

export function parseRawListingText(rawText: string): ParsedPropertyDraft {
  // 0. Pre-clean WhatsApp headers, timestamps, and invisible characters
  let text = rawText
    .replace(/^\[\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*/i, '')
    .replace(/^\[\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?\]\s*/i, '')
    .replace(/^[\u200B-\u200D\uFEFF]/, '')
    .trim()

  const extractedFields: string[] = []

  // 1. Exclusivity
  const is_exclusive = /(?:בבלעדיות|למכירה בבלעדיות|בלעדיות|בלעדי למשרדנו|בלעדי)/i.test(text)
  if (is_exclusive) {
    extractedFields.push('בבלעדיות')
  }

  // 2. Price Extraction (handles Israeli broker slang like "שיווק 3490", "שיווק 4100.", "מחיר מבוקש 3,730,000 ש"ח")
  let price: number | undefined
  let priceFoundType: 'sale' | 'rent' | undefined

  // Pattern A: Broker slang "שיווק 3490" or "מחיר שיווק 4100" (numbers 1000..9999 represent thousands of thousands = millions)
  const shivukMatch = text.match(/(?:שיווק|מחיר שיווק|מחיר יעד)\s*[:=-]?\s*(\d{1,3}(?:,\d{3})+|\d{3,5}(?:\.\d+)?(?:\s*[Mmמ])?)/i)
  if (shivukMatch) {
    const rawNum = shivukMatch[1].replace(/,/g, '')
    if (/^\d{4}$/.test(rawNum)) {
      const val = parseInt(rawNum, 10)
      if (val >= 1000 && val <= 9999) {
        price = val * 1000
        priceFoundType = 'sale'
        extractedFields.push(`מחיר שיווק: ${price.toLocaleString()} ₪`)
      }
    } else if (rawNum.includes('.') || /[Mmמ]/.test(shivukMatch[1])) {
      const val = parseFloat(rawNum.replace(/[Mmמ]/, ''))
      price = Math.round(val * 1000000)
      priceFoundType = 'sale'
      extractedFields.push(`מחיר שיווק: ${price.toLocaleString()} ₪`)
    } else {
      const val = parseInt(rawNum, 10)
      if (val > 100000) {
        price = val
        priceFoundType = 'sale'
        extractedFields.push(`מחיר שיווק: ${price.toLocaleString()} ₪`)
      }
    }
  }

  // Pattern B: Explicit "מחיר מבוקש 3,730,000 ש"ח" or "מחיר: 3,730,000"
  if (!price) {
    const mevakashMatch = text.match(/(?:מחיר מבוקש|מחיר|מבוקש)\s*[:=-]?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{5,9})\s*(?:ש"ח|שח|₪)?/i)
    if (mevakashMatch) {
      const val = parseInt(mevakashMatch[1].replace(/,/g, ''), 10)
      price = val
      priceFoundType = val > 80000 ? 'sale' : 'rent'
      extractedFields.push(`מחיר: ${price.toLocaleString()} ₪`)
    }
  }

  // Pattern C: Decimal millions (e.g. 2.9M ש"ח, 3.5 מיליון ₪, 4.2M)
  if (!price) {
    const millionMatch = text.match(/(?:^|[^\wא-ת])(\d+(?:\.\d+)?)\s*(?:M|מיליון|מיל)\s*(?:ש"ח|ש״ח|שח|₪)?/i)
    if (millionMatch) {
      const val = parseFloat(millionMatch[1])
      if (val > 0.1 && val < 200) { // e.g. 0.5M - 200M
        price = Math.round(val * 1000000)
        priceFoundType = 'sale'
        extractedFields.push(`מחיר: ${price.toLocaleString()} ₪`)
      }
    }
  }

  // Pattern D: Currency formatted standalone prices (e.g. 3,730,000 ש"ח, 2,400,000 ₪, 5,200 ש"ח/חודש)
  if (!price) {
    const currencyMatch = text.match(/(\d{1,3}(?:,\d{3})+)\s*(?:₪|ש"ח|ש״ח|שח)/i)
    if (currencyMatch) {
      const val = parseInt(currencyMatch[1].replace(/,/g, ''), 10)
      price = val
      priceFoundType = val > 80000 ? 'sale' : 'rent'
      extractedFields.push(`${price.toLocaleString()} ₪`)
    }
  }

  // Pattern D: Fallback scan for numbers > 500,000
  if (!price) {
    const largeNumMatch = text.match(/\b([1-9]\d{6,8})\b|\b([1-9]\d{0,2},\d{3},\d{3})\b/)
    if (largeNumMatch) {
      const val = parseInt((largeNumMatch[1] || largeNumMatch[2]).replace(/,/g, ''), 10)
      price = val
      priceFoundType = 'sale'
      extractedFields.push(`${price.toLocaleString()} ₪`)
    }
  }

  // 3. Transaction Type
  let transaction_type: TransactionType = 'sale'
  const hasRentWords = /(?:^|[^\wא-ת])(?:להשכרה|שכירות|דמי שכירות|שכר דירה|לחודש|\/חודש)(?:[^\wא-ת]|$)/i.test(text)
  const isInternalRentalUnit = /(?:יחידה נפרדת להשכרה|יחידת דיור להשכרה|יח' נפרדת להשכרה|מושכרת ב|מניבה)/i.test(text)

  if (priceFoundType === 'sale' || is_exclusive || /למכירה|מכירה|שיווק/i.test(text)) {
    transaction_type = 'sale'
    extractedFields.push('סוג עסקה: מכירה')
  } else if (hasRentWords && !isInternalRentalUnit) {
    transaction_type = 'rent'
    extractedFields.push('סוג עסקה: השכרה')
  } else {
    transaction_type = 'sale'
    extractedFields.push('סוג עסקה: מכירה')
  }

  // 4. Property Type
  let property_type: PropertyType = 'apartment'
  if (/דופלקס/i.test(text)) {
    property_type = 'duplex'
    extractedFields.push('סוג: דופלקס')
  } else if (/פנטהאוז|מיני פנטהאוז|רוף טופ/i.test(text)) {
    property_type = 'penthouse'
    extractedFields.push('סוג: פנטהאוז')
  } else if (/דירת גן|ד\.גן/i.test(text)) {
    property_type = 'garden_apartment'
    extractedFields.push('סוג: דירת גן')
  } else if (/קוטג'|קוטג׳|בית פרטי|וילה|דו משפחתי/i.test(text)) {
    property_type = 'detached'
    extractedFields.push('סוג: בית פרטי/קוטג׳')
  } else {
    extractedFields.push('סוג: דירה')
  }

  // 5. Rooms
  let rooms: number | undefined
  // Converted layout: "6 חדרים שהפכו ל 5"
  const convertedMatch = text.match(/(\d+(?:\.5)?)\s*(?:חדרים|חדר|חד['׳]|ח['׳])?\s*שהפכו\s*ל\s*(\d+(?:\.5)?)/i)
  if (convertedMatch) {
    rooms = parseFloat(convertedMatch[2])
    extractedFields.push(`${rooms} חדרים (במקור ${convertedMatch[1]})`)
  }

  if (!rooms) {
    // Standard: "5 חדרים", "5 חד'", "דופלקס 5 חד'", "דירת 4 חדרים"
    const standardRoomsMatch = text.match(/(?:דירת|דופלקס|פנטהאוז)?\s*(\d+(?:\.5|\.0)?)\s*(?:חדרים|חדר|חד['׳]|ח['׳])/i)
    if (standardRoomsMatch) {
      rooms = parseFloat(standardRoomsMatch[1])
      extractedFields.push(`${rooms} חדרים`)
    }
  }

  // 6. Floor & Total Floors
  let floor: number | undefined
  let total_floors: number | undefined

  // Multi-floor: "קומות 3-4" or "קומות 3 מתוך 4"
  const multiFloorMatch = text.match(/קומות\s*(\d+)\s*(?:-|עד|\/)\s*(\d+)/i)
  if (multiFloorMatch) {
    floor = parseInt(multiFloorMatch[1], 10)
    total_floors = parseInt(multiFloorMatch[2], 10)
    extractedFields.push(`קומות ${floor}-${total_floors}`)
  } else {
    const singleFloorMatch = text.match(/(?:קומה|ק['׳])\s*(\d+)(?:\s*(?:מתוך|\/)\s*(\d+))?/i)
    if (singleFloorMatch) {
      floor = parseInt(singleFloorMatch[1], 10)
      if (singleFloorMatch[2]) {
        total_floors = parseInt(singleFloorMatch[2], 10)
        extractedFields.push(`קומה ${floor} מתוך ${total_floors}`)
      } else {
        extractedFields.push(`קומה ${floor}`)
      }
    } else if (/על הגג/i.test(text)) {
      floor = 4
      total_floors = 4
      extractedFields.push('קומה: גג')
    } else if (/קרקע|ק\.קרקע/i.test(text)) {
      floor = 0
      extractedFields.push('קומת קרקע')
    }
  }

  // 7. Square Meters (מ״ר)
  let sqm: number | undefined
  const builtSqmMatch = text.match(/(?:בנוי|שטח|ארנונה)\s*[:=-]?\s*(\d{2,4})\s*(?:מ"ר|מר|מ״ר|מטר|sqm)/i)
  if (builtSqmMatch) {
    sqm = parseInt(builtSqmMatch[1], 10)
    extractedFields.push(`${sqm} מ״ר (בנוי)`)
  } else {
    const sqmRegex = /(\d{2,4})\s*(?:מ"ר|מר|מ״ר|מטר|sqm)/gi
    let m: RegExpExecArray | null
    while ((m = sqmRegex.exec(text)) !== null) {
      const val = parseInt(m[1], 10)
      const prefix = text.slice(Math.max(0, m.index - 25), m.index)
      if (/מרפסת|גג|חצר|גינה/i.test(prefix)) {
        continue
      }
      if (val >= 20 && val <= 1000) {
        sqm = val
        extractedFields.push(`${sqm} מ״ר`)
        break
      }
    }
  }

  // 8. Amenities: Mamad, Elevator, Balcony, Storage
  const has_mamad = /(?:ממ"ד|ממ״ד|ממד|מרחב מוגן)[\s!.,]*/i.test(text)
  if (has_mamad) extractedFields.push('ממ״ד')

  const has_elevator = /(?:מעלית|יש מעלית)[\s!.,]*/i.test(text)
  if (has_elevator) extractedFields.push('מעלית')

  const has_balcony = /(?:מרפסת|מרפסות|מרפסת שמש|טראסה)/i.test(text)
  if (has_balcony) extractedFields.push('מרפסת')

  const has_storage = /(?:מחסן|יש מחסן)[\s!.,]*/i.test(text)
  if (has_storage) extractedFields.push('מחסן')

  // 9. Parking
  let parking_type: ParkingType = 'none'
  let parking_legal: ParkingLegal = 'street_only'

  if (/(?:2 חניות|חניה כפולה|שתי חניות|2 חניה)/i.test(text)) {
    parking_type = 'double'
    extractedFields.push('חניה כפולה (2 חניות)')
  } else if (/(?:חניה עוקבת|טורית|טנדם)/i.test(text)) {
    parking_type = 'tandem'
    extractedFields.push('חניה עוקבת')
  } else if (/(?:מכפיל|מעלית רכב)/i.test(text)) {
    parking_type = 'lift_stacker'
    extractedFields.push('חניה במכפיל')
  } else if (/(?:חניה|חנייה|יש חניה|עם חניה|וחניה)/i.test(text)) {
    parking_type = 'single'
    extractedFields.push('חניה')
  }

  if (/(?:חניה בטאבו|בטאבו|טאבו)/i.test(text)) {
    parking_legal = 'tabu'
    extractedFields.push('חניה בטאבו')
  } else if (/(?:חניה משותפת)/i.test(text)) {
    parking_legal = 'shared'
  }

  // 10. Street, House Number, and City Detection
  let city = ''
  let neighborhood = ''
  let street = ''
  let house_number: string | undefined

  // Step 1: Detect City Abbreviations in text (e.g. כ"ס -> כפר סבא)
  for (const [abbr, fullCity] of Object.entries(ISRAELI_CITY_ABBREVIATIONS)) {
    const escaped = abbr.replace(/["״]/g, '["״]?')
    const regex = new RegExp(`(?:^|[\\s,.-])${escaped}(?:[\\s,.-]|$)`, 'i')
    if (regex.test(text)) {
      city = fullCity
      extractedFields.push(`עיר: ${city}`)
      break
    }
  }

  // Step 2: Address with city abbreviation (e.g. "תל חי 94 כ"ס")
  const streetNumCityMatch = text.match(/([א-ת\s'״"-]{2,20}?)\s+(\d{1,4})\s*(?:,|-)?\s*(כ"ס|כ״ס|ת"א|ת״א|ר"ג|ר״ג|פ"ת|פ״ת|ראשל"צ|ראשל״צ|כפר סבא|תל אביב|רמת גן|גבעתיים|הרצליה|רעננה|הוד השרון|פתח תקווה|ירושלים|חיפה|נתניה)/i)
  if (streetNumCityMatch) {
    const candidateStreet = streetNumCityMatch[1].trim()
    if (!candidateStreet.includes('קומה') && !candidateStreet.includes('חדר') && !candidateStreet.includes('שיווק')) {
      street = candidateStreet
      house_number = streetNumCityMatch[2]
      const cityAbbr = streetNumCityMatch[3]
      if (!city && ISRAELI_CITY_ABBREVIATIONS[cityAbbr]) {
        city = ISRAELI_CITY_ABBREVIATIONS[cityAbbr]
      }
    }
  }

  // Step 3: Match from known ISRAELI_STREET_REGISTRY
  if (!street) {
    for (const entry of ISRAELI_STREET_REGISTRY) {
      if (text.includes(entry.street)) {
        street = entry.street
        if (!city) city = entry.city
        neighborhood = entry.neighborhood
        break
      }
    }
  }

  // Step 4: Top line address pattern (e.g. "ארלוזורוב 20", "עפרוני 2", "רופין 31")
  if (!street) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines.slice(0, 3)) {
      const lineMatch = line.match(/^([א-ת\s'״"-]{2,20}?)\s+(\d{1,4})(?:\s*[,.]|$)/)
      if (lineMatch) {
        const cand = lineMatch[1].trim()
        if (!cand.includes('קומה') && !cand.includes('חדר') && !cand.includes('שיווק') && !cand.includes('למכירה') && !cand.includes('להשכרה')) {
          street = cand
          house_number = lineMatch[2]
          break
        }
      }
    }
  }

  // Step 5: Explicit "ברחוב X" or "רחוב X 20"
  if (!street) {
    const streetPrefixMatch = text.match(/(?:ברחוב|רחוב|ב?שד(?:רות)?)\s+([א-ת\s'״"-]{2,20}?)(?:\s+(\d{1,4}))?(?:[,.\n]|$)/i)
    if (streetPrefixMatch && streetPrefixMatch[1].trim().length > 1) {
      street = streetPrefixMatch[1].trim()
      if (streetPrefixMatch[2]) {
        house_number = streetPrefixMatch[2]
      }
    }
  }

  // Step 6: Extract house number if street was found but house number not yet
  if (street && !house_number) {
    const numRegex = new RegExp(`${street}\\s+(\\d{1,4})`, 'i')
    const matchNum = text.match(numRegex)
    if (matchNum) {
      house_number = matchNum[1]
    }
  }

  if (street) extractedFields.push(`רחוב: ${street} ${house_number || ''}`.trim())

  // Match city and neighborhood if known from registry
  if (!city && street) {
    const regMatch = ISRAELI_STREET_REGISTRY.find(e => e.street === street)
    if (regMatch) {
      city = regMatch.city
      neighborhood = regMatch.neighborhood
    }
  }

  if (!neighborhood && street && city) {
    const n = lookupNeighborhoodByStreet(street, city)
    if (n) neighborhood = n
  }

  // 11. Phone and Name
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

  // 12. Calculate Missing Fields & High-Assurance Confidence Score
  const missingFields: string[] = []
  if (!street) missingFields.push('רחוב')
  if (!city) missingFields.push('עיר')
  if (!price) missingFields.push('מחיר')
  if (!rooms) missingFields.push('חדרים')
  if (floor === undefined) missingFields.push('קומה')
  if (!sqm) missingFields.push('שטח מ״ר')

  let score = 0
  if (street) score += 20
  if (city) score += 15
  if (price) score += 25
  if (rooms) score += 20
  if (floor !== undefined) score += 10
  if (sqm) score += 10

  return {
    transaction_type,
    property_type,
    is_exclusive,
    city: city || '',
    neighborhood: neighborhood || '',
    street: street || '',
    house_number,
    rooms,
    floor,
    total_floors,
    sqm,
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
    extractedFields,
    missingFields
  }
}
