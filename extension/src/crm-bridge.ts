/**
 * Realtor CRM - WhatsApp Web Companion
 * Content script injected into http://localhost:*, http://127.0.0.1:*, and https://*.github.io/*
 *
 * Responsibilities:
 * 1. Announce presence to background service worker via CRM_PING upon load.
 * 2. Receive buffered listings from background worker (FLUSH_LISTINGS).
 * 3. Dispatch standard custom DOM event AND postMessage:
 *    - window.dispatchEvent(new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', { detail: listings }))
 *    - window.postMessage({ type: 'REALTOR_CRM_WHATSAPP_LISTINGS', detail: listings, listings }, '*')
 * 4. Listen for acknowledgment from Realtor CRM via CustomEvent and postMessage:
 *    and forward ACK_LISTINGS to background worker to clear processed items.
 * 5. Support on-demand flush requests from application.
 */

import type { WhatsAppMessagePayload } from './types'

console.log(
  '%c[Realtor CRM Companion Bridge] 🚀 Injected & Active on ' + window.location.href,
  'color: #059669; font-weight: bold; font-size: 12px;'
)

/**
 * Dispatch listings to the web application window via CustomEvent AND postMessage.
 */
function dispatchListingsToApp(listings: WhatsAppMessagePayload[]) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return
  }

  console.log(
    `%c[Realtor CRM Companion Bridge] 📥 Dispatching ${listings.length} WhatsApp listing(s) to application`,
    'color: #0284c7; font-weight: bold;',
    listings
  )

  // 1. Dispatch standard CustomEvent
  try {
    window.dispatchEvent(
      new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
        detail: listings,
      })
    )
  } catch (err) {
    console.warn('[Realtor CRM Companion Bridge] CustomEvent dispatch error:', err)
  }

  // 2. Dispatch window.postMessage (guaranteed cross-world compatibility)
  try {
    window.postMessage(
      {
        type: 'REALTOR_CRM_WHATSAPP_LISTINGS',
        detail: listings,
        listings,
      },
      '*'
    )
  } catch (err) {
    console.warn('[Realtor CRM Companion Bridge] postMessage dispatch error:', err)
  }
}

/**
 * Forward ACK to background worker.
 */
function forwardAck(ids?: string[]) {
  console.log(`[Realtor CRM Companion Bridge] 📤 Forwarding ACK for ${ids?.length ? ids.join(', ') : 'all'} listings`)
  try {
    chrome.runtime.sendMessage({
      type: 'ACK_LISTINGS',
      ids: ids && ids.length > 0 ? ids : undefined,
    })
  } catch (err) {
    console.warn('[Realtor CRM Companion] Failed to forward ACK to background worker:', err)
  }
}

/**
 * Request flush from background worker.
 */
function requestFlush() {
  console.log('[Realtor CRM Companion Bridge] 🔄 Flush requested from application')
  try {
    chrome.runtime.sendMessage({ type: 'FLUSH_REQUEST' }, (response) => {
      if (response && response.ok && Array.isArray(response.listings) && response.listings.length > 0) {
        dispatchListingsToApp(response.listings)
      }
    })
  } catch (err) {
    console.warn('[Realtor CRM Companion] Failed to request flush:', err)
  }
}

/**
 * Send CRM_PING to background worker to check for any offline buffered listings.
 */
function pingBackgroundWorker() {
  try {
    chrome.runtime.sendMessage({ type: 'CRM_PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.debug('[Realtor CRM Companion] Service worker ping standby:', chrome.runtime.lastError.message)
        return
      }

      if (response && response.ok && Array.isArray(response.listings) && response.listings.length > 0) {
        dispatchListingsToApp(response.listings)
      }
    })
  } catch (err) {
    console.debug('[Realtor CRM Companion] Context error on initial ping:', err)
  }
}

// 1. Listen for FLUSH_LISTINGS messages sent directly from the background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false
  }

  if (message.type === 'FLUSH_LISTINGS' && Array.isArray(message.listings)) {
    dispatchListingsToApp(message.listings)
    sendResponse({ received: true, count: message.listings.length })
    return true
  }

  return false
})

// 2. Listen for CustomEvent acknowledgments & flush requests from the app
window.addEventListener('REALTOR_CRM_ACK_LISTING', (event: Event) => {
  const customEvent = event as CustomEvent<{ id?: string; ids?: string[] }>
  const detail = customEvent.detail
  let ids: string[] = []
  if (Array.isArray(detail?.ids)) {
    ids = detail.ids
  } else if (typeof detail?.id === 'string' && detail.id) {
    ids = [detail.id]
  }
  forwardAck(ids.length > 0 ? ids : undefined)
})

window.addEventListener('REALTOR_CRM_REQUEST_FLUSH', () => {
  requestFlush()
})

// 3. Listen for postMessage acknowledgments & flush requests from the app
window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'REALTOR_CRM_REQUEST_FLUSH') {
    requestFlush()
  } else if (event.data.type === 'REALTOR_CRM_ACK_LISTING') {
    const ids: string[] = Array.isArray(event.data.ids)
      ? event.data.ids
      : (event.data.id ? [event.data.id] : [])
    forwardAck(ids.length > 0 ? ids : undefined)
  }
})

// Initialize bridge with staggered pings to catch late React hydration
pingBackgroundWorker()
setTimeout(pingBackgroundWorker, 800)
setTimeout(pingBackgroundWorker, 2000)
setTimeout(pingBackgroundWorker, 4000)

