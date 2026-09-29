import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import fs from 'fs'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extensionPath = path.resolve(__dirname, '../extension')

async function run() {
  console.log('Testing extension at:', extensionPath)

  // Launch persistent context with extension loaded
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-ext-'))
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  })

  // Wait for service worker to register
  let [background] = context.serviceWorkers()
  if (!background) {
    background = await context.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null)
  }
  console.log('Service worker detected:', !!background)

  // Open the live site
  const page = await context.newPage()
  
  const consoleLogs = []
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    console.log(`PAGE LOG: [${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message)
  })

  console.log('Navigating to https://amitly21.github.io/Realtor-CRM/ ...')
  await page.goto('https://amitly21.github.io/Realtor-CRM/', { waitUntil: 'networkidle', timeout: 30000 })

  // Check if crm-bridge is injected
  const isBridgeInjected = consoleLogs.some(l => l.includes('Realtor CRM Companion Bridge'))
  console.log('Bridge injected in console logs?', isBridgeInjected)

  // Check what service worker has in storage
  if (background) {
    console.log('Injecting a test real estate message into extension pending_listings...')
    await background.evaluate(async () => {
      await chrome.storage.local.set({
        monitored_groups: ['קבוצת נדל״ן'],
        pending_listings: [{
          id: 'test-live-wa-1',
          rawText: 'למכירה דירה 4 חדרים ברחוב רופין 12 תל אביב קומה 3 עם מעלית וממ״ד מחיר 3,850,000 ש״ח',
          senderName: 'מתווך תל אביב',
          senderPhone: '052-9998888',
          timestamp: '11:15',
          groupTitle: 'קבוצת נדל״ן',
          matchedKeywords: ['למכירה', 'חדרים', 'דירה'],
          receivedAt: new Date().toISOString(),
          source: 'whatsapp'
        }]
      })
    })

    console.log('Waiting 5 seconds for heartbeat / flush to trigger...')
    await page.waitForTimeout(5000)

    // Inspect extension storage after flush
    const storageAfter = await background.evaluate(async () => {
      return await chrome.storage.local.get(null)
    })
    console.log('Extension storage after flush:', JSON.stringify(storageAfter, null, 2))

    // Inspect IndexedDB inside the page
    const dbListings = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open('RealtorCRM_DB')
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('incoming_listings')) {
            return resolve({ error: 'no incoming_listings store' })
          }
          const tx = db.transaction('incoming_listings', 'readonly')
          const store = tx.objectStore('incoming_listings')
          const getReq = store.getAll()
          getReq.onsuccess = () => resolve(getReq.result)
          getReq.onerror = () => resolve({ error: getReq.error?.message })
        }
        req.onerror = () => resolve({ error: req.error?.message })
      })
    })
    console.log('IndexedDB incoming_listings in page:', JSON.stringify(dbListings, null, 2))

    // Check UI elements on the live page
    console.log('Checking Header WhatsApp button and badge...')
    // Look for button with title containing קליטת וואטסאפ
    const waButton = page.locator('button[title*="קליטת וואטסאפ"]').first()
    await waButton.waitFor({ state: 'visible', timeout: 5000 })
    console.log('WhatsApp button found in Header!')

    // Check badge count
    const badge = waButton.locator('span').filter({ hasText: '1' })
    const badgeVisible = await badge.isVisible().catch(() => false)
    console.log('Header badge showing "1"?', badgeVisible)

    // Dismiss any onboarding/welcome dialog if open
    await page.keyboard.press('Escape')
    const dismissBtn = page.locator('button:has-text("הבנתי"), button:has-text("סגור"), button:has-text("דלג")').first()
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click()
    }
    await page.waitForTimeout(500)

    // Open drawer by clicking the button
    console.log('Clicking WhatsApp button to open drawer...')
    await waButton.click({ force: true })
    await page.waitForTimeout(1000)

    // Check if drawer is open
    const drawerTitle = page.locator('text=מודעות וואטסאפ נכנסות')
    const isDrawerOpen = await drawerTitle.isVisible().catch(() => false)
    console.log('IncomingListingsDrawer open?', isDrawerOpen)

    // Check if property card exists in drawer
    const cardStreet = page.locator('text=רופין 12')
    const isCardVisible = await cardStreet.isVisible().catch(() => false)
    console.log('Property card with "רופין 12" visible in drawer?', isCardVisible)

    const screenshotPath = path.resolve(__dirname, '../public/drawer-live-test.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log('Saved screenshot to:', screenshotPath)
  }

  await context.close()
}

run().catch(err => {
  console.error('Test run failed:', err)
  process.exit(1)
})
