import { useEffect } from 'react'
import { parseRawListingText } from './parser'
import { db, addIncomingListing, checkPropertyDuplicate } from './db'
import { sendPushNotification } from './notifications'
import { WhatsAppIncomingListing } from '../types'

export interface RawWhatsAppListingPayload {
  id?: string
  rawText?: string
  text?: string
  message?: string
  senderPhone?: string
  senderName?: string
  groupTitle?: string
  receivedAt?: number
  timestamp?: number
}

// Forward ACK to companion extension via both CustomEvent and postMessage
function ackListingToBridge(id: string) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent('REALTOR_CRM_ACK_LISTING', {
        detail: { ids: [id] }
      })
    )
  } catch {}
  try {
    window.postMessage(
      {
        type: 'REALTOR_CRM_ACK_LISTING',
        ids: [id]
      },
      '*'
    )
  } catch {}
}

/**
 * Request flush of pending listings from the Chrome Companion extension.
 */
export function requestWhatsAppListingsFlush() {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('REALTOR_CRM_REQUEST_FLUSH'))
  } catch {}
  try {
    window.postMessage({ type: 'REALTOR_CRM_REQUEST_FLUSH' }, '*')
  } catch {}
}

/**
 * Ingest and process a single raw WhatsApp listing payload.
 * Applies quality gating, duplicate detection against active CRM properties,
 * checks for queue duplicates, persists to Dexie db.incoming_listings,
 * triggers push notification, and dispatches ACK event.
 */
