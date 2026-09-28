import { test, expect } from '@playwright/test'

test.describe('Realtor CRM Israeli PWA - End-to-End Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set onboarded flag by default for general tests
    await page.addInitScript(() => {
      window.localStorage.setItem('realtor_crm_onboarded', 'true')
    })
    // Navigate to the app running on localhost:5174
    await page.goto('http://localhost:5174/')
    // Wait for Dexie seed data to initialize
    await expect(page.locator('header h1:has-text("RealtorCRM")')).toBeVisible({ timeout: 10000 })
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

    // Verify full original message is displayed in the property card
    await expect(page.locator('text=הודעת מקור מוואטסאפ:').first()).toBeVisible()
    await expect(page.locator('text=רונן 054-1234567').first()).toBeVisible()

    // Test "ערוך נכס" modal to modify everything
    const editBtn = page.locator('button:has-text("ערוך נכס")').first()
    await editBtn.click()
    await expect(page.locator('text=עריכת נכס ועדכון פרטים מלאים')).toBeVisible()

    // Modify a field (e.g. neighborhood and notes)
    const neighborhoodInput = page.locator('input[placeholder*="שם השכונה"]')
    await neighborhoodInput.fill('לב תל אביב המתחדש')

    // Save changes
    await page.click('button:has-text("שמור שינויים")')
    await expect(page.locator('text=עריכת נכס ועדכון פרטים מלאים')).not.toBeVisible()
    await expect(page.locator('text=לב תל אביב המתחדש').first()).toBeVisible()
  })

  test('3b. Smart Paste informs user about blank unassured fields and allows manual completion before saving', async ({ page }) => {
    // Click "הוספה" -> "הדבקה מהירה (וואטסאפ)"
    await page.click('button:has-text("הוספה")')
    await page.click('text=הדבקה מהירה (וואטסאפ)')

    await expect(page.locator('text=קליטה מהירה מוואטסאפ / יד2')).toBeVisible()

    // Type partial listing text without street or city
    const textarea = page.locator('textarea')
    await textarea.fill('דירת 3 חדרים למכירה, קומה 2, מחיר 2,400,000 ש"ח')

    // Verify warning banner and manual completion badge
    await expect(page.locator('text=/שים לב: \\d+ שדות לא זוהו בוודאות והושארו ריקים/')).toBeVisible()
    await expect(page.locator('text=נדרשת השלמה ידנית').first()).toBeVisible()
    await expect(page.locator('text=עיר דורש מילוי')).toBeVisible()
    await expect(page.locator('text=רחוב דורש מילוי')).toBeVisible()

    // Attempting to save without street/city triggers validation notice
    await page.click('button:has-text("אישור והוספה למאגר")')
    await expect(page.locator('text=נא להזין לפחות עיר ורחוב לפני השמירה למאגר')).toBeVisible()

    // Manually complete street and city
    await page.fill('input[placeholder="שם הרחוב..."]', 'קריניצי')
    await page.fill('input[placeholder="שם העיר..."]', 'רמת גן')

    // Now save successfully
    await page.click('button:has-text("אישור והוספה למאגר")')

    // Should switch to Properties tab and show the manually completed property
    await expect(page.locator('text=קריניצי').first()).toBeVisible()
  })

  test('4. Leads & Kanban Pipeline: Add new lead and advance stage', async ({ page }) => {
    // Click "לקוחות ומשפך"
    await page.click('button:has-text("לקוחות ומשפך")')
    await expect(page.locator('text=כל הלקוחות')).toBeVisible()

    // Verify Kanban columns
    await expect(page.locator('text=ליד חדש')).toBeVisible()
    await expect(page.locator('text=בירור צרכים')).toBeVisible()
    await expect(page.locator('text=סיורים בנכסים')).toBeVisible()
    await expect(page.locator('text=עסקה נסגרה')).toBeVisible()

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

  test('6. Public Client Sheet & Printable PDF View displays full WhatsApp description and parameters', async ({ page }) => {
    await page.click('button:has-text("נכסים")')
    // Click Print button on first card
    const printBtn = page.locator('button[title*="להדפסה"]').first()
    await printBtn.click()

    await expect(page.locator('text=תצוגת דף נכס להדפסה / PDF')).toBeVisible()
    await expect(page.locator('text=רישיון תיווך מקרקעין')).toBeVisible()
    await expect(page.locator('text=תיאור הנכס המלא (מהודעת הוואטסאפ המקורית)')).toBeVisible()
    await expect(page.locator('text=דירה חדשה למכירה בבלעדיות בלב תל אביב!').last()).toBeVisible()
    await expect(page.locator('text=העתק תיאור')).toBeVisible()
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

  test('8. Kanban advanced controls: Stage revert, direct jump, archive and delete', async ({ page }) => {
    // Navigate to Leads view
    await page.click('button:has-text("לקוחות ומשפך")')
    await expect(page.locator('text=כל הלקוחות')).toBeVisible()

    // Test stage revert (button:has-text("הקודם"))
    const prevBtn = page.locator('button:has-text("הקודם")').first()
    if (await prevBtn.isVisible()) {
      await prevBtn.click()
    }

    // Open context menu on first card
    const menuBtn = page.locator('button[title="אפשרויות נוספות"]').first()
    await menuBtn.click()

    // Verify stage jump menu appears
    await expect(page.locator('text=קפוץ ישירות לשלב:')).toBeVisible()

    // Jump to "עסקה נסגרה" to trigger celebration
    await page.click('button:has-text("עסקה נסגרה")')

    // Open menu again and test archive
    const menuBtn2 = page.locator('button[title="אפשרויות נוספות"]').first()
    await menuBtn2.click()
    await page.click('text=העבר לארכיון (נפלה)')

    // Verify archive button appears
    await expect(page.locator('button:has-text("ארכיון שנפלו")')).toBeVisible()

    // Switch to table view and verify delete modal
    await page.click('button:has-text("טבלה")')
    const deleteBtn = page.locator('button[title="מחק"]').first()
    await deleteBtn.click()

    await expect(page.locator('text=מחיקת לקוח לצמיתות')).toBeVisible()
    await page.click('button:has-text("ביטול")')
    await expect(page.locator('text=מחיקת לקוח לצמיתות')).not.toBeVisible()
  })

  test('9. Clean Slate database reset and demo restoration in Settings', async ({ page }) => {
    // Navigate to Settings
    await page.click('button:has-text("הגדרות")')
    await expect(page.locator('text=איפוס לוח חלק (Clean Slate)')).toBeVisible()

    // Handle confirm dialog for clean slate
    page.once('dialog', async dialog => {
      await dialog.accept()
    })

    // Click Clean Slate button
    await page.click('button:has-text("רוקן מאגר והתחל מאפס (Clean Slate)")')

    // Navigate to Dashboard and verify 0 records and onboarding welcome card
    await page.click('button:has-text("לוח בקרה")')
    await expect(page.locator('text=המאגר שלך מוכן במצב לוח חלק (Clean Slate)!')).toBeVisible()
    await expect(page.locator('text=הדבק נכס ראשון מוואטסאפ (Smart Paste)')).toBeVisible()

    // Navigate back to Settings and restore demo data
    await page.click('button:has-text("הגדרות")')
    page.once('dialog', async dialog => {
      await dialog.accept()
    })
    await page.click('button:has-text("טען מחדש נתוני דוגמה")')

    // Navigate back to Dashboard and verify demo data restored
    await page.click('button:has-text("לוח בקרה")')
    await expect(page.locator('text=ראדאר בלעדיות (מסתיים תוך 14 יום!)')).toBeVisible()
  })

  test('10. First-time onboarding tour: complete multi-step guide and save realtor profile', async ({ page }) => {
    // Open Settings and trigger onboarding tour wizard
    await page.click('button:has-text("הגדרות")')
    await page.click('button:has-text("הפעל סיור מודרך מחדש")')

    // Step 1: Welcome & Superpowers
    await expect(page.locator('text=ברוך הבא ל-Realtor CRM! 🇮🇱')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=שלב 1 מתוך 3')).toBeVisible()

    // Test direct interactive tab switch to Step 3 (making page 3 active)
    await page.click('button:has-text("3. פרטי מתווך")')

    // Step 3 is now active
    await expect(page.locator('text=שלב 3 מתוך 3')).toBeVisible()
    await expect(page.locator('text=הגדרת פרטי המתווך והסוכנות (הבסיס שלך)')).toBeVisible()

    // Verify initial data is blank with hint placeholder labels (no dummy demo data!)
    const nameInput = page.locator('input[placeholder*="ישראל ישראלי"]')
    const phoneInput = page.locator('input[placeholder*="054-1234567"]')
    await expect(nameInput).toHaveValue('')
    await expect(phoneInput).toHaveValue('')

    // Fill in real profile info
    await nameInput.fill('איתן ישראלי')
    await phoneInput.fill('054-7776655')
    await page.fill('input[placeholder*="שם המשרד"]', 'ישראלי נכסים')
    await page.fill('input[placeholder*="מספר רישיון"]', '55443-02')

    // Finish tour with active finish button
    await page.click('button:has-text("סיים והתחל לעבוד!")')

    // Modal closes
    await expect(page.locator('text=ברוך הבא ל-Realtor CRM! 🇮🇱')).not.toBeVisible()

    // Verify Settings reflects saved realtor profile
    await expect(page.locator('input[value="איתן ישראלי"]')).toBeVisible()
    await expect(page.locator('input[value="054-7776655"]')).toBeVisible()
    await expect(page.locator('input[value="ישראלי נכסים"]')).toBeVisible()
  })
})

test.describe('First-time user onboarding tour auto-launch', () => {
  test('First launch triggers tour automatically, Step 3 is fully active with hint labels and blank initial data', async ({ page }) => {
    // Navigate and ensure clean slate onboarding
    await page.goto('http://localhost:5174/')
    await page.evaluate(() => localStorage.removeItem('realtor_crm_onboarded'))
    await page.reload()

    // Step 1: Welcome modal is shown automatically on first visit
    await expect(page.locator('text=ברוך הבא ל-Realtor CRM! 🇮🇱')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=שלב 1 מתוך 3')).toBeVisible()

    // Navigate sequentially: Step 1 -> Step 2
    await page.click('button:has-text("הבא: איך המערכת עובדת")')
    await expect(page.locator('text=שלב 2 מתוך 3')).toBeVisible()

    // Navigate sequentially: Step 2 -> Step 3
    await page.click('button:has-text("הבא: הגדרת פרטי המתווך")')
    await expect(page.locator('text=שלב 3 מתוך 3')).toBeVisible()
    await expect(page.locator('text=הגדרת פרטי המתווך והסוכנות (הבסיס שלך)')).toBeVisible()

    // Verify initial values are completely empty (hint labels only, no dummy data)
    const nameInput = page.locator('input[placeholder*="ישראל ישראלי"]')
    const phoneInput = page.locator('input[placeholder*="054-1234567"]')
    const agencyInput = page.locator('input[placeholder*="שם המשרד"]')
    const licenseInput = page.locator('input[placeholder*="מספר רישיון"]')

    await expect(nameInput).toHaveValue('')
    await expect(phoneInput).toHaveValue('')
    await expect(agencyInput).toHaveValue('')
    await expect(licenseInput).toHaveValue('')

    // Fill realtor details
    await nameInput.fill('יוסי כהן')
    await phoneInput.fill('050-1234567')
    await agencyInput.fill('כהן נכסים ונדל״ן')
    await licenseInput.fill('12345')

    // Click active finish button
    await page.click('button:has-text("סיים והתחל לעבוד!")')

    // Modal closes and realtor_crm_onboarded flag is set
    await expect(page.locator('text=ברוך הבא ל-Realtor CRM! 🇮🇱')).not.toBeVisible()
    const isOnboarded = await page.evaluate(() => localStorage.getItem('realtor_crm_onboarded'))
    expect(isOnboarded).toBe('true')
  })

  test('11. Web Share Target captures shared WhatsApp message and link into Smart Paste modal', async ({ page }) => {
    // Navigate with WhatsApp share parameters
    const shareQuery = '?text=' + encodeURIComponent('דירה חדשה למכירה ברוטשילד 10 ת״א, 3 חדרים 4,100,000 ש"ח') +
      '&url=' + encodeURIComponent('https://yad2.co.il/item/whatsapp123')

    await page.goto('/' + shareQuery)

    // Modal should automatically pop up with parsed fields
    await expect(page.locator('text=קליטה מהירה מוואטסאפ / יד2')).toBeVisible()

    // Verify parsed data
    await expect(page.locator('span:has-text("רוטשילד 10")')).toBeVisible()
    await expect(page.locator('span:has-text("3 חד׳")').first()).toBeVisible()

    // Verify link was appended to original message
    const notesTextarea = page.locator('textarea').nth(1)
    await expect(notesTextarea).toContainText('https://yad2.co.il/item/whatsapp123')

    // Confirm and add to catalog
    await page.click('button:has-text("אישור והוספה למאגר")')

    // Verify property card shows the full message and link
    await expect(page.locator('text=רוטשילד 10').first()).toBeVisible()
    await expect(page.locator('text=https://yad2.co.il/item/whatsapp123').first()).toBeVisible()
  })
})

