import { chromium } from '@playwright/test'
import path from 'path'

async function capture() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await page.goto('http://localhost:5174/')
  await page.waitForTimeout(1000)

  const artifactDir = '/Users/Amit.Levy/.gemini/antigravity-ide/brain/a3159d3b-a2ee-4b33-8ca3-8eef23bf80bb'

  // 1. Dashboard screenshot
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_dashboard.png'), fullPage: true })

  // 2. Properties view
  await page.click('button:has-text("נכסים")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_properties.png'), fullPage: true })

  // 3. Leads Kanban pipeline
  await page.click('button:has-text("לקוחות ומשפך")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_kanban.png'), fullPage: true })

  // 4. Matches view
  await page.click('button:has-text("התאמות")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_matches.png'), fullPage: true })

  // 5. Settings view
  await page.click('button:has-text("הגדרות")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_settings.png'), fullPage: true })

  await browser.close()
  console.log('All screenshots captured successfully!')
}

capture().catch(console.error)
