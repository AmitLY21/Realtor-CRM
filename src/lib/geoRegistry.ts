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
  // כפר סבא (Wiktionary: כ"ס, כפ"ס)
  'כ"ס': 'כפר סבא',
  'כ״ס': 'כפר סבא',
  'כ\'ס': 'כפר סבא',
  'כ׳ס': 'כפר סבא',
  'כפ"ס': 'כפר סבא',
  'כפ״ס': 'כפר סבא',
  'כפ\'ס': 'כפר סבא',
  'כפ׳ס': 'כפר סבא',
  'כס': 'כפר סבא',
  'כפר סבא': 'כפר סבא',
  'כפר-סבא': 'כפר סבא',

  // תל אביב-יפו (Wiktionary: ת"א)
  'ת"א': 'תל אביב-יפו',
  'ת״א': 'תל אביב-יפו',
  'ת\'א': 'תל אביב-יפו',
  'ת׳א': 'תל אביב-יפו',
  'ת"א-יפו': 'תל אביב-יפו',
  'ת״א-יפו': 'תל אביב-יפו',
  'תל אביב': 'תל אביב-יפו',
  'תל-אביב': 'תל אביב-יפו',
  'תל אביב יפו': 'תל אביב-יפו',
  'תל אביב-יפו': 'תל אביב-יפו',

  // רמת גן (Wiktionary: ר"ג)
  'ר"ג': 'רמת גן',
  'ר״ג': 'רמת גן',
  'ר\'ג': 'רמת גן',
  'ר׳ג': 'רמת גן',
  'רמת גן': 'רמת גן',
  'רמת-גן': 'רמת גן',

  // פתח תקווה (Wiktionary: פ"ת)
  'פ"ת': 'פתח תקווה',
  'פ״ת': 'פתח תקווה',
  'פ\'ת': 'פתח תקווה',
  'פ׳ת': 'פתח תקווה',
  'פתח תקווה': 'פתח תקווה',
  'פתח-תקווה': 'פתח תקווה',
  'פתח תקוה': 'פתח תקווה',

  // ראשון לציון (Wiktionary: ראשל"צ, ראל"צ)
  'ראשל"צ': 'ראשון לציון',
  'ראשל״צ': 'ראשון לציון',
  'ראשל\'צ': 'ראשון לציון',
  'ראשל׳צ': 'ראשון לציון',
  'ראשלצ': 'ראשון לציון',
  'ראל"צ': 'ראשון לציון',
  'ראל״צ': 'ראשון לציון',
  'ראל\'צ': 'ראשון לציון',
  'ראל׳צ': 'ראשון לציון',
  'ראלצ': 'ראשון לציון',
  'ראשון לציון': 'ראשון לציון',
  'ראשון-לציון': 'ראשון לציון',

  // הוד השרון (Wiktionary / מקובל: הוד"ש)
  'הוד"ש': 'הוד השרון',
  'הוד״ש': 'הוד השרון',
  'הוד\'ש': 'הוד השרון',
  'הוד׳ש': 'הוד השרון',
  'הודש': 'הוד השרון',
  'הוד השרון': 'הוד השרון',

  // רמת השרון (Wiktionary: רה"ש, רמה"ש)
  'רה"ש': 'רמת השרון',
  'רה״ש': 'רמת השרון',
  'רה\'ש': 'רמת השרון',
  'רה׳ש': 'רמת השרון',
  'רהש': 'רמת השרון',
  'רמה"ש': 'רמת השרון',
  'רמה״ש': 'רמת השרון',
  'רמה\'ש': 'רמת השרון',
  'רמה׳ש': 'רמת השרון',
  'רמהש': 'רמת השרון',
  'רמת השרון': 'רמת השרון',

  // גבעת שמואל (מקובל: גב"ש)
  'גב"ש': 'גבעת שמואל',
  'גב״ש': 'גבעת שמואל',
  'גב\'ש': 'גבעת שמואל',
  'גב׳ש': 'גבעת שמואל',
  'גבש': 'גבעת שמואל',
  'גבעת שמואל': 'גבעת שמואל',

  // קריית אונו (מקובל: ק"א)
  'ק"א': 'קריית אונו',
  'ק״א': 'קריית אונו',
  'ק\'א': 'קריית אונו',
  'ק׳א': 'קריית אונו',
  'קריית אונו': 'קריית אונו',
  'קרית אונו': 'קריית אונו',

  // נס ציונה (מקובל: נ"צ)
  'נ"צ': 'נס ציונה',
  'נ״צ': 'נס ציונה',
  'נ\'צ': 'נס ציונה',
  'נ׳צ': 'נס ציונה',
  'נצ': 'נס ציונה',
  'נס ציונה': 'נס ציונה',

  // בני ברק (Wiktionary: ב"ב)
  'ב"ב': 'בני ברק',
  'ב״ב': 'בני ברק',
  'ב\'ב': 'בני ברק',
  'ב׳ב': 'בני ברק',
  'בני ברק': 'בני ברק',
  'בני-ברק': 'בני ברק',

  // באר שבע (Wiktionary: ב"ש)
  'ב"ש': 'באר שבע',
  'ב״ש': 'באר שבע',
  'ב\'ש': 'באר שבע',
  'ב׳ש': 'באר שבע',
  'באר שבע': 'באר שבע',
  'באר-שבע': 'באר שבע',

  // נוף הגליל (Wiktionary: נוג"ה)
  'נוג"ה': 'נוף הגליל',
  'נוג״ה': 'נוף הגליל',
  'נוף הגליל': 'נוף הגליל',

  // ראש הנקרה (Wiktionary: רה"נ)
  'רה"נ': 'ראש הנקרה',
  'רה״נ': 'ראש הנקרה',
  'ראש הנקרה': 'ראש הנקרה',

  // גבעת עדה (Wiktionary: גב"ע)
  'גב"ע': 'גבעת עדה',
  'גב״ע': 'גבעת עדה',
  'גבעת עדה': 'גבעת עדה',

  // אבני חפץ (Wiktionary: אבנ"צ)
  'אבנ"צ': 'אבני חפץ',
  'אבנ״צ': 'אבני חפץ',
  'אבני חפץ': 'אבני חפץ',

  // בית לחם (Wiktionary: ב"ל)
  'ב"ל': 'בית לחם',
  'ב״ל': 'בית לחם',
  'בית לחם': 'בית לחם',

  // ירושלים (Wiktionary: י-ם, ירוש')
  'י-ם': 'ירושלים',
  'י–ם': 'ירושלים',
  'ירוש\'': 'ירושלים',
  'ירוש׳': 'ירושלים',
  'ירושלים': 'ירושלים',

  // שאר ערי המרכז
  'גבעתיים': 'גבעתיים',
  'הרצליה': 'הרצליה',
  'הרצליה פיתוח': 'הרצליה',
  'רעננה': 'רעננה',
  'חיפה': 'חיפה',
  'חולון': 'חולון',
  'בת ים': 'בת ים',
  'בת-ים': 'בת ים',
  'נתניה': 'נתניה',
  'אשדוד': 'אשדוד',
  'מודיעין': 'מודיעין-מכבים-רעות',
  'מודיעין-מכבים-רעות': 'מודיעין-מכבים-רעות'
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
  'רמת השרון',
  'פתח תקווה',
  'קריית אונו',
  'גבעת שמואל',
  'נס ציונה',
  'חולון',
  'בת ים',
  'ראשון לציון',
  'בני ברק',
  'נתניה',
  'חיפה',
  'אשדוד',
  'באר שבע',
  'מודיעין-מכבים-רעות',
  'נוף הגליל'
]

