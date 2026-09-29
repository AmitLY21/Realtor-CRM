# WhatsApp Group Listener & Real Estate CRM Ingestion Bridge

## 1. System Architecture Overview

The system automates the ingestion of real estate announcements from WhatsApp groups into the Realtor CRM application without manual copy-paste, zero WhatsApp ban risk, and zero cloud server hosting costs.

The architecture consists of two tightly coupled components:
1. **WhatsApp Web Companion (Manifest V3 Chrome Extension)**: Runs locally on the broker's desktop browser. Injects into `web.whatsapp.com`, detects conversation headers, provides an in-header "סנכרן ל-CRM" toggle, observes incoming messages in monitored groups via `MutationObserver`, extracts property listing data, buffers listings in `chrome.storage.local`, and dispatches them to Realtor CRM via a cross-tab messaging bridge.
2. **Realtor CRM Ingestion Engine & Review Drawer**: Runs in the client-side React 19 / Dexie PWA. Listens for custom window events, parses messages through `parseRawListingText()`, filters out non-property noise/chatter, detects duplicates against active properties, queues incoming announcements in Dexie `incoming_listings` (version 3), alerts the broker with live badges in `Header.tsx`, and provides a 1-click review flow in `IncomingListingsDrawer.tsx` connecting directly to `SmartPasteModal.tsx`.

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Chrome Browser                    │
│                                                             │
│  ┌──────────────────────────┐    ┌───────────────────────┐  │
│  │     web.whatsapp.com     │    │  Realtor CRM (PWA)    │  │
│  │                          │    │  http://localhost:5174│  │
│  │  [Sync to CRM Toggle]    │    │                       │  │
│  │           │              │    │  [Header Badge: (3)]  │  │
│  │           ▼              │    │           │           │  │
│  │  whatsapp-observer.js    │    │           ▼           │  │
│  └───────────┬──────────────┘    │  IncomingListings     │  │
│              │ (runtime.msg)     │  Drawer               │  │
│              ▼                   │           │           │  │
│  ┌──────────────────────────┐    │           ▼           │  │
│  │   background.js (MV3)    │    │  SmartPasteModal      │  │
│  │  - chrome.storage.local  │    │  (1-Click Save)       │  │
│  │  - Offline FIFO Buffer   │    │           │           │  │
│  └───────────┬──────────────┘    │           ▼           │  │
│              │ (tabs.msg)        │  Dexie DB (v3)        │  │
│              ▼                   │  properties catalog   │  │
│  ┌──────────────────────────┐    │                       │  │
│  │      crm-bridge.js       │───►│  useWhatsAppListener  │  │
│  │ (dispatches DOM events)  │    │  & parser.ts          │  │
│  └──────────────────────────┘    └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Chrome Extension Companion Details (`extension/`)

### File Manifest
- `extension/manifest.json`: Manifest V3 spec declaring `storage` and `tabs` permissions, host permissions for WhatsApp Web and local CRM origins, background service worker, content scripts, and popup.
- `extension/src/whatsapp-observer.ts`: Injected into `web.whatsapp.com`.
  - Injects a "סנכרן ל-CRM" toggle button into the WhatsApp Web conversation header.
  - Monitors incoming messages (`div[role="row"]`, `.message-in`), extracting text, sender phone, timestamp, and group title.
  - Pre-filters using Israeli real estate terms (`למכירה`, `להשכרה`, `חדרים`, `שיווק`, `מבוקש`, `קומה`, `מ"ר`, `דירה`, `פנטהאוז`, `בוגרשוב`, `טאבו`).
- `extension/src/background.ts`: Service worker managing the FIFO buffer (`pending_listings`, max 200 items), toolbar badges, and routing messages to CRM tabs.
- `extension/src/crm-bridge.ts`: Injected into CRM tabs; sends `CRM_PING`, receives `FLUSH_LISTINGS`, and fires `CustomEvent('REALTOR_CRM_WHATSAPP_LISTINGS')`.
- `extension/src/popup.html` & `extension/src/popup.ts`: RTL Hebrew popup displaying connection status, monitored groups management, queue count, and "Clear Queue" button.
- `extension/vite.config.ts` & `extension/build.ts`: Multi-target bundler producing self-contained IIFE bundles in `extension/dist/`.

---

## 3. Realtor CRM Ingestion Engine Details (`src/`)

### File Manifest
- `src/types/index.ts`: Added `WhatsAppIncomingListing` interface and modal state types (`initialDraft`, `incomingListingId`).
- `src/lib/db.ts`: Upgraded Dexie to `version(3)` with `incoming_listings: 'id, status, receivedAt, groupTitle, duplicateOfPropertyId'`. Added helper functions `getPendingIncomingListings()`, `addIncomingListing()`, `dismissIncomingListing()`, `markIncomingListingImported()`, `deleteIncomingListing()`, and overloaded `checkPropertyDuplicate()`.
- `src/lib/whatsappListener.ts`: Custom hook `useWhatsAppListener()` listening for `REALTOR_CRM_WHATSAPP_LISTINGS`, running `parseRawListingText()`, rejecting chatter, detecting duplicates against active inventory, firing in-app push notifications, and dispatching acknowledgments.
- `src/components/IncomingListingsDrawer.tsx`: RTL slide-over drawer with 4-way filter (`pending`, `imported`, `dismissed`, `all`), confidence badges, duplicate warning alert, expandable raw text, and actions ("ייבא לנכסים", "התעלם", "מחק").
- `src/components/Header.tsx`: Added WhatsApp icon button with reactive live badge counter via `useLiveQuery`.
- `src/components/SmartPasteModal.tsx`: Accepts `initialDraft` and `incomingListingId`; marks listing as `imported` upon saving into active inventory.
- `src/App.tsx`: Top-level mounting of `useWhatsAppListener()` and `IncomingListingsDrawer`.

---

## 4. Verification & Testing

1. **TypeScript & Bundling**:
   - `extension`: Strict TypeScript check passed (`tsc --noEmit`), bundled into `extension/dist/` in 43ms.
   - `crm`: Strict TypeScript check passed (`tsc -b && vite build`) in 472ms.
2. **Linting**:
   - `oxlint`: 0 errors across 51 files.
3. **Playwright E2E Test Suite**:
   - `tests/whatsapp-companion.spec.ts`: 2/2 tests passed (drawer toggle, message ingestion, chatter filtering, duplicate alert, SmartPaste import).
   - `tests/e2e.spec.ts`: 14/14 tests passed.
   - `tests/parser.spec.ts`: 8/8 tests passed.
   - Total: 24/24 tests passed cleanly.

---

## 5. How to Load and Use

1. Open Chrome / Edge and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"** and select the folder `/Users/Amit.Levy/VibeCodingProjects/Realtor-CRM/extension`.
4. Open WhatsApp Web (`https://web.whatsapp.com/`). Open any real estate broker group.
5. Click the green **"סנכרן ל-CRM"** button in the top chat header to begin monitoring.
6. Open Realtor CRM (`http://localhost:5174/` or production domain). Incoming property announcements will appear with a notification badge in the header WhatsApp icon. Click to review and import into your inventory with 1 click.
