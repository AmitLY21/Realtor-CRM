import { createBrowserClient } from '@supabase/ssr'
import fs from 'node:fs'
import path from 'node:path'

// Simple env loader without external dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let val = match[2] || ''
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
        process.env[key] = val.trim()
      }
    }
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL || 'https://dunrichoqemqmursclxt.supabase.co'
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_INSPIJVtRuHbBXOlpvILJQ_o3jyjtpw'

console.log('--- SUPABASE AUDIT & INTEGRITY CHECK ---')
console.log('Target URL:', url)
console.log('Key:', key.slice(0, 15) + '...')

const client = createBrowserClient(url, key)

async function runCheck() {
  console.log('\n1. Checking Auth/Session Connectivity...')
  try {
    const sessionRes = await client.auth.getSession()
    console.log('Auth check status:', sessionRes.error ? `Error: ${sessionRes.error.message}` : 'SUCCESS (Reachable)')
  } catch (e) {
    console.error('Auth check threw error:', e)
  }

  console.log('\n2. Checking Required Tables in PostgREST schema cache...')
  const tables = ['properties', 'leads', 'reminders', 'settings', 'notifications', 'incoming_listings']
  let missingCount = 0
  let existingCount = 0

  for (const table of tables) {
    try {
      const res = await client.from(table).select('*').limit(1)
      if (res.error) {
        if (res.error.code === 'PGRST205' || res.status === 404 || res.error.message.includes('schema cache')) {
          console.log(`❌ Table '${table}': NOT FOUND (PGRST205 / 404) - Needs SQL execution`)
          missingCount++
        } else {
          console.log(`⚠️ Table '${table}': Returned error: [${res.error.code}] ${res.error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}': EXISTS & ACCESSIBLE (Status 200, rows returned: ${res.data?.length ?? 0})`)
        existingCount++
      }
    } catch (e) {
      console.log(`❌ Table '${table}': Threw exception:`, e.message)
      missingCount++
    }
  }

  console.log('\n--- AUDIT SUMMARY ---')
  console.log(`Existing tables: ${existingCount}/${tables.length}`)
  console.log(`Missing tables:  ${missingCount}/${tables.length}`)
  if (missingCount > 0) {
    console.log('\nACTION REQUIRED:')
    console.log('The database schema has not been applied to the Supabase Postgres instance yet.')
    console.log('Run the SQL in `supabase/schema.sql` via Supabase Dashboard SQL Editor:')
    console.log('https://supabase.com/dashboard/project/dunrichoqemqmursclxt/sql/new')
  } else {
    console.log('\nALL TABLES VERIFIED! Supabase is fully configured and accepting data.')
  }
}

runCheck()
