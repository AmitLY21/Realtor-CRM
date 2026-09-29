import { supabase } from './supabase/client'
import { db } from './db'
import type { 
  Property, 
  Lead, 
  Reminder, 
  InAppNotification, 
  WhatsAppIncomingListing 
} from '../types'

export type SyncStatus = 'idle' | 'checking' | 'ready' | 'missing_tables' | 'syncing' | 'error'

export interface SyncState {
  status: SyncStatus
  message: string
  missingTables: string[]
  lastSyncedAt: string | null
}

let syncState: SyncState = {
  status: 'idle',
  message: 'טרם נבדק',
  missingTables: [],
  lastSyncedAt: null
}

const listeners = new Set<(state: SyncState) => void>()

function updateState(newState: Partial<SyncState>) {
  syncState = { ...syncState, ...newState }
  listeners.forEach((listener) => listener(syncState))
}

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  listeners.add(listener)
  listener(syncState)
  return () => {
    listeners.delete(listener)
  }
}

export function getSyncState(): SyncState {
  return syncState
}

// Flag to avoid infinite loops when writing remote data into Dexie
let isSyncingFromRemote = false

export const REQUIRED_TABLES = [
  'properties',
  'leads',
  'reminders',
  'settings',
  'notifications',
  'incoming_listings'
] as const

export type TableName = typeof REQUIRED_TABLES[number]

// Data mappers between Dexie and Postgres
function mapNotificationToDb(n: InAppNotification) {
  const { actionUrl, ...rest } = n
  return {
    ...rest,
    action_url: actionUrl ?? null
  }
}

function mapNotificationFromDb(row: any): InAppNotification {
  const { action_url, ...rest } = row
  return {
    ...rest,
    actionUrl: action_url ?? undefined
  }
}

function mapIncomingListingToDb(item: WhatsAppIncomingListing) {
  return {
    id: item.id,
    raw_text: item.rawText,
    sender_phone: item.senderPhone ?? null,
    sender_name: item.senderName ?? null,
    group_title: item.groupTitle,
    received_at: item.receivedAt,
    status: item.status,
    parsed_draft: item.parsedDraft,
    duplicate_of_property_id: item.duplicateOfPropertyId ?? null,
    duplicate_of_property_address: item.duplicateOfPropertyAddress ?? null
  }
}

function mapIncomingListingFromDb(row: any): WhatsAppIncomingListing {
  return {
    id: row.id,
    rawText: row.raw_text,
    senderPhone: row.sender_phone ?? undefined,
    senderName: row.sender_name ?? undefined,
    groupTitle: row.group_title,
    receivedAt: Number(row.received_at),
    status: row.status,
    parsedDraft: row.parsed_draft,
    duplicateOfPropertyId: row.duplicate_of_property_id ?? undefined,
    duplicateOfPropertyAddress: row.duplicate_of_property_address ?? undefined
  }
}

// Check which tables are created in Supabase
export async function checkSupabaseTables(): Promise<{ ok: boolean; missing: string[] }> {
  updateState({ status: 'checking', message: 'בודק זמינות טבלאות ב-Supabase...' })
  const missing: string[] = []

  for (const table of REQUIRED_TABLES) {
    try {
      const res = await supabase.from(table).select('id').limit(1)
      if (res.error && (res.error.code === 'PGRST205' || res.status === 404 || res.error.message.includes('schema cache'))) {
        missing.push(table)
      }
    } catch {
      missing.push(table)
    }
  }

  if (missing.length > 0) {
    updateState({
      status: 'missing_tables',
      missingTables: missing,
      message: `נמצאו ${missing.length} טבלאות שטרם נוצרו ב-Supabase.`
    })
    return { ok: false, missing }
  }

  updateState({
    status: 'ready',
    missingTables: [],
    message: 'כל הטבלאות קיימות ב-Supabase ומסונכרנות.'
  })
  return { ok: true, missing: [] }
}

