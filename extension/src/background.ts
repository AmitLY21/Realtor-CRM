/**
 * Realtor CRM - WhatsApp Web Companion
 * Background Service Worker (Manifest V3)
 *
 * Responsibilities:
 * 1. Listen for captured real estate messages from WhatsApp Web content script.
 * 2. Verify group monitoring permissions against chrome.storage.local ('monitored_groups').
 * 3. Store incoming announcements in a FIFO queue ('pending_listings', max 200 items).
 * 4. Update extension badge counter with pending listings count.
 * 5. Attempt auto-flush to open Realtor CRM tab (localhost and 127.0.0.1).
 * 6. Handle CRM_PING / FLUSH_REQUEST and remove items upon ACK_LISTINGS.
 * 7. Support popup status and queue operations (GET_STATUS, CLEAR_QUEUE, TOGGLE_GROUP).
 */

import type { WhatsAppMessagePayload, ExtensionStatus } from './types'

const CRM_URL_PATTERNS = [
  'http://localhost:*/*',
  'http://127.0.0.1:*/*',
  'https://*.github.io/*'
]
const WHATSAPP_URL_PATTERN = 'https://web.whatsapp.com/*'

/**
 * Update the extension toolbar badge with the current pending listings count.
 */
async function updateBadge(count: number) {
  try {
    if (count > 0) {
      await chrome.action.setBadgeText({ text: String(count) })
      await chrome.action.setBadgeBackgroundColor({ color: '#059669' }) // Emerald green
    } else {
      await chrome.action.setBadgeText({ text: '' })
    }
  } catch {
    // Ignore in contexts where action is not available
  }
}

/**
 * Retrieve the pending listings FIFO queue from chrome.storage.local.
 */
async function getPendingListings(): Promise<WhatsAppMessagePayload[]> {
  try {
    const res = await chrome.storage.local.get('pending_listings')
    return Array.isArray(res.pending_listings) ? res.pending_listings : []
  } catch (err) {
    console.error('[Background] Failed to read pending_listings:', err)
    return []
  }
}

/**
 * Persist pending listings to storage and update toolbar badge.
 */
async function savePendingListings(listings: WhatsAppMessagePayload[]): Promise<void> {
  // Enforce FIFO buffer limit
  const trimmed = listings.slice(-MAX_QUEUE_SIZE)
  await chrome.storage.local.set({ pending_listings: trimmed })
  await updateBadge(trimmed.length)
}

/**
 * Retrieve monitored groups list from storage.
 */
async function getMonitoredGroups(): Promise<string[]> {
  try {
    const res = await chrome.storage.local.get('monitored_groups')
    const raw = res.monitored_groups
    if (Array.isArray(raw)) {
      return raw.map((item: any) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && item.title) return item.title.trim()
        return ''
      }).filter(Boolean)
    }
    return []
  } catch (err) {
    console.error('[Background] Failed to read monitored_groups:', err)
    return []
  }
}

/**
 * Query for open Realtor CRM tabs.
 */
async function findCrmTabs(): Promise<chrome.tabs.Tab[]> {
  try {
    const tabs = await chrome.tabs.query({ url: CRM_URL_PATTERNS })
    return tabs.filter((t) => t.id !== undefined)
  } catch (err) {
    console.error('[Background] Failed to query CRM tabs:', err)
    return []
  }
}

/**
 * Query for open WhatsApp Web tabs.
 */
async function findWhatsAppTabs(): Promise<chrome.tabs.Tab[]> {
  try {
    const tabs = await chrome.tabs.query({ url: WHATSAPP_URL_PATTERN })
    return tabs.filter((t) => t.id !== undefined)
  } catch {
    return []
  }
}

/**
 * Attempt to flush all pending listings to any open Realtor CRM tabs.
 */
async function flushToCrmTabs(): Promise<boolean> {
  const pending = await getPendingListings()
  if (pending.length === 0) {
    return false
  }

  const crmTabs = await findCrmTabs()
  if (crmTabs.length === 0) {
    console.log('[Background] No active CRM tab found. Listings kept in buffer.')
    return false
  }

  let delivered = false
  for (const tab of crmTabs) {
    if (tab.id !== undefined) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'FLUSH_LISTINGS',
          listings: pending,
        })
        console.log(`[Background] Dispatched ${pending.length} listings to CRM tab #${tab.id}`)
        delivered = true
      } catch (err) {
        console.warn(`[Background] Failed to message CRM tab #${tab.id}:`, err)
      }
    }
  }

  return delivered
}

/**
 * Handle incoming new message from WhatsApp Web.
 */
