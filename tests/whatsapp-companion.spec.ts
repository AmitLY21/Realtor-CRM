import { test, expect } from '@playwright/test'

test.describe('WhatsApp Companion Extension & Ingestion Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('realtor_crm_onboarded', 'true')
    })
    await page.goto('http://localhost:5174/')
    await expect(page.locator('header h1:has-text("RealtorCRM")')).toBeVisible({ timeout: 10000 })
  })

  test('1. Header displays WhatsApp Inbox button and toggles Incoming Listings drawer', async ({ page }) => {
    // Locate WhatsApp button in header
    const waButton = page.locator('button[title*="וואטסאפ"]')
    await expect(waButton).toBeVisible()

    // Click to open drawer
    await waButton.click()
    await expect(page.locator('text=מודעות וואטסאפ נכנסות')).toBeVisible()

    // Close drawer
    await page.keyboard.press('Escape')
    await expect(page.locator('text=מודעות וואטסאפ נכנסות')).not.toBeVisible()
  })

  test('2. Dispatches WhatsApp listing event, filters chatter, and displays qualified listing in drawer', async ({ page }) => {
    // Open drawer
    await page.locator('button[title*="וואטסאפ"]').click()
    await expect(page.locator('text=מודעות וואטסאפ נכנסות')).toBeVisible()

    // Simulate incoming messages: 1 real property listing, 1 group chatter
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
          detail: [
            {
              id: 'test-wa-listing-1',
              rawText: `*למכירה בבלעדיות ברמת גן!*
ברחוב ביאליק 45, מרכז העיר המבוקש.
4 חדרים ענקית כ-105 מ"ר, קומה 2 עם מעלית וממ"ד.
מרפסת שמש 14 מ"ר, חניה בטאבו.
מחיר שיווק: 3,250,000 ש"ח.
לפרטים: יובל 052-9876543`,
              senderPhone: '052-9876543',
              senderName: 'יובל מתווך',
              groupTitle: 'נדל״ן מרכז - שת״פ סוכנים',
              timestamp: Date.now()
            },
            {
              id: 'test-wa-chatter-2',
              rawText: 'בוקר טוב לכולם, מישהו מכיר עו"ד מקרקעין מומלץ באזור חיפה?',
              senderPhone: '050-0000000',
              senderName: 'דני',
              groupTitle: 'נדל״ן מרכז - שת״פ סוכנים',
              timestamp: Date.now()
            }
          ]
        })
      )
    })

    // Assert that the real estate listing appears in the drawer
    await expect(page.locator('text=ביאליק').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=3,250,000 ₪').first()).toBeVisible()
    await expect(page.locator('text=4 חד׳').first()).toBeVisible()

    // Assert chatter message was filtered out and does not appear
    await expect(page.locator('text=מישהו מכיר עו"ד מקרקעין')).not.toBeVisible()

    // Click "ייבא לנכסים" to launch SmartPasteModal
    const importBtn = page.locator('button:has-text("ייבא לנכסים")').first()
    await importBtn.click()

    // Verify SmartPasteModal opens pre-filled
    await expect(page.locator('text=קליטה מהירה מוואטסאפ')).toBeVisible()
    await expect(page.locator('input[value="ביאליק"]')).toBeVisible()
    await expect(page.locator('input[value="3250000"]')).toBeVisible()

    // Save property into CRM catalog
    await page.click('button:has-text("אישור והוספה למאגר")')

    // Verify modal closes and property appears in properties catalog
    await expect(page.locator('text=ביאליק 45').first()).toBeVisible({ timeout: 5000 })
  })

  test('3. Handles duplicate repost across groups and surfaces duplicate catalog warning', async ({ page }) => {
    // Open drawer
    await page.locator('button[title*="וואטסאפ"]').click()
    await expect(page.locator('text=מודעות וואטסאפ נכנסות')).toBeVisible()

    // Dispatch message 1 from Group A
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
          detail: [
            {
              id: 'prop-dup-test-1',
              rawText: `למכירה ברמת גן, רחוב הירדן 12, 3 חדרים, קומה 1, מחיר 2,600,000 ש"ח`,
              senderPhone: '054-1111111',
              groupTitle: 'קבוצת תיווך מרכז',
              timestamp: Date.now()
            }
          ]
        })
      )
    })

    await expect(page.locator('text=הירדן 12').first()).toBeVisible({ timeout: 5000 })

    // Dispatch repost of the SAME property from Group B with price drop to 2,500,000 ₪
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
          detail: [
            {
              id: 'prop-dup-test-2',
              rawText: `דירה בהירדן 12 רמת גן! 3 חדרים, ירידת מחיר ל-2,500,000 ש"ח!!`,
              senderPhone: '054-2222222',
              groupTitle: 'שת״פ סוכנים גוש דן',
              timestamp: Date.now()
            }
          ]
        })
      )
    })

    // Assert that repost was consolidated: shows "פורסם ב-2 קבוצות"
    await expect(page.locator('text=פורסם ב-2 קבוצות').first()).toBeVisible({ timeout: 5000 })
    // Assert price was updated to 2,500,000 ₪
    await expect(page.locator('text=2,500,000 ₪').first()).toBeVisible()
  })
})
