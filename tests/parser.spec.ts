import { test, expect } from '@playwright/test'
import { parseRawListingText } from '../src/lib/parser'

test.describe('Deterministic Israeli Real Estate Text Parser Suite', () => {

  test('Example 1: Arlozorov with separate roof unit and broker marketing price', () => {
    const text = `ארלוזורוב 20
דירת 4 חדרים עם יחידה נפרדת להשכרה ב 5200
על הגג.
שיווק 3490`

    const parsed = parseRawListingText(text)

    expect(parsed.street).toBe('ארלוזורוב')
    expect(parsed.house_number).toBe('20')
    expect(parsed.rooms).toBe(4)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.price).toBe(3490000)
    expect(parsed.floor).toBe(4)
    expect(parsed.confidenceScore).toBeGreaterThanOrEqual(80)
  })

  test('Example 2: Efroni with high-standard renovation and marketing shorthand', () => {
    const text = ` עפרוני 2
  5 חדרים, משופץ לחלוטין ברמה גבוהה!
נכס הצגה, 145 מר, קומה 2, עם מרפסת וחניה.
שיווק 4100.`

    const parsed = parseRawListingText(text)

    expect(parsed.street).toBe('עפרוני')
    expect(parsed.house_number).toBe('2')
    expect(parsed.rooms).toBe(5)
    expect(parsed.sqm).toBe(145)
    expect(parsed.floor).toBe(2)
    expect(parsed.has_balcony).toBe(true)
    expect(parsed.parking_type).toBe('single')
    expect(parsed.price).toBe(4100000)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.confidenceScore).toBe(100)
  })

  test('Example 3: Ruppin 6-to-5 converted rooms, double parking, elevator, mamad', () => {
    const text = `רופין 31
 6 חדרים שהפכו ל 5 וקל להחזיר, 
 2 מרפסות (17+9)
 ממד !
 2 חניות, מעלית
 בנין  משופץ.
שיווק 4100.`

    const parsed = parseRawListingText(text)

    expect(parsed.street).toBe('רופין')
    expect(parsed.house_number).toBe('31')
    expect(parsed.rooms).toBe(5)
    expect(parsed.has_balcony).toBe(true)
    expect(parsed.has_mamad).toBe(true)
    expect(parsed.has_elevator).toBe(true)
    expect(parsed.parking_type).toBe('double')
    expect(parsed.price).toBe(4100000)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.confidenceScore).toBeGreaterThanOrEqual(80)
  })

  test('Example 4: Ruppin 6 rooms, 2 balconies with dimensions, mamad with exclamation mark', () => {
    const text = `רופין 31
6 חדרים
2 מרפסות ( 30+9)
ממד!
2 חניות
מעלית,
בנין משופץ
שיווק 4150.`

    const parsed = parseRawListingText(text)

    expect(parsed.street).toBe('רופין')
    expect(parsed.house_number).toBe('31')
    expect(parsed.rooms).toBe(6)
    expect(parsed.has_balcony).toBe(true)
    expect(parsed.has_mamad).toBe(true)
    expect(parsed.has_elevator).toBe(true)
    expect(parsed.parking_type).toBe('double')
    expect(parsed.price).toBe(4150000)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.confidenceScore).toBeGreaterThanOrEqual(80)
  })

  test('Example 5: Duplex in Kfar Saba with WhatsApp timestamp, exclusivity, and tabu parking', () => {
    const text = `[3:49 PM]למכירה בבלעדיות
דופלקס 5 חד' , תל חי 94 כ"ס
קומות 3-4
3 מרפסות שמש - הגדולה מהסלון 30 מ"ר
ממ"ד
בנוי 164 מ"ר ארנונה
3 חדרי שירותים, 2 חדרי רחצה
יח' הורים כולל חדר ארונות
כ"א מערב ומזרח
חניה בטאבו
גג 44 מ"ר לבניה
מחסן
בניין בוטיק 6 דירות
מערכת חימום מים סולרית
ריצוף חדש בקומה התחתונה ובמרפסת הגדולה
מזגנים בכל הדירה
מרחק הליכה מפארק כ"ס והתיכונים
מחיר מבוקש 3,730,000 ש"ח`

    const parsed = parseRawListingText(text)

    expect(parsed.is_exclusive).toBe(true)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.property_type).toBe('duplex')
    expect(parsed.street).toBe('תל חי')
    expect(parsed.house_number).toBe('94')
    expect(parsed.city).toBe('כפר סבא')
    expect(parsed.rooms).toBe(5)
    expect(parsed.floor).toBe(3)
    expect(parsed.total_floors).toBe(4)
    expect(parsed.sqm).toBe(164)
    expect(parsed.has_balcony).toBe(true)
    expect(parsed.has_mamad).toBe(true)
    expect(parsed.has_storage).toBe(true)
    expect(parsed.parking_type).toBe('single')
    expect(parsed.parking_legal).toBe('tabu')
    expect(parsed.price).toBe(3730000)
    expect(parsed.confidenceScore).toBe(100)
    expect(parsed.missingFields).toHaveLength(0)
  })

  test('Example 6: Unassured fields are left blank without hardcoded fake defaults', () => {
    const text = `דירה מדהימה להשכרה, 3 חדרים עם מעלית וממ״ד`

    const parsed = parseRawListingText(text)

    expect(parsed.rooms).toBe(3)
    expect(parsed.transaction_type).toBe('rent')
    expect(parsed.has_elevator).toBe(true)
    expect(parsed.has_mamad).toBe(true)

    // Unassured fields MUST be blank/undefined instead of fake defaults
    expect(parsed.street).toBe('')
    expect(parsed.city).toBe('')
    expect(parsed.neighborhood).toBe('')
    expect(parsed.floor).toBeUndefined()
    expect(parsed.total_floors).toBeUndefined()
    expect(parsed.sqm).toBeUndefined()
    expect(parsed.price).toBeUndefined()

    // Missing fields should accurately reflect unassured parameters
    expect(parsed.missingFields).toEqual(
      expect.arrayContaining(['רחוב', 'עיר', 'מחיר', 'קומה', 'שטח מ״ר'])
    )
    expect(parsed.confidenceScore).toBeLessThan(50)
  })

  test('Example 7: Partial listing with price and rooms leaves street, city and floor blank', () => {
    const text = `למכירה 4 חד' 2.9M ש״ח, מרפסת וחניה`

    const parsed = parseRawListingText(text)

    expect(parsed.rooms).toBe(4)
    expect(parsed.price).toBe(2900000)
    expect(parsed.transaction_type).toBe('sale')
    expect(parsed.has_balcony).toBe(true)
    expect(parsed.parking_type).toBe('single')

    // Blank fields
    expect(parsed.street).toBe('')
    expect(parsed.city).toBe('')
    expect(parsed.floor).toBeUndefined()
    expect(parsed.sqm).toBeUndefined()

    expect(parsed.missingFields).toEqual(
      expect.arrayContaining(['רחוב', 'עיר', 'קומה', 'שטח מ״ר'])
    )
  })

  test('Example 8: Israeli city initials recognition (כ״ס, כ"ס, בת״א, בר״ג, בפ״ת, בראשל״צ, בהוד״ש, ברה״ש, בי-ם)', () => {
    // 1. כ״ס (Kfar Saba) with city-first format
    const p1 = parseRawListingText(`כ״ס, תל חי 94\n4 חדרים, קומה 2, מחיר 2,650,000 ש"ח`)
    expect(p1.city).toBe('כפר סבא')
    expect(p1.street).toBe('תל חי')
    expect(p1.house_number).toBe('94')
    expect(p1.rooms).toBe(4)
    expect(p1.price).toBe(2650000)

    // 2. בת״א (Tel Aviv) with preposition
    const p2 = parseRawListingText(`למכירה בת״א, דיזנגוף 100\n3 חדרים 85 מ״ר\nמחיר 4.2M ש״ח`)
    expect(p2.city).toBe('תל אביב-יפו')
    expect(p2.street).toBe('דיזנגוף')
    expect(p2.house_number).toBe('100')
    expect(p2.rooms).toBe(3)
    expect(p2.price).toBe(4200000)

    // 3. בכ״ס with dash
    const p3 = parseRawListingText(`דירת 5 חד' בכ״ס - תל חי 94\nמחיר 3.4M`)
    expect(p3.city).toBe('כפר סבא')
    expect(p3.street).toBe('תל חי')
    expect(p3.house_number).toBe('94')

    // 4. בר״ג (Ramat Gan)
    const p4 = parseRawListingText(`דירה בר״ג ביאליק 15, 3 חדרים 2.1M`)
    expect(p4.city).toBe('רמת גן')
    expect(p4.street).toBe('ביאליק')
    expect(p4.house_number).toBe('15')

    // 5. בפ״ת (Petah Tikva)
    const p5 = parseRawListingText(`למכירה בפ״ת, דירת 4 חדרים 2,350,000 ₪`)
    expect(p5.city).toBe('פתח תקווה')

    // 6. בראשל״צ (Rishon LeZion)
    const p6 = parseRawListingText(`בלעדי בראשל״צ! 5 חדרים מחיר 3.8M`)
    expect(p6.city).toBe('ראשון לציון')

    // 7. בהוד״ש (Hod HaSharon)
    const p7 = parseRawListingText(`דופלקס בהוד״ש, 6 חדרים`)
    expect(p7.city).toBe('הוד השרון')

    // 8. ברה״ש (Ramat HaSharon)
    const p8 = parseRawListingText(`דירת גן ברה״ש, 5 חד'`)
    expect(p8.city).toBe('רמת השרון')

    // 9. בי-ם (Jerusalem)
    const p9 = parseRawListingText(`דירה למכירה בי-ם, 3 חדרים`)
    expect(p9.city).toBe('ירושלים')

    // 10. כפ״ס (Wiktionary variant for Kfar Saba)
    const p10 = parseRawListingText(`דירה מהממת בכפ״ס, 4 חד' 2.7M`)
    expect(p10.city).toBe('כפר סבא')

    // 11. ראל״צ (Wiktionary variant for Rishon LeZion)
    const p11 = parseRawListingText(`פנטהאוז בראל״צ, 5 חדרים`)
    expect(p11.city).toBe('ראשון לציון')

    // 12. ברמה״ש (Ramat HaSharon)
    const p12 = parseRawListingText(`דירה למכירה ברמה״ש, 4 חדרים`)
    expect(p12.city).toBe('רמת השרון')

    // 13. בב״ב (Bnei Brak)
    const p13 = parseRawListingText(`דירה בב״ב, 3 חדרים`)
    expect(p13.city).toBe('בני ברק')

    // 14. בב״ש (Beer Sheva)
    const p14 = parseRawListingText(`להשקעה בב״ש, 3 חד' 900,000 ש"ח`)
    expect(p14.city).toBe('באר שבע')
  })
})