export async function processSingleIncomingListing(
  item: RawWhatsAppListingPayload
): Promise<string | null> {
  const rawText = (item.rawText || item.text || item.message || '').trim()
  if (!rawText) return null

  const listingId = item.id || `wa-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  const groupTitle = item.groupTitle?.trim() || 'קבוצת וואטסאפ'
  const normalizedText = rawText.replace(/\s+/g, ' ').trim()

  // 1. Parse text using existing deep Israeli real-estate parser
  const parsedDraft = parseRawListingText(rawText)

  // 2. Signals Evaluation
  let signals = 0
  if (parsedDraft.price !== undefined && parsedDraft.price > 0) signals++
  if (parsedDraft.rooms !== undefined && parsedDraft.rooms > 0) signals++
  if (parsedDraft.street && parsedDraft.street.trim()) signals++
  if (parsedDraft.city && parsedDraft.city.trim()) signals++
  if (parsedDraft.property_type && parsedDraft.property_type !== 'apartment') signals++
  if (parsedDraft.has_mamad || parsedDraft.has_balcony || parsedDraft.has_elevator) signals++

  // Check if text has any real estate signals or keywords
  const isRealEstateListing = 
    parsedDraft.confidenceScore >= 15 || 
    signals >= 1 || 
    /(?:דיר[הת]|למכיר[הת]|להשכר[הת]|חדר(?:ים)?|קומה|מ[״"״]ר|פנטהאוז|דופלקס|גג|גן|קרקע|וילה|קוטג׳|טאבו|בלעדיות)/i.test(rawText)

  if (!isRealEstateListing) {
    console.log('[Realtor CRM Ingestion] ⏭️ Skipping pure group chatter from:', groupTitle, rawText.slice(0, 50))
    // Acknowledge so extension clears it from queue!
    ackListingToBridge(listingId)
    return null
  }

  // 3. Queue Deduplication & Multi-Group Repost Consolidation
  const existingById = await db.incoming_listings.get(listingId)
  if (existingById) {
    console.log('[Realtor CRM Ingestion] ⏭️ Item already exists in queue:', listingId)
    ackListingToBridge(listingId)
    return null
  }

  const allQueueItems = await db.incoming_listings.toArray()

  // Check if an identical or matching property announcement is already in the queue
  const existingMatch = allQueueItems.find(existing => {
    // Exact text match
    if (existing.rawText.replace(/\s+/g, ' ').trim() === normalizedText) {
      return true
    }
    // Property signature match (city + street + rooms + house_number)
    const eDraft = existing.parsedDraft
    if (parsedDraft.city && eDraft.city && parsedDraft.street && eDraft.street) {
      const sameCity = parsedDraft.city.includes(eDraft.city) || eDraft.city.includes(parsedDraft.city)
      const sameStreet = parsedDraft.street.includes(eDraft.street) || eDraft.street.includes(parsedDraft.street)
      const sameHouse = !parsedDraft.house_number || !eDraft.house_number || parsedDraft.house_number === eDraft.house_number
      const sameRooms = !parsedDraft.rooms || !eDraft.rooms || parsedDraft.rooms === eDraft.rooms
      const sameFloor = parsedDraft.floor === undefined || eDraft.floor === undefined || parsedDraft.floor === eDraft.floor
      return sameCity && sameStreet && sameHouse && sameRooms && sameFloor
    }
    return false
  })

  if (existingMatch) {
    if (existingMatch.status === 'pending') {
      // Repost detected across groups! Consolidate into existing card instead of cluttering queue.
      const currentCount = existingMatch.repostCount || 1
      existingMatch.repostCount = currentCount + 1

      const groups = existingMatch.repostGroups || [existingMatch.groupTitle]
      if (!groups.includes(groupTitle)) {
        groups.push(groupTitle)
      }
      existingMatch.repostGroups = groups

      // Detect price update in repost
      if (parsedDraft.price && existingMatch.parsedDraft.price && parsedDraft.price !== existingMatch.parsedDraft.price) {
        const oldPrice = existingMatch.parsedDraft.price
        const newPrice = parsedDraft.price
        existingMatch.parsedDraft.price = newPrice
        existingMatch.rawText = `${existingMatch.rawText}\n\n[עדכון מחיר מקבוצת ${groupTitle}: ${oldPrice.toLocaleString()} ₪ ⬅️ ${newPrice.toLocaleString()} ₪]`
      }

      existingMatch.receivedAt = Date.now()
      await addIncomingListing(existingMatch)

      ackListingToBridge(existingMatch.id)
      ackListingToBridge(listingId)
      return existingMatch.id
    } else if (existingMatch.status === 'imported') {
      // Already imported previously, do not create duplicate card
      ackListingToBridge(listingId)
      return null
    }
  }

  // 4. Duplicate Detection against active properties in db.properties
  const allProperties = await db.properties.toArray()
  const duplicateProperty = await checkPropertyDuplicate(parsedDraft, allProperties)
  let duplicateOfPropertyId: string | undefined
  let duplicateOfPropertyAddress: string | undefined
  let existingPropertyPrice: number | undefined
  let priceDifference: number | undefined

  if (duplicateProperty) {
    duplicateOfPropertyId = duplicateProperty.id
    duplicateOfPropertyAddress = `${duplicateProperty.street} ${duplicateProperty.house_number || ''}, ${duplicateProperty.city}`.trim()
    existingPropertyPrice = duplicateProperty.price
    if (parsedDraft.price && duplicateProperty.price) {
      priceDifference = parsedDraft.price - duplicateProperty.price
    }
  }

  // 5. Persist qualified item to db.incoming_listings with status 'pending'
  const newListing: WhatsAppIncomingListing = {
    id: listingId,
    rawText,
    senderPhone: item.senderPhone?.trim() || undefined,
    senderName: item.senderName?.trim() || undefined,
    groupTitle,
    receivedAt: item.receivedAt || item.timestamp || Date.now(),
    status: 'pending',
    parsedDraft,
    duplicateOfPropertyId,
    duplicateOfPropertyAddress,
    repostCount: 1,
    repostGroups: [groupTitle],
    existingPropertyPrice,
    priceDifference
  }

  await addIncomingListing(newListing)
  console.log('[Realtor CRM Ingestion] ✅ Successfully ingested listing:', newListing.id, groupTitle)

  // 6. Push notification alerting the broker
  if (priceDifference !== undefined && priceDifference < 0) {
    const notifTitle = `ירידת מחיר זוהתה מקבוצת ${groupTitle}!`
    const notifBody = `${parsedDraft.street}, ${parsedDraft.city}: עודכן ל-${parsedDraft.price?.toLocaleString()} ₪ (במאגר: ${existingPropertyPrice?.toLocaleString()} ₪)`
    await sendPushNotification(notifTitle, notifBody, 'price_drop')
  } else {
    const notifTitle = `נכס חדש נקלט מקבוצת ${groupTitle}`
    const locationSummary = [parsedDraft.street, parsedDraft.city].filter(Boolean).join(', ')
    const priceSummary = parsedDraft.price ? `${parsedDraft.price.toLocaleString()} ₪` : ''
    const roomsSummary = parsedDraft.rooms ? `${parsedDraft.rooms} חד׳` : ''
    const details = [roomsSummary, locationSummary, priceSummary].filter(Boolean).join(' • ')
    const notifBody = details || 'הודעת נכס חדשה ממתינה לסקירה וייבוא במערכת'
    await sendPushNotification(notifTitle, notifBody, 'match')
  }

  // 7. Dispatch ACK event to notify the companion extension
  ackListingToBridge(newListing.id)

  return newListing.id
}

/**
 * Process a batch or single incoming payload object/array.
 */
export async function processIncomingWhatsAppPayload(payload: unknown): Promise<string[]> {
  console.log('[Realtor CRM Ingestion] 📥 Received payload from extension:', payload)
  if (!payload) return []

  let items: RawWhatsAppListingPayload[] = []

  if (Array.isArray(payload)) {
    items = payload
  } else if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (Array.isArray(obj.listings)) {
      items = obj.listings as RawWhatsAppListingPayload[]
    } else if (Array.isArray(obj.items)) {
      items = obj.items as RawWhatsAppListingPayload[]
    } else if (obj.rawText || obj.text || obj.message) {
      items = [obj as RawWhatsAppListingPayload]
    }
  }

  const processedIds: string[] = []
  for (const item of items) {
    try {
      const processedId = await processSingleIncomingListing(item)
      if (processedId) {
        processedIds.push(processedId)
      }
    } catch (err) {
      console.error('[Realtor CRM Ingestion] Error processing incoming WhatsApp listing:', err)
    }
  }

  return processedIds
}

/**
 * Custom React hook subscribing to WhatsApp Web Companion listings
 * via REALTOR_CRM_WHATSAPP_LISTINGS custom window events and window postMessage.
 */
export function useWhatsAppListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onListingsReceived = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        processIncomingWhatsAppPayload(customEvent.detail)
      }
    }

    const onMessageReceived = (event: MessageEvent) => {
      if (!event.data) return

      if (event.data.type === 'REALTOR_CRM_WHATSAPP_LISTINGS') {
        const payload =
          event.data.detail ??
          event.data.payload ??
          event.data.listings ??
          event.data.listing ??
          event.data.data
        if (payload) {
          processIncomingWhatsAppPayload(payload)
        }
      }
    }

    window.addEventListener('REALTOR_CRM_WHATSAPP_LISTINGS', onListingsReceived)
    window.addEventListener('message', onMessageReceived)

    // Initial flush triggers to fetch any existing queue
    requestWhatsAppListingsFlush()
    const t1 = setTimeout(requestWhatsAppListingsFlush, 600)
    const t2 = setTimeout(requestWhatsAppListingsFlush, 1800)
    const t3 = setTimeout(requestWhatsAppListingsFlush, 3500)

    // Heartbeat check every 4 seconds to pull any newly captured listings
    const interval = setInterval(requestWhatsAppListingsFlush, 4000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearInterval(interval)
      window.removeEventListener('REALTOR_CRM_WHATSAPP_LISTINGS', onListingsReceived)
      window.removeEventListener('message', onMessageReceived)
    }
  }, [])
}
