/**
 * Realtor CRM - WhatsApp Web Companion
 * Content script injected into https://web.whatsapp.com/*
 *
 * Responsibilities:
 * 1. Chat Header Detection & "סנכרן ל-CRM" toggle injection.
 * 2. Real-time message observation via MutationObserver.
 * 3. Outgoing message suppression & deduplication.
 * 4. Israeli real estate keyword detection.
 * 5. Extraction of message text, sender name/phone, timestamp, and group title.
 * 6. Forwarding matching announcements to background service worker.
 */

import type { WhatsAppMessagePayload, ExtensionMessage } from './types'

// Israeli real estate keywords to monitor
const ISRAELI_REAL_ESTATE_KEYWORDS: readonly string[] = [
  'למכירה',
  'להשכרה',
  'חדרים',
  'שיווק',
  'מבוקש',
  'קומה',
  'מ"ר',
  'מ״ר',
  'מר',
  'דירה',
  'פנטהאוז',
  'דופלקס',
  'גג',
  'גן',
  'רחוב',
  'רח',
  'טאבו',
  'בלעדיות',
]

// Cache of processed message IDs to avoid duplicates on virtual scroll
const processedMessageIds = new Set<string>()
const MAX_PROCESSED_CACHE = 5000

// Injected button DOM ID
const SYNC_BTN_ID = 'realtor-crm-sync-button'
const SYNC_CONTAINER_ID = 'realtor-crm-sync-container'

let lastActiveChatTitle = ''

/**
 * Clean invisible unicode marks (LTR/RTL marks, zero-width spaces).
 */
function cleanText(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
    .trim()
}

/**
 * Check if text contains any Israeli real estate keywords.
 */
function matchRealEstateKeywords(text: string): string[] {
  if (!text) return []
  const matches: string[] = []
  const lowerText = text.toLowerCase()

  for (const keyword of ISRAELI_REAL_ESTATE_KEYWORDS) {
    const lowerKeyword = keyword.toLowerCase()
    // Test word boundary or regex match
    if (lowerText.includes(lowerKeyword)) {
      matches.push(keyword)
    }
  }

  return matches
}

/**
 * Normalize and read monitored groups from chrome.storage.local
 */
async function getMonitoredGroups(): Promise<string[]> {
  try {
    const data = await chrome.storage.local.get('monitored_groups')
    const raw = data.monitored_groups
    if (Array.isArray(raw)) {
      return raw.map((item: any) => {
        if (typeof item === 'string') return cleanText(item)
        if (item && typeof item === 'object' && item.title) return cleanText(item.title)
        return ''
      }).filter(Boolean)
    }
    return []
  } catch (err) {
    console.error('[Realtor CRM] Failed to read monitored_groups from storage:', err)
    return []
  }
}

/**
 * Check if a specific group title is currently monitored.
 */
async function isGroupMonitored(title: string): Promise<boolean> {
  if (!title) return false
  const target = cleanText(title).toLowerCase()
  const groups = await getMonitoredGroups()
  return groups.some((g) => g.toLowerCase() === target)
}

/**
 * Toggle monitoring for a given group title.
 */
async function toggleGroupMonitoring(title: string): Promise<boolean> {
  const cleanTitle = cleanText(title)
  if (!cleanTitle) return false

  const groups = await getMonitoredGroups()
  const target = cleanTitle.toLowerCase()
  const existsIndex = groups.findIndex((g) => g.toLowerCase() === target)

  let newState = false
  if (existsIndex >= 0) {
    // Remove group
    groups.splice(existsIndex, 1)
    newState = false
  } else {
    // Add group
    groups.push(cleanTitle)
    newState = true
  }

  await chrome.storage.local.set({ monitored_groups: groups })
  console.log(`[Realtor CRM] Monitored group "${cleanTitle}" toggled -> ${newState ? 'ACTIVE' : 'INACTIVE'}`)
  return newState
}

/**
 * Extract active chat title from WhatsApp Web header.
 */