async function handleNewWhatsAppMessage(payload: WhatsAppMessagePayload) {
  if (!payload || !payload.rawText || !payload.groupTitle) {
    return
  }

  // 1. Verify group is monitored
  const monitored = await getMonitoredGroups()
  const target = payload.groupTitle.trim().toLowerCase()
  const isMonitored = monitored.some((g) => g.toLowerCase() === target)

  if (!isMonitored) {
    console.log(`[Background] Ignored message from unmonitored group: "${payload.groupTitle}"`)
    return
  }

  // 2. Add to pending queue (with deduplication)
  const queue = await getPendingListings()
  const exists = queue.some(
    (item) =>
      item.id === payload.id ||
      (item.rawText === payload.rawText && item.groupTitle === payload.groupTitle)
  )

  if (exists) {
    console.log(`[Background] Duplicate listing skipped: [${payload.id}]`)
    return
  }

  queue.push(payload)
  await savePendingListings(queue)

  console.log(`[Background] Stored listing from "${payload.groupTitle}". Total queue: ${queue.length}`)

  // 3. Attempt direct flush to CRM if a tab is open
  await flushToCrmTabs()
}

/**
 * Initialize service worker badge on startup
 */
async function initServiceWorker() {
  const queue = await getPendingListings()
  await updateBadge(queue.length)
}

initServiceWorker()

// Message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false
  }

  const { type } = message

  // 1. WhatsApp Web content script -> New listing captured
  if (type === 'NEW_WHATSAPP_MESSAGE') {
    handleNewWhatsAppMessage(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true // async response
  }

  // 2. CRM Bridge loaded -> Ping & initial flush
  if (type === 'CRM_PING' || type === 'FLUSH_REQUEST') {
    getPendingListings()
      .then((listings) => {
        sendResponse({
          ok: true,
          status: 'connected',
          pendingCount: listings.length,
          listings,
        })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 3. CRM Bridge -> Acknowledged processed listings
  if (type === 'ACK_LISTINGS') {
    const ackIds: string[] | undefined = message.ids
    getPendingListings()
      .then(async (currentQueue) => {
        let updated: WhatsAppMessagePayload[]
        if (Array.isArray(ackIds) && ackIds.length > 0) {
          const ackSet = new Set(ackIds)
          updated = currentQueue.filter((item) => !ackSet.has(item.id))
        } else {
          // If no specific IDs provided, clear all current items
          updated = []
        }
        await savePendingListings(updated)
        console.log(`[Background] Listings ACK received. Remaining queue: ${updated.length}`)
        sendResponse({ ok: true, remainingCount: updated.length })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 4. Popup -> Clear queue
  if (type === 'CLEAR_QUEUE') {
    savePendingListings([])
      .then(() => {
        console.log('[Background] Queue manually cleared by user.')
        sendResponse({ ok: true, remainingCount: 0 })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 5. Popup -> Get overall status
  if (type === 'GET_STATUS') {
    Promise.all([
      findWhatsAppTabs(),
      findCrmTabs(),
      getPendingListings(),
      getMonitoredGroups(),
    ])
      .then(([waTabs, crmTabs, pending, groups]) => {
        const status: ExtensionStatus = {
          whatsappConnected: waTabs.length > 0,
          crmConnected: crmTabs.length > 0,
          pendingCount: pending.length,
          monitoredGroups: groups,
          pendingListings: pending,
        }
        sendResponse({ ok: true, data: status })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 6. Popup -> Add group
  if (type === 'ADD_GROUP') {
    const title = message.title?.trim()
    if (!title) {
      sendResponse({ ok: false, error: 'Empty title' })
      return false
    }

    getMonitoredGroups()
      .then(async (groups) => {
        const exists = groups.some((g) => g.toLowerCase() === title.toLowerCase())
        if (!exists) {
          groups.push(title)
          await chrome.storage.local.set({ monitored_groups: groups })
        }
        sendResponse({ ok: true, groups })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 7. Popup -> Remove group
  if (type === 'REMOVE_GROUP') {
    const title = message.title?.trim()
    getMonitoredGroups()
      .then(async (groups) => {
        const filtered = groups.filter((g) => g.toLowerCase() !== title.toLowerCase())
        await chrome.storage.local.set({ monitored_groups: filtered })
        sendResponse({ ok: true, groups: filtered })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  // 8. Popup -> Toggle group
  if (type === 'TOGGLE_GROUP') {
    const title = message.title?.trim()
    if (!title) {
      sendResponse({ ok: false, error: 'Empty title' })
      return false
    }

    getMonitoredGroups()
      .then(async (groups) => {
        const idx = groups.findIndex((g) => g.toLowerCase() === title.toLowerCase())
        let active = false
        if (idx >= 0) {
          groups.splice(idx, 1)
          active = false
        } else {
          groups.push(title)
          active = true
        }
        await chrome.storage.local.set({ monitored_groups: groups })
        sendResponse({ ok: true, active, groups })
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }))
    return true
  }

  return false
})
