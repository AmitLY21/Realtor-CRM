import { test, expect } from '@playwright/test'

test.describe('Realtor CRM Israeli PWA - End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app running on localhost:5174
    await page.goto('http://localhost:5174/')
    // Wait for Dexie seed data to initialize
    await expect(page.locator('text=RealtorCRM')).toBeVisible({ timeout: 10000 })
  })

  test('1. App mounts with Hebrew RTL and displays Dashboard with Exclusivity Radar & Heskem Tivuch', async ({ page }) => {
    // Verify RTL HTML attribute
    const htmlDir = await page.locator('html').getAttribute('dir')
    expect(htmlDir).toBe('rtl')

    // Verify KPI Cards
    await expect(page.locator('text=נכסים פעילים')).toBeVisible()
    await expect(page.locator('text=לקוחות בחיפוש')).toBeVisible()
    await expect(page.locator('text=התאמות חמות (85%+)')).toBeVisible()

    // Verify Exclusivity Radar (T-14)
    await expect(page.locator('text=ראדאר בלעדיות (מסתיים תוך 14 יום!)')).toBeVisible()

    // Verify Today's Showings and Heskem Tivuch Guard
    await expect(page.locator('text=סיורים ומשימות להיום')).toBeVisible()
    await expect(page.locator('text=הסכם תיווך כחוק:').first()).toBeVisible()

    // Toggle Heskem Tivuch status to "signed"
    const signedBtn = page.locator('button:has-text("חתום")').first()
    await signedBtn.click()
    await expect(page.locator('text=חתום ומאושר').first()).toBeVisible()
  })

  test('2. Properties catalog navigation, Anti-Poaching toggle, and Price Update', async ({ page }) => {
    // Click on "נכסים" tab
    await page.click('button:has-text("נכסים")')
    await expect(page.locator('text=כל הנכסים')).toBeVisible()

    // Filter by "מכירה"
    await page.click('button:has-text("מכירה")')
    await expect(page.locator('text=בוגרשוב').first()).toBeVisible()

    // Toggle Anti-Poaching on the first property
    const antiPoachBtn = page.locator('button[title*="כתובת"]').first()
    await antiPoachBtn.click()

    // Test Price Update Modal
    const updatePriceBtn = page.locator('button:has-text("עדכן מחיר")').first()
    await updatePriceBtn.click()

    await expect(page.locator('text=עדכון מחיר ותיעוד היסטוריה')).toBeVisible()
    const priceInput = page.locator('input[type="number"]').first()
    await priceInput.fill('4200000')

    await page.click('button:has-text("עדכן מחיר והפעל התראות")')
    await expect(page.locator('text=4,200,000')).toBeVisible()
  })

  test('3. Smart Paste Modal extracts Hebrew WhatsApp listing text and adds to database', async ({ page }) => {
    // Click "הוספה" dropdown -> "הדבקה מהירה (וואטסאפ)"
    await page.click('button:has-text("הוספה")')
    await page.click('text=הדבקה מהירה (וואטסאפ)')

    await expect(page.locator('text=קליטה מהירה מוואטסאפ / יד2')).toBeVisible()

    // Click "טען דוגמה מוואטסאפ שת״פ"
    await page.click('text=טען דוגמה מוואטסאפ שת״פ')

    // Verify extraction badges
    await expect(page.locator('text=פרטים שחולצו אוטומטית:')).toBeVisible()
    await expect(page.locator('text=דיוק זיהוי:')).toBeVisible()
    await expect(page.locator('span:has-text("בוגרשוב 52")')).toBeVisible()
    await expect(page.locator('span:has-text("3.5 חד׳")').first()).toBeVisible()

    // Click "אישור והוספה למאגר"
    await page.click('button:has-text("אישור והוספה למאגר")')

    // Should switch to Properties tab and show the new property
    await expect(page.locator('text=בוגרשוב 52').first()).toBeVisible()
  })

  test('4. Leads & Kanban Pipeline: Add new lead and advance stage', async ({ page }) => {
    // Click "לקוחות ומשפך"
    await page.click('button:has-text("לקוחות ומשפך")')
    await expect(page.locator('text=כל הלקוחות')).toBeVisible()

    // Verify Kanban columns
    await expect(page.locator('text=ליד חדש')).toBeVisible()
    await expect(page.locator('text=בירור צרכים')).toBeVisible()
    await expect(page.locator('text=סיורים בנכסים')).toBeVisible()
    await expect(page.locator('text=עסקה נסגרה 🎉')).toBeVisible()

    // Advance first lead stage
    const nextStageBtn = page.locator('button:has-text("השלב הבא")').first()
    if (await nextStageBtn.isVisible()) {
      await nextStageBtn.click()
    }

    // Open New Lead Modal
    await page.click('button:has-text("לקוח חדש")')
    await expect(page.locator('text=הוספת לקוח / ליד חדש')).toBeVisible()

    // Fill form
    await page.fill('input[placeholder*="דניאל"]', 'איתן בר-לב')
    await page.fill('input[placeholder="050-1234567"]', '054-7654321')
    await page.fill('input[placeholder="9 ספרות"]', '204981829')

    await page.click('button:has-text("שמור לקוח והפעל התאמה")')
    await expect(page.locator('text=איתן בר-לב')).toBeVisible()
  })

  test('5. Smart Matching Engine & WhatsApp Pitch trigger', async ({ page }) => {
    // Click "התאמות"
    await page.click('button:has-text("התאמות")')
    await expect(page.locator('text=מנוע התאמות חכם (Smart Matching Engine)')).toBeVisible()

    // Check hot match card
    await expect(page.locator('text=התאמות חמות (85%+)')).toBeVisible()
    await expect(page.locator('text=שלח הצעה מותאמת בוואטסאפ').first()).toBeVisible()

    // Verify breakdown scores
    await expect(page.locator('text=תקציב ומחיר:').first()).toBeVisible()
    await expect(page.locator('text=חדרים וגודל:').first()).toBeVisible()
  })

  test('6. Public Client Sheet & Printable PDF View', async ({ page }) => {
    await page.click('button:has-text("נכסים")')
    // Click Print button on first card
    const printBtn = page.locator('button[title*="להדפסה"]').first()
    await printBtn.click()

    await expect(page.locator('text=תצוגת דף נכס להדפסה / PDF')).toBeVisible()
    await expect(page.locator('text=רישיון תיווך מקרקעין')).toBeVisible()
    await expect(page.locator('text=הבהרה משפטית (חוק המתווכים במקרקעין):')).toBeVisible()
  })

  test('7. Global Search (Cmd+K) modal', async ({ page }) => {
    // Click search in header
    await page.click('button[title*="חיפוש מהיר"]')
    await expect(page.locator('input[placeholder*="חפש לפי כתובת"]')).toBeVisible()

    // Search for "בוגרשוב"
    await page.fill('input[placeholder*="חפש לפי כתובת"]', 'בוגרשוב')
    await expect(page.locator('text=נכסים (').first()).toBeVisible()
  })
})