function getActiveChatTitle(): string {
  const main = document.querySelector('#main') || document.querySelector('div[role="region"]')
  if (!main) return ''

  // Look for header title selectors
  const titleSelectors = [
    'header span[data-testid="conversation-info-header-chat-title"]',
    'header [data-testid="chat-title"]',
    'header [data-testid="conversation-title"]',
    'header span[dir="auto"][title]',
    'header h2 span[dir="auto"]',
    'header div[role="button"] span[dir="auto"]',
    'header span.title',
  ]

  for (const selector of titleSelectors) {
    const el = main.querySelector(selector)
    if (el) {
      const title = el.getAttribute('title') || el.textContent || ''
      const cleaned = cleanText(title)
      if (cleaned) return cleaned
    }
  }

  // Fallback: any header span with text inside header
  const header = main.querySelector('header')
  if (header) {
    const spans = header.querySelectorAll('span[dir="auto"]')
    for (const span of Array.from(spans)) {
      const text = cleanText(span.textContent || '')
      // Ignore time or status like 'online' or 'typing...'
      if (text && !text.includes(':') && text.length > 1) {
        return text
      }
    }
  }

  return ''
}

/**
 * Find the conversation header in the DOM.
 */
function getConversationHeader(): HTMLElement | null {
  const main = document.querySelector('#main') || document.querySelector('div[role="region"]')
  if (!main) return null

  const header =
    main.querySelector('header[data-testid="conversation-header"]') ||
    main.querySelector('header')
  return header as HTMLElement | null
}

/**
 * Injects or updates the "סנכרן ל-CRM" toggle button in the active conversation header.
 */
