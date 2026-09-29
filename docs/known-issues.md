# Known Issues Log

Maintained by /al-debug. Checked before a fresh investigation; appended
after resolving one (or escalating one to an architecture question).

## WhatsApp companion extension messages not syncing to CRM on GitHub Pages and reload button inactive
- **Date:** 2026-09-29
- **Symptom:** WhatsApp companion captures messages, but they fail to sync to CRM on GitHub Pages (working only on localhost), and the "רענן מהתוסף" button has no effect on GitHub URL.
- **Root cause:**
  1. The browser's installed extension was cached with the old manifest that only matched localhost/127.0.0.1, meaning `crm-bridge.js` was never injected into `https://*.github.io/*`, leaving the flush button with no listener and the background worker unable to locate CRM tabs on GitHub Pages.
  2. In `extension/src/background.ts:23`, `const MAX_QUEUE_SIZE = 200` was missing after adding URL patterns, triggering `ReferenceError: MAX_QUEUE_SIZE is not defined` whenever `savePendingListings()` ran (during message reception, queue ACK clearing, and manual queue clearing).
  3. The extension ZIP link in `IncomingListingsDrawer.tsx` and `SettingsView.tsx` used root path `/realtor-crm-whatsapp-companion.zip` instead of `${import.meta.env.BASE_URL}realtor-crm-whatsapp-companion.zip`, returning 404 on GitHub Pages.
- **Fix:**
  - Added `const MAX_QUEUE_SIZE = 200` to `extension/src/background.ts:23`.
  - Added `http://*.github.io/*` and `https://*.github.io/*` across `extension/manifest.json`, `extension/src/background.ts`, and `extension/src/popup.ts`.
  - Added debounced ACK forwarding in `extension/src/crm-bridge.ts` and in-flight deduplication in `src/lib/whatsappListener.ts`.
  - Fixed extension zip download links in `src/components/IncomingListingsDrawer.tsx:148` and `src/components/SettingsView.tsx:524` to prepend `import.meta.env.BASE_URL`.
  - Rebuilt and repacked `public/realtor-crm-whatsapp-companion.zip`.
- **Tags:** environment | config | logic | race-condition
- **Status:** resolved
