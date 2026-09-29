# WhatsApp Web Extension Companion (Phase 1) — Implementation Plan

## Source
Settled architectural plan from `al-reprompt` investigation and `al-polish` interview.

## Approach
Build a zero-ban-risk, client-side ingestion bridge consisting of a Manifest V3 Chrome Extension paired with an ingestion listener and staging drawer inside the Realtor-CRM PWA. The extension injects into `web.whatsapp.com`, allows 1-click group monitoring via an injected header toggle (and popup management), observes incoming messages in monitored groups, buffers them in `chrome.storage.local` when the CRM is closed, and transmits them to Realtor-CRM via Chrome runtime messaging / `window.postMessage`. The CRM feeds incoming payloads into `parseRawListingText()` (`src/lib/parser.ts`), runs duplicate checks against existing listings, and stages them in an "Incoming WhatsApp Queue" for 1-click review in `SmartPasteModal.tsx`.

## Settled Decisions
- **Ingestion Workflow**: Staging Queue (Option A) — No blind database inserts; incoming announcements are queued in an inbox drawer for broker review.
- **Offline Buffering**: Buffer in `chrome.storage.local` (Option A) — Guarantees no missed listings when WhatsApp Web is active but the CRM tab is closed. Flushes automatically upon CRM load.
- **Group Monitoring UI**: Injected Header Toggle + Popup (Option A) — 1-click "Sync to CRM" button injected directly into WhatsApp Web's active chat header, with full toggle list in the extension popup.
- **Duplicate Strategy**: Flag as Duplicate in Queue (Option B) — Checks matching street/rooms/price against active properties and existing queue items, flagging potential duplicates for price drop review rather than silently dropping them.

## Steps
1. **Extension Manifest & Build Configuration** — files: `extension/manifest.json`, `extension/vite.config.ts`, `extension/package.json`. Setup Manifest V3 with permissions (`storage`, `tabs`, host permissions for `https://web.whatsapp.com/*` and `http://localhost:*`). Configure TypeScript build or Vite build for content scripts and popup. Verify: Load unpacked extension in Chrome developer mode; verify zero manifest or lifecycle errors.
2. **WhatsApp Web Injected Header Toggle & Group Observer** — files: `extension/src/whatsapp-observer.ts`, `extension/src/popup.html`, `extension/src/popup.ts`.
   - Observe WhatsApp Web DOM to detect the active chat title and type (group vs individual).
   - Inject a sleek "Sync to CRM" toggle badge into WhatsApp Web's top conversation header bar.
   - Maintain monitored group IDs in `chrome.storage.local`.
   - Observe incoming message nodes in active chats using `MutationObserver`, extracting text, timestamp, sender phone/name, and group title.
   - Verify: Toggle monitoring on a test group; post a message; verify console logs extracted payload.
3. **Storage Buffering & CRM Bridge Transport** — files: `extension/src/background.ts`, `extension/src/crm-bridge.ts`.
   - When a message arrives from a monitored group, buffer it into `chrome.storage.local.get('pending_listings')`.
   - Content script `crm-bridge.ts` running on the CRM domain communicates with `background.ts` via `chrome.runtime.sendMessage({ type: 'FLUSH_PENDING_LISTINGS' })`.
   - Dispatches trusted `CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS', { detail: listings })` to `window`.
   - Clears flushed items from extension storage once CRM acknowledges receipt.
   - Verify: Send messages with CRM tab closed; open CRM tab; assert all buffered messages arrive in a single batch event.
4. **Dexie Staging Queue Schema & Duplicate Indexing** — files: `src/types/index.ts`, `src/lib/db.ts`.
   - Add `WhatsAppIncomingListing` interface (id, rawText, senderPhone, senderName, groupTitle, timestamp, status: 'pending' | 'imported' | 'dismissed', parsedDraft, duplicateOfPropertyId?: string).
   - Add `incoming_listings` table to Dexie schema versioning with indexes: `id, status, timestamp, groupTitle, [status+timestamp]`.
   - Add helper methods `getPendingIncomingListings()`, `dismissIncomingListing(id)`, `markIncomingListingImported(id)`.
   - Verify: Run Dexie tests or scratch script verifying table creation, query performance, and indexing.
5. **CRM Ingestion Hook & Confidence Gating** — files: `src/lib/whatsappListener.ts`, `src/App.tsx`.
   - React hook `useWhatsAppListener()` listening for `REALTOR_CRM_WHATSAPP_LISTINGS` window events.
   - Runs `parseRawListingText(rawText)` on each message.
   - Filters out non-property noise (confidence score < 35 or lacking critical property markers).
   - Runs `checkPropertyDuplicate()` against current properties in Dexie; sets `duplicateOfPropertyId` if matched.
   - Stores qualified announcements into `incoming_listings` and calls `sendPushNotification()` alerting the broker.
   - Verify: Unit test passing mock WhatsApp messages (chatter vs real estate listings); verify only real estate announcements are saved and notifications fired.
6. **Incoming Listings Review Drawer & SmartPasteModal Handoff** — files: `src/components/IncomingListingsDrawer.tsx`, `src/components/Header.tsx`, `src/components/SmartPasteModal.tsx`.
   - Add a badged WhatsApp Inbox icon in `Header.tsx` showing the count of `pending` listings.
   - Clicking opens `IncomingListingsDrawer.tsx` displaying cards with: group title, sender, parsed summary (city, street, rooms, price), confidence badge, and duplicate badge if detected.
   - "Review & Import" button opens `SmartPasteModal` pre-populated with the parsed draft and raw text.
   - Upon successful save in `SmartPasteModal`, update the incoming listing status to `'imported'`.
   - Provide a "Dismiss" button to discard false positives or uninteresting listings.
   - Verify: End-to-end integration test via Playwright verifying the drawer renders, opens `SmartPasteModal`, and marks items as imported.

## Risks & Mitigations
- **WhatsApp Web DOM Fragility**: WhatsApp updates periodically change obfuscated class names.
  *Mitigation*: Target semantic attributes (`header[data-testid="conversation-header"]`, `div[role="row"]`, `span[dir="auto"]`) and XPath/tree navigation rather than dynamic CSS module classes.
- **Message Deduplication across Groups**: The same listing shared in 3 different groups within 5 minutes.
  *Mitigation*: Check exact raw text hash and parsed property match within `incoming_listings` to group or flag identical announcements.