// Push a single record to Supabase
async function pushRecord(table: TableName, record: any) {
  if (isSyncingFromRemote || syncState.status === 'missing_tables') return

  try {
    let payload: any = record
    if (table === 'notifications') {
      payload = mapNotificationToDb(record)
    } else if (table === 'incoming_listings') {
      payload = mapIncomingListingToDb(record)
    }

    const { error } = await supabase.from(table).upsert(payload)
    if (error) {
      if (error.code === 'PGRST205') {
        updateState({ status: 'missing_tables', missingTables: [table] })
      }
      console.warn(`[SupabaseSync] Push failed for ${table}:`, error.message)
    }
  } catch (err) {
    console.warn(`[SupabaseSync] Error pushing to ${table}:`, err)
  }
}

// Delete a single record from Supabase
async function deleteRecord(table: TableName, key: string) {
  if (isSyncingFromRemote || syncState.status === 'missing_tables') return

  try {
    const keyField = table === 'settings' ? 'key' : 'id'
    const { error } = await supabase.from(table).delete().eq(keyField, key)
    if (error) {
      console.warn(`[SupabaseSync] Delete failed for ${table}:`, error.message)
    }
  } catch (err) {
    console.warn(`[SupabaseSync] Error deleting from ${table}:`, err)
  }
}

// Push all local Dexie data to Supabase
export async function pushAllToSupabase(): Promise<{ success: boolean; message: string }> {
  updateState({ status: 'syncing', message: 'מעלה נתונים מקומיים לענן...' })

  try {
    const { ok, missing } = await checkSupabaseTables()
    if (!ok) {
      return {
        success: false,
        message: `לא ניתן לסנכרן: הטבלאות [${missing.join(', ')}] טרם נוצרו ב-Supabase.`
      }
    }

    const properties = await db.properties.toArray()
    if (properties.length > 0) {
      const { error } = await supabase.from('properties').upsert(properties)
      if (error) throw error
    }

    const leads = await db.leads.toArray()
    if (leads.length > 0) {
      const { error } = await supabase.from('leads').upsert(leads)
      if (error) throw error
    }

    const reminders = await db.reminders.toArray()
    if (reminders.length > 0) {
      const { error } = await supabase.from('reminders').upsert(reminders)
      if (error) throw error
    }

    const settings = await db.settings.toArray()
    if (settings.length > 0) {
      const { error } = await supabase.from('settings').upsert(settings)
      if (error) throw error
    }

    const notifs = await db.notifications.toArray()
    if (notifs.length > 0) {
      const { error } = await supabase.from('notifications').upsert(notifs.map(mapNotificationToDb))
      if (error) throw error
    }

    const listings = await db.incoming_listings.toArray()
    if (listings.length > 0) {
      const { error } = await supabase.from('incoming_listings').upsert(listings.map(mapIncomingListingToDb))
      if (error) throw error
    }

    const now = new Date().toISOString()
    updateState({
      status: 'ready',
      message: 'הנתונים המקומיים עלו לענן בהצלחה!',
      lastSyncedAt: now
    })

    return { success: true, message: 'כל הנתונים המקומיים עלו לענן בהצלחה!' }
  } catch (err: any) {
    updateState({ status: 'error', message: err.message || 'שגיאה בסנכרון' })
    return { success: false, message: err.message || 'שגיאה בסנכרון לענן' }
  }
}