async function updateSyncButton() {
  const header = getConversationHeader()
  const chatTitle = getActiveChatTitle()

  if (!header || !chatTitle) {
    return
  }

  lastActiveChatTitle = chatTitle
  const isMonitored = await isGroupMonitored(chatTitle)

  let container = document.getElementById(SYNC_CONTAINER_ID)
  let button = document.getElementById(SYNC_BTN_ID) as HTMLButtonElement | null

  if (!container || !button || !header.contains(container)) {
    // If not in DOM or detached, recreate
    container?.remove()

    container = document.createElement('div')
    container.id = SYNC_CONTAINER_ID
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin: 0 10px;
      vertical-align: middle;
      z-index: 100;
    `

    button = document.createElement('button')
    button.id = SYNC_BTN_ID
    button.setAttribute('type', 'button')
    button.addEventListener('click', async (e) => {
      e.stopPropagation()
      e.preventDefault()
      button!.disabled = true
      button!.style.opacity = '0.7'

      const currentTitle = getActiveChatTitle()
      if (currentTitle) {
        const nextState = await toggleGroupMonitoring(currentTitle)
        applyButtonState(button!, nextState, currentTitle)
      }

      button!.disabled = false
      button!.style.opacity = '1'
    })

    container.appendChild(button)

    // Locate insertion point: after title section or before header action icons
    // WhatsApp header typically has an action icons wrapper with data-testid="conversation-header-actions"
    const actionsWrapper =
      header.querySelector('div[data-testid="conversation-header-actions"]') ||
      header.querySelector('div[role="toolbar"]') ||
      header.lastElementChild

    if (actionsWrapper && actionsWrapper.parentElement === header) {
      header.insertBefore(container, actionsWrapper)
    } else {
      header.appendChild(container)
    }
  }

  applyButtonState(button, isMonitored, chatTitle)
}

/**
 * Apply styling and labels to the sync button based on monitored state.
 */
function applyButtonState(button: HTMLButtonElement, isMonitored: boolean, chatTitle: string) {
  const baseStyle = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    line-height: 1.4;
    white-space: nowrap;
    direction: rtl;
  `

  if (isMonitored) {
    // Active state: Emerald green with checkmark badge
    button.style.cssText = `
      ${baseStyle}
      background-color: #059669;
      color: #ffffff;
      border: 1px solid #047857;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.25);
    `
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>סנכרון פעיל ל-CRM</span>
    `
    button.title = `קבוצה זו ("${chatTitle}") מנוטרת ע״י Realtor CRM. לחץ לביטול סנכרון.`
  } else {
    // Inactive state: Sleek outline badge
    button.style.cssText = `
      ${baseStyle}
      background-color: rgba(248, 250, 252, 0.95);
      color: #475569;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    `
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      <span>סנכרן ל-CRM</span>
    `
    button.title = `לחץ לניטור קבוצה זו ("${chatTitle}") והעברת מודעות נדל״ן ישירות ל-CRM.`
  }
}

/**
 * Extract sender information and timestamp from a WhatsApp message element.
 */
function extractMessageDetails(msgElement: HTMLElement, currentGroupTitle: string) {
  // 1. Text extraction
  let rawText = ''
  const textSelectors = [
    '.copyable-text span.selectable-text',
    'span.selectable-text',
    '.copyable-text',
    'span[dir="ltr"]',
    'span[dir="rtl"]',
    'span[dir="auto"]',
  ]

  for (const sel of textSelectors) {
    const el = msgElement.querySelector(sel)
    if (el) {
      const text = el.textContent || ''
      if (text.trim().length > rawText.length) {
        rawText = text.trim()
      }
    }
  }

  // 2. Metadata extraction from copyable-text attribute (e.g. data-pre-plain-text="[14:32, 29/09/2026] +972 50-123-4567: ")
  let senderName = ''
  let senderPhone = ''
  let timestampStr = ''

  const copyable = msgElement.querySelector('[data-pre-plain-text]') || msgElement
  const preText = copyable.getAttribute('data-pre-plain-text')

  if (preText) {
    // WhatsApp format: [HH:mm, DD/MM/YYYY] Author:
    const match = preText.match(/\[(.*?)\]\s*(.*?):\s*$/)
    if (match) {
      timestampStr = match[1].trim()
      const rawAuthor = match[2].trim()
      // Check if author is a phone number or name
      if (/^[\d+\s\-()]{7,}$/.test(rawAuthor)) {
        senderPhone = rawAuthor
        senderName = rawAuthor
      } else {
        senderName = rawAuthor
      }
    }
  }

  // Fallbacks if data-pre-plain-text was not present
  if (!senderName) {
    const authorEl =
      msgElement.querySelector('span[data-testid="author"]') ||
      msgElement.querySelector('span[data-testid="chat-author"]') ||
      msgElement.querySelector('div[data-testid="author"]')
    if (authorEl && authorEl.textContent) {
      senderName = cleanText(authorEl.textContent)
    }
  }

  if (!timestampStr) {
    const timeEl =
      msgElement.querySelector('div[data-testid="msg-meta"] span') ||
      msgElement.querySelector('span[data-testid="msg-meta"]') ||
      msgElement.querySelector('[data-testid="msg-meta"]')
    if (timeEl && timeEl.textContent) {
      timestampStr = cleanText(timeEl.textContent)
    }
  }

  // Message ID extraction
  const dataId = msgElement.getAttribute('data-id') || ''
  const generatedId =
    dataId ||
    `wa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  return {
    id: generatedId,
    rawText: cleanText(rawText),
    senderName: senderName || 'חבר קבוצה',
    senderPhone: senderPhone || undefined,
    timestamp: timestampStr || new Date().toISOString(),
    groupTitle: currentGroupTitle,
  }
}

/**
 * Inspect a message element and process if it meets criteria.
 */
async function processMessageElement(msgElement: HTMLElement) {
  // 1. Ignore outgoing messages sent by the user
  const isOutgoing =
    msgElement.classList.contains('message-out') ||
    Boolean(msgElement.closest('.message-out')) ||
    Boolean(msgElement.getAttribute('data-id')?.startsWith('true_'))

  if (isOutgoing) {
    return
  }

  // 2. Identify message unique key
  const dataId = msgElement.getAttribute('data-id') || ''
  if (dataId && processedMessageIds.has(dataId)) {
    return
  }

  // 3. Extract text
  const currentGroupTitle = getActiveChatTitle()
  if (!currentGroupTitle) return

  const details = extractMessageDetails(msgElement, currentGroupTitle)
  if (!details.rawText || details.rawText.length < 10) {
    return
  }

  // Generate composite key if dataId not present
  const messageKey = dataId || `${currentGroupTitle}_${details.senderName}_${details.timestamp}_${details.rawText.slice(0, 30)}`
  if (processedMessageIds.has(messageKey)) {
    return
  }

  // Mark as processed immediately
  processedMessageIds.add(messageKey)
  if (dataId) processedMessageIds.add(dataId)

  // Prune cache if oversized
  if (processedMessageIds.size > MAX_PROCESSED_CACHE) {
    const it = processedMessageIds.values()
    for (let i = 0; i < 500; i++) {
      const val = it.next().value
      if (val !== undefined) {
        processedMessageIds.delete(val)
      } else {
        break
      }
    }
  }

  // 4. Fast Israeli real estate keyword heuristic
  const matchedKeywords = matchRealEstateKeywords(details.rawText)
  if (matchedKeywords.length === 0) {
    return
  }

  // 5. Check if active group is monitored
  const isMonitored = await isGroupMonitored(currentGroupTitle)
  if (!isMonitored) {
    return
  }

  // 6. Build listing payload
  const payload: WhatsAppMessagePayload = {
    id: details.id,
    rawText: details.rawText,
    senderName: details.senderName,
    senderPhone: details.senderPhone,
    timestamp: details.timestamp,
    groupTitle: currentGroupTitle,
    matchedKeywords,
    receivedAt: new Date().toISOString(),
    source: 'whatsapp',
  }

  console.log(
    `%c[Realtor CRM Companion] 🏠 Real Estate Announcement Detected!`,
    'color: #059669; font-weight: bold; font-size: 12px;',
    `\nGroup: "${currentGroupTitle}"`,
    `\nSender: ${details.senderName}`,
    `\nKeywords: [${matchedKeywords.join(', ')}]`,
    `\nText: ${details.rawText.slice(0, 100)}...`
  )

  // 7. Send to background service worker
  try {
    const message: ExtensionMessage = {
      type: 'NEW_WHATSAPP_MESSAGE',
      payload,
    }
    chrome.runtime.sendMessage(message)
  } catch (err) {
    console.warn('[Realtor CRM] Error forwarding message to background worker:', err)
  }
}

/**
 * Initialize DOM mutation observers
 */
function initObservers() {
  console.log('[Realtor CRM Companion] WhatsApp Web Observer initialized.')

  // Monitor DOM for conversation switches and header changes
  const mainObserver = new MutationObserver((mutations) => {
    let shouldUpdateHeader = false

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Check if header or main conversation changed
            if (
              node.tagName === 'HEADER' ||
              node.querySelector('header') ||
              node.id === 'main' ||
              node.getAttribute('role') === 'region'
            ) {
              shouldUpdateHeader = true
            }

            // Check if new messages arrived
            if (
              node.classList.contains('message-in') ||
              node.hasAttribute('data-id') ||
              node.querySelector?.('div[data-id], .message-in')
            ) {
              processMessageElement(node)
              const nested = node.querySelectorAll?.('div[data-id], .message-in')
              nested?.forEach((n) => processMessageElement(n as HTMLElement))
            }
          }
        }
      }
    }

    if (shouldUpdateHeader) {
      updateSyncButton()
    }
  })

  mainObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Periodic poll to maintain sync button state and detect chat title switches
  setInterval(() => {
    const currentTitle = getActiveChatTitle()
    if (currentTitle && currentTitle !== lastActiveChatTitle) {
      updateSyncButton()
    } else {
      // Ensure button didn't get removed by React/virtual DOM
      const btn = document.getElementById(SYNC_BTN_ID)
      if (!btn && getConversationHeader()) {
        updateSyncButton()
      }
    }
  }, 1000)

  // Listen for storage changes from popup
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.monitored_groups) {
      console.log('[Realtor CRM] Storage updated monitored_groups -> refreshing button state')
      updateSyncButton()
    }
  })

  // Initial attempt to update header
  updateSyncButton()
}

// Start observer when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initObservers)
} else {
  initObservers()
}