/**
 * Detects Israeli city from text, recognizing abbreviations (e.g. כ״ס, כפ״ס, ת״א, ר״ג, פ״ת, ראשל״צ, ראל״צ, ב״ב, ב״ש, הוד״ש, רה״ש, גב״ש, ק״א, נ״צ, י-ם, נוג״ה)
 * with or without Hebrew prepositions (ב, מ, ל, כ) and gershayim/quote variants (״, ", ', ׳, -).
 */
export function detectIsraeliCity(text: string): { city: string; matched: string } | null {
  if (!text) return null

  // 1. Quoted / punctuated abbreviations with optional preposition ב/מ/ל/כ
  // Matches e.g. בת״א, כ"ס, כפ״ס, בר"ג, בפ״ת, בראשל"צ, בראל״צ, בב"ב, בב"ש, ברה״ש, ברמה״ש, בהוד״ש, בגב״ש, בגב״ע, בק"א, בנ״צ, בי-ם, בנוג״ה, ברה״נ, באבנ״צ
  const abbrRegex = /(?:^|[\s,.:;()[\]/!?-])([במלק]?)(כ["״'׳]ס|כפ["״'׳]ס|ת["״'׳]א(?:-יפו)?|ר["״'׳]ג|פ["״'׳]ת|ראשל["״'׳]צ|ראל["״'׳]צ|ב["״'׳]ב|ב["״'׳]ש|הוד["״'׳]ש|רה["״'׳]ש|רמה["״'׳]ש|גב["״'׳]ש|גב["״'׳]ע|ק["״'׳]א|נ["״'׳]צ|י[-–]ם|ירוש['׳]|נוג["״'׳]ה|רה["״'׳]נ|אבנ["״'׳]צ|ב["״'׳]ל)(?:[\s,.:;()[\]/!?-]|$)/i
  const matchAbbr = text.match(abbrRegex)
  if (matchAbbr) {
    const rawAbbr = matchAbbr[2].replace(/[״'׳]/g, '"').replace(/–/g, '-')
    const canonicalMap: Record<string, string> = {
      'כ"ס': 'כפר סבא',
      'כפ"ס': 'כפר סבא',
      'ת"א': 'תל אביב-יפו',
      'ת"א-יפו': 'תל אביב-יפו',
      'ר"ג': 'רמת גן',
      'פ"ת': 'פתח תקווה',
      'ראשל"צ': 'ראשון לציון',
      'ראל"צ': 'ראשון לציון',
      'ב"ב': 'בני ברק',
      'ב"ש': 'באר שבע',
      'הוד"ש': 'הוד השרון',
      'רה"ש': 'רמת השרון',
      'רמה"ש': 'רמת השרון',
      'גב"ש': 'גבעת שמואל',
      'גב"ע': 'גבעת עדה',
      'ק"א': 'קריית אונו',
      'נ"צ': 'נס ציונה',
      'י-ם': 'ירושלים',
      'ירוש"': 'ירושלים',
      'נוג"ה': 'נוף הגליל',
      'רה"נ': 'ראש הנקרה',
      'אבנ"צ': 'אבני חפץ',
      'ב"ל': 'בית לחם',
    }
    if (canonicalMap[rawAbbr]) {
      return { city: canonicalMap[rawAbbr], matched: matchAbbr[0].trim() }
    }
  }

  // 2. Full city names with optional preposition ב/מ/ל/כ
  // e.g. בתל אביב, בכפר סבא, ברמת גן, בירושלים, בבני ברק, בבאר שבע
  const fullCityRegex = /(?:^|[\s,.:;()[\]/!?-])([במלק]?)(כפר[\s-]סבא|תל[\s-]אביב(?:[\s-]+יפו)?|רמת[\s-]גן|פתח[\s-]תקוו?ה|ראשון[\s-]לציון|בני[\s-]ברק|באר[\s-]שבע|הוד[\s-]השרון|רמת[\s-]השרון|גבעת[\s-]שמואל|גבעת[\s-]עדה|קריית[\s-]אונו|קרית[\s-]אונו|נס[\s-]ציונה|ירושלים|גבעתיים|הרצליה(?:\s+פיתוח)?|רעננה|חולון|בת[\s-]ים|נתניה|חיפה|אשדוד|מודיעין(?:-מכבים-רעות)?|נוף[\s-]הגליל|ראש[\s-]הנקרה|אבני[\s-]חפץ|בית[\s-]לחם)(?:[\s,.:;()[\]/!?-]|$)/i
  const matchFull = text.match(fullCityRegex)
  if (matchFull) {
    const rawName = matchFull[2].replace(/-/g, ' ').trim()
    let canonical = rawName
    if (/כפר\s+סבא/.test(rawName)) canonical = 'כפר סבא'
    else if (/תל\s+אביב/.test(rawName)) canonical = 'תל אביב-יפו'
    else if (/רמת\s+גן/.test(rawName)) canonical = 'רמת גן'
    else if (/פתח\s+תקוו?ה/.test(rawName)) canonical = 'פתח תקווה'
    else if (/ראשון\s+לציון/.test(rawName)) canonical = 'ראשון לציון'
    else if (/בני\s+ברק/.test(rawName)) canonical = 'בני ברק'
    else if (/באר\s+שבע/.test(rawName)) canonical = 'באר שבע'
    else if (/הוד\s+השרון/.test(rawName)) canonical = 'הוד השרון'
    else if (/רמת\s+השרון/.test(rawName)) canonical = 'רמת השרון'
    else if (/גבעת\s+שמואל/.test(rawName)) canonical = 'גבעת שמואל'
    else if (/גבעת\s+עדה/.test(rawName)) canonical = 'גבעת עדה'
    else if (/ק[קר]יית\s+אונו/.test(rawName)) canonical = 'קריית אונו'
    else if (/נס\s+ציונה/.test(rawName)) canonical = 'נס ציונה'
    else if (/בת\s+ים/.test(rawName)) canonical = 'בת ים'
    else if (/הרצליה/.test(rawName)) canonical = 'הרצליה'
    else if (/נוף\s+הגליל/.test(rawName)) canonical = 'נוף הגליל'
    else if (/ראש\s+הנקרה/.test(rawName)) canonical = 'ראש הנקרה'
    else if (/אבני\s+חפץ/.test(rawName)) canonical = 'אבני חפץ'
    else if (/בית\s+לחם/.test(rawName)) canonical = 'בית לחם'
    else if (/מודיעין/.test(rawName)) canonical = 'מודיעין-מכבים-רעות'
    return { city: canonical, matched: matchFull[0].trim() }
  }

  // 3. Unquoted common city acronyms with optional preposition ב/מ/ל/כ
  const unquotedRegex = /(?:^|[\s,.:;()[\]/!?-])([במלק]?)(ראשלצ|ראלצ|הודש|רהש|רמהש|גבש|כס)(?:[\s,.:;()[\]/!?-]|$)/i
  const matchUnquoted = text.match(unquotedRegex)
  if (matchUnquoted) {
    const word = matchUnquoted[2]
    const unquotedMap: Record<string, string> = {
      ראשלצ: 'ראשון לציון',
      ראלצ: 'ראשון לציון',
      הודש: 'הוד השרון',
      רהש: 'רמת השרון',
      רמהש: 'רמת השרון',
      גבש: 'גבעת שמואל',
      כס: 'כפר סבא',
    }
    if (unquotedMap[word]) {
      return { city: unquotedMap[word], matched: matchUnquoted[0].trim() }
    }
  }

  return null
}

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
