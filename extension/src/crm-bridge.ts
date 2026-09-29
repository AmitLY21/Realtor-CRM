/**
 * Realtor CRM - WhatsApp Web Companion
 * Content script injected into http://localhost:* and http://127.0.0.1:*
 *
 * Responsibilities:
 * 1. Announce presence to background service worker via CRM_PING upon load.
 * 2. Receive buffered listings from background worker (FLUSH_LISTINGS).
 * 3. Dispatch standard custom DOM event:
 *    window.dispatchEvent(new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', { detail: listings }))
 * 4. Listen for acknowledgment from Realtor CRM:
 *    window.addEventListener('REALTOR_CRM_ACK_LISTING', (e) => ...)
 *    and forward ACK_LISTINGS to background worker to clear processed items.
 * 5. Support on-demand flush requests:
 *    window.addEventListener('REALTOR_CRM_REQUEST_FLUSH', () => ...)
 */

import type { WhatsAppMessagePayload } from './types'

console.log(
  '%c[Realtor CRM Companion Bridge] 🚀 Injected & Active',
  'color: #059669; font-weight: bold; font-size: 12px;'
)

/**
 * Dispatch listings to the web application window via CustomEvent.
 */
function dispatchListingsToApp(listings: WhatsAppMessagePayload[]) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return
  }

  console.log(
    `%c[Realtor CRM Companion Bridge] 📥 Dispatching ${listings.length} WhatsApp listing(s) to application`,
    'color: #0284c7; font-weight: bold;'
  )

  window.dispatchEvent(
    new CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', {
      detail: listings,
    })
  )
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

// 2. Listen for acknowledgment from the Realtor CRM React application
window.addEventListener('REALTOR_CRM_ACK_LISTING', (event: Event) => {
  const customEvent = event as CustomEvent<{ id?: string; ids?: string[] }>
  const detail = customEvent.detail

  let ids: string[] = []
  if (Array.isArray(detail?.ids)) {
    ids = detail.ids
  } else if (typeof detail?.id === 'string' && detail.id) {
    ids = [detail.id]
  }

  console.log(`[Realtor CRM Companion Bridge] 📤 Forwarding ACK for ${ids.length ? ids.join(', ') : 'all'} listings`)

  try {
    chrome.runtime.sendMessage({
      type: 'ACK_LISTINGS',
      ids: ids.length > 0 ? ids : undefined,
    })
  } catch (err) {
    console.warn('[Realtor CRM Companion] Failed to forward ACK to background worker:', err)
  }
})

// 3. Listen for manual flush request from the Realtor CRM React application
window.addEventListener('REALTOR_CRM_REQUEST_FLUSH', () => {
  console.log('[Realtor CRM Companion Bridge] 🔄 Manual flush requested from application')
  try {
    chrome.runtime.sendMessage({ type: 'FLUSH_REQUEST' }, (response) => {
      if (response && response.ok && Array.isArray(response.listings)) {
        dispatchListingsToApp(response.listings)
      }
    })
  } catch (err) {
    console.warn('[Realtor CRM Companion] Failed to request flush:', err)
  }
})

// Initialize bridge
pingBackgroundWorker()
