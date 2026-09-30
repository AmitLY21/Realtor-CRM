# Authentication and Team Data Isolation — Implementation Plan

## Source
`docs/specs/auth-team-isolation/spec.md`

## Approach
Implement Supabase Auth alongside team-scoped multi-tenancy using `@supabase/supabase-js`. A dedicated `auth.ts` module manages authentication lifecycle, session persistence, and agency resolution (`agency_members` lookup). An accessible `AuthModal.tsx` provides email/password sign-in, agency registration, and invite-code redemption. In `Header.tsx`, an agent session pill displays the logged-in agent, their agency name, and sign-out controls. In `src/lib/supabaseSync.ts`, remote fetch and push operations tag all records with `agency_id`, pausing sync when signed out and hydrating upon sign-in. To guarantee data isolation on shared hardware, signing out clears tenant-specific IndexedDB tables. Once sessions are active, a final SQL migration locks RLS to strictly authenticated agency members.

## Steps
1. **Auth & Agency Service Layer** — files: `src/lib/auth.ts`, `src/types/index.ts`.
   - Implement `signIn`, `signUp`, `signOut`, `getCurrentUserAgency`, `joinAgencyWithInviteCode`, and `subscribeAuth`.
   - Add `Agency`, `AgencyMember`, and `AuthSession` interfaces to `src/types/index.ts`.
   - Verify: Unit import check and TypeScript build (`npx tsc --noEmit`).

2. **Auth UI & Team Modal Component** — files: `src/components/AuthModal.tsx`, `src/components/Header.tsx`.
   - Build `AuthModal.tsx` with tabs for Sign In, Create Agency, and Join Team via Invite Code.
   - Update `Header.tsx` to display the active agent/agency indicator, invite code copy button, and Sign In / Sign Out button.
   - Verify: Component render inspection and manual/automated visual check.

3. **Multi-Tenant Sync Engine Scoping** — files: `src/lib/supabaseSync.ts`, `src/App.tsx`.
   - Update `pushRecord` to attach `agency_id` to all inserted rows.
   - Update `pullAllFromSupabase` to filter records by `eq('agency_id', currentAgencyId)`.
   - Pause sync when unauthenticated; trigger immediate pull upon successful login.
   - On sign-out, purge local Dexie records so subsequent agents on shared browsers don't see prior tenant data.
   - Verify: `npm run lint` and `npm test`.

4. **Team Settings & Invite Code Management** — files: `src/components/SettingsView.tsx`.
   - Add a "צוות וסוכנות" (Team & Agency) section in Settings showing Agency Name, License, Teammates list, and the shareable Invite Code.
   - Verify: Navigate to Settings tab and verify team details and copy-invite action.

5. **Lock Down Database RLS Migration** — files: `supabase/migrations/20261001_lockdown_agency_rls.sql`.
   - Remove transition `anon` write policies and enforce strict `auth.uid()` agency membership on all CRUD operations.
   - Retain public read-only access exclusively for active properties with public marketing slugs.
   - Verify: Direct SQL inspection and curl tests verifying 401/403 for unauthorized requests.

## Risks
- **Shared Device Cache Leakage:** If an agent signs out and another logs in on the same browser, local Dexie data could linger if not wiped on logout. Handled in Step 3 by clearing tables on session termination.
- **Offline Startup Handling:** When offline, Supabase session checks might delay startup. Handled by checking cached session tokens synchronously from localStorage before remote verification.
