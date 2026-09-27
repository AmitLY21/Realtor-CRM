// Israeli Real Estate Street-to-Neighborhood Intelligence

export interface StreetMapping {
  street: string
  city: string
  neighborhood: string
  aliases?: string[]
}

export const ISRAELI_STREET_REGISTRY: StreetMapping[] = [
  // תל אביב
  { street: 'בוגרשוב', city: 'תל אביב-יפו', neighborhood: 'לב העיר', aliases: ['בוגרשוב', 'bograsov'] },
  { street: 'דיזנגוף', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן', aliases: ['דיזנגוף', 'dizengoff'] },
  { street: 'בן יהודה', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן / הירקון' },
  { street: 'הרצל', city: 'תל אביב-יפו', neighborhood: 'פלורנטין / מרכז' },
  { street: 'פלורנטין', city: 'תל אביב-יפו', neighborhood: 'פלורנטין' },
  { street: 'שבזי', city: 'תל אביב-יפו', neighborhood: 'נווה צדק' },
  { street: 'שדרות רוטשילד', city: 'תל אביב-יפו', neighborhood: 'לב העיר', aliases: ['רוטשילד'] },
  { street: 'אבן גבירול', city: 'תל אביב-יפו', neighborhood: 'מרכז העיר / הצפון הישן' },
  { street: 'סוקולוב', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן' },
  { street: 'ארלוזורוב', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן / מרכז' },
  { street: 'רופין', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן' },
  { street: 'עפרוני', city: 'תל אביב-יפו', neighborhood: 'המשתלה / צפון העיר' },
  { street: 'ויצמן', city: 'תל אביב-יפו', neighborhood: 'הצפון החדש / כיכר המדינה' },
  { street: 'פנקס', city: 'תל אביב-יפו', neighborhood: 'הצפון הישן' },
  { street: 'יהודה הלוי', city: 'תל אביב-יפו', neighborhood: 'לב העיר' },
  { street: 'אלנבי', city: 'תל אביב-יפו', neighborhood: 'מרכז העיר' },
  { street: 'אחד העם', city: 'תל אביב-יפו', neighborhood: 'לב העיר' },
  { street: 'יפת', city: 'תל אביב-יפו', neighborhood: 'יפו' },
  { street: 'הירקון', city: 'תל אביב-יפו', neighborhood: 'קו החוף / הצפון הישן' },

  // כפר סבא
  { street: 'תל חי', city: 'כפר סבא', neighborhood: 'מרכז העיר' },
  { street: 'ויצמן', city: 'כפר סבא', neighborhood: 'מרכז העיר' },
  { street: 'רוטשילד', city: 'כפר סבא', neighborhood: 'מרכז העיר' },
  { street: 'התחיה', city: 'כפר סבא', neighborhood: 'הפרחים' },

  // רמת גן
  { street: 'ביאליק', city: 'רמת גן', neighborhood: 'מרכז העיר' },
  { street: 'זבוטינסקי', city: 'רמת גן', neighborhood: 'בורסה / חרוזים', aliases: ['ז\'בוטינסקי', 'זבוטינסקי'] },
  { street: 'הרצל', city: 'רמת גן', neighborhood: 'מרכז העיר' },
  { street: 'הרא״ה', city: 'רמת גן', neighborhood: 'מרום נווה / רמת יצחק', aliases: ['הראה', 'הרא"ה'] },
  { street: 'קריניצי', city: 'רמת גן', neighborhood: 'מרכז רמת גן' },
  { street: 'נגבה', city: 'רמת גן', neighborhood: 'רמת יצחק' },

  // גבעתיים
  { street: 'כצנלסון', city: 'גבעתיים', neighborhood: 'מרכז גבעתיים / בורוכוב' },
  { street: 'ויצמן', city: 'גבעתיים', neighborhood: 'שינקין / מרכז' },
  { street: 'סירקין', city: 'גבעתיים', neighborhood: 'ארלוזורוב' },
  { street: 'רמב״ם', city: 'גבעתיים', neighborhood: 'רמב"ם' },

  // ירושלים
  { street: 'יפו', city: 'ירושלים', neighborhood: 'מרכז העיר' },
  { street: 'עזה', city: 'ירושלים', neighborhood: 'רחביה' },
  { street: 'עמק רפאים', city: 'ירושלים', neighborhood: 'המושבה הגרמנית' },
  { street: 'המלך ג׳ורג׳', city: 'ירושלים', neighborhood: 'מרכז העיר', aliases: ['המלך גורג', 'קינג גורג'] },
  { street: 'בית לחם', city: 'ירושלים', neighborhood: 'בקעה' }
]

export const ISRAELI_CITY_ABBREVIATIONS: Record<string, string> = {
  'כ"ס': 'כפר סבא',
  'כ״ס': 'כפר סבא',
  'כס': 'כפר סבא',
  'כפר סבא': 'כפר סבא',
  'ת"א': 'תל אביב-יפו',
  'ת״א': 'תל אביב-יפו',
  'תא': 'תל אביב-יפו',
  'תל אביב': 'תל אביב-יפו',
  'תל אביב יפו': 'תל אביב-יפו',
  'ר"ג': 'רמת גן',
  'ר״ג': 'רמת גן',
  'רג': 'רמת גן',
  'רמת גן': 'רמת גן',
  'גבעתיים': 'גבעתיים',
  'פ"ת': 'פתח תקווה',
  'פ״ת': 'פתח תקווה',
  'פת': 'פתח תקווה',
  'פתח תקווה': 'פתח תקווה',
  'ראשל"צ': 'ראשון לציון',
  'ראשל״צ': 'ראשון לציון',
  'ראשון לציון': 'ראשון לציון',
  'הוד"ש': 'הוד השרון',
  'הוד״ש': 'הוד השרון',
  'הוד השרון': 'הוד השרון',
  'הרצליה': 'הרצליה',
  'רעננה': 'רעננה',
  'ירושלים': 'ירושלים',
  'י-ם': 'ירושלים',
  'חיפה': 'חיפה',
  'חולון': 'חולון',
  'בת ים': 'בת ים',
  'נתניה': 'נתניה',
  'אשדוד': 'אשדוד'
}

export const ISRAELI_MAJOR_CITIES = [
  'תל אביב-יפו',
  'רמת גן',
  'גבעתיים',
  'ירושלים',
  'הרצליה',
  'רעננה',
  'כפר סבא',
  'הוד השרון',
  'פתח תקווה',
  'חולון',
  'בת ים',
  'ראשון לציון',
  'נתניה',
  'חיפה'
]

/**
 * Finds the likely neighborhood for a street if omitted
 */
export function lookupNeighborhoodByStreet(streetName: string, cityName?: string): string | null {
  if (!streetName) return null
  const cleanStreet = streetName.trim().replace(/['"״]/g, '')
  
  const match = ISRAELI_STREET_REGISTRY.find(entry => {
    const entryClean = entry.street.replace(/['"״]/g, '')
    const isStreetMatch = entryClean.includes(cleanStreet) || cleanStreet.includes(entryClean)
    if (!cityName) return isStreetMatch
    return isStreetMatch && (entry.city.includes(cityName) || cityName.includes(entry.city))
  })

  return match ? match.neighborhood : null
}

/**
 * Simple Levenshtein distance for fuzzy matching Hebrew names
 */
export function hebrewSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0
  const clean1 = s1.trim().toLowerCase().replace(/['"״\s-]/g, '')
  const clean2 = s2.trim().toLowerCase().replace(/['"״\s-]/g, '')
  if (clean1 === clean2) return 1.0
  if (clean1.includes(clean2) || clean2.includes(clean1)) return 0.85
  return 0
}