// Pull all data from Supabase into local Dexie
export async function pullAllFromSupabase(): Promise<{ success: boolean; message: string }> {
  updateState({ status: 'syncing', message: 'מוריד נתונים מהענן למאגר המקומי...' })

  try {
    const { ok, missing } = await checkSupabaseTables()
    if (!ok) {
      return {
        success: false,
        message: `הטבלאות [${missing.join(', ')}] אינן קיימות ב-Supabase.`
      }
    }

    isSyncingFromRemote = true

    // Properties
    const { data: props, error: propsErr } = await supabase.from('properties').select('*')
    if (propsErr) throw propsErr
    if (props && props.length > 0) {
      await db.properties.bulkPut(props as Property[])
    }

    // Leads
    const { data: leads, error: leadsErr } = await supabase.from('leads').select('*')
    if (leadsErr) throw leadsErr
    if (leads && leads.length > 0) {
      await db.leads.bulkPut(leads as Lead[])
    }

    // Reminders
    const { data: rems, error: remsErr } = await supabase.from('reminders').select('*')
    if (remsErr) throw remsErr
    if (rems && rems.length > 0) {
      await db.reminders.bulkPut(rems as Reminder[])
    }

    // Settings
    const { data: sets, error: setsErr } = await supabase.from('settings').select('*')
    if (setsErr) throw setsErr
    if (sets && sets.length > 0) {
      await db.settings.bulkPut(sets as { key: string; value: any }[])
    }

    // Notifications
    const { data: notifs, error: notifsErr } = await supabase.from('notifications').select('*')
    if (notifsErr) throw notifsErr
    if (notifs && notifs.length > 0) {
      await db.notifications.bulkPut(notifs.map(mapNotificationFromDb))
    }

    // Incoming listings
    const { data: list, error: listErr } = await supabase.from('incoming_listings').select('*')
    if (listErr) throw listErr
    if (list && list.length > 0) {
      await db.incoming_listings.bulkPut(list.map(mapIncomingListingFromDb))
    }

    const now = new Date().toISOString()
    updateState({
      status: 'ready',
      message: 'הנתונים נמשכו בהצלחה מהענן!',
      lastSyncedAt: now
    })

    return { success: true, message: 'הנתונים עודכנו בהצלחה מהענן!' }
  } catch (err: any) {
    updateState({ status: 'error', message: err.message || 'שגיאה במשיכת נתונים' })
    return { success: false, message: err.message || 'שגיאה במשיכת נתונים' }
  } finally {
    isSyncingFromRemote = false
  }
}

// Hook into Dexie tables so every local write automatically triggers a Supabase push
let isHooksInitialized = false

export function setupDexieSupabaseHooks() {
  if (isHooksInitialized) return
  isHooksInitialized = true

  const attachHooks = (tableName: TableName, dexieTable: any) => {
    dexieTable.hook('creating', function (this: any, _primKey: any, obj: any) {
      this.onsuccess = () => {
        pushRecord(tableName, obj)
      }
    })

    dexieTable.hook('updating', function (this: any, _mods: any, primKey: any, obj: any) {
      this.onsuccess = (updatedObj: any) => {
        pushRecord(tableName, updatedObj ?? obj)
      }
    })

    dexieTable.hook('deleting', function (this: any, primKey: any) {
      this.onsuccess = () => {
        deleteRecord(tableName, String(primKey))
      }
    })
  }

  attachHooks('properties', db.properties)
  attachHooks('leads', db.leads)
  attachHooks('reminders', db.reminders)
  attachHooks('settings', db.settings)
  attachHooks('notifications', db.notifications)
  attachHooks('incoming_listings', db.incoming_listings)
}

// Realtime subscriptions
let realtimeChannel: any = null

export function setupSupabaseRealtime() {
  if (realtimeChannel) return

  realtimeChannel = supabase
    .channel('realtor_crm_realtime')
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      if (isSyncingFromRemote) return

      const table = payload.table as TableName
      const eventType = payload.eventType

      isSyncingFromRemote = true
      try {
        if (eventType === 'DELETE') {
          const id = payload.old?.id || payload.old?.key
          if (id) {
            if (table === 'properties') await db.properties.delete(id)
            else if (table === 'leads') await db.leads.delete(id)
            else if (table === 'reminders') await db.reminders.delete(id)
            else if (table === 'settings') await db.settings.delete(id)
            else if (table === 'notifications') await db.notifications.delete(id)
            else if (table === 'incoming_listings') await db.incoming_listings.delete(id)
          }
        } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const row = payload.new
          if (row) {
            if (table === 'properties') await db.properties.put(row as Property)
            else if (table === 'leads') await db.leads.put(row as Lead)
            else if (table === 'reminders') await db.reminders.put(row as Reminder)
            else if (table === 'settings') await db.settings.put(row as { key: string; value: any })
            else if (table === 'notifications') await db.notifications.put(mapNotificationFromDb(row))
            else if (table === 'incoming_listings') await db.incoming_listings.put(mapIncomingListingFromDb(row))
          }
        }
      } catch (err) {
        console.warn(`[SupabaseSync] Realtime apply error for ${table}:`, err)
      } finally {
        isSyncingFromRemote = false
      }
    })
    .subscribe()
}

// Master init function to start sync engine
export async function initSupabaseSync() {
  setupDexieSupabaseHooks()
  const { ok } = await checkSupabaseTables()
  if (ok) {
    setupSupabaseRealtime()
  }
}
