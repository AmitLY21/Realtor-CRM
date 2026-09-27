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
  })
})
