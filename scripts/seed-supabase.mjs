import { createBrowserClient } from '@supabase/ssr'
import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        let val = match[2] || ''
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
        process.env[match[1]] = val.trim()
      }
    }
  }
}
loadEnv()

const client = createBrowserClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY)

async function seed() {
  console.log('--- SEEDING INITIAL DATA TO SUPABASE ---')

  const now = new Date()
  const exclusivityDate1 = new Date()
  exclusivityDate1.setDate(now.getDate() + 9)
  const exclusivityDate2 = new Date()
  exclusivityDate2.setDate(now.getDate() + 45)

  const properties = [
    {
      id: 'prop-1',
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: true,
      exclusive_until: exclusivityDate1.toISOString().split('T')[0],
      property_type: 'apartment',
      city: 'תל אביב-יפו',
      neighborhood: 'לב העיר',
      street: 'בוגרשוב',
      house_number: '34',
      apartment_number: '6',
      rooms: 3.5,
      floor: 3,
      total_floors: 5,
      sqm: 88,
      price: 4350000,
      price_history: [
        { price: 4500000, changed_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), note: 'מחיר פתיחה' },
        { price: 4350000, changed_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), note: 'ירידת מחיר - בעלים גמיש!' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: true,
      parking_type: 'single',
      parking_legal: 'tabu',
      public_slug: 'bograshov-3-5',
      hide_exact_address: true,
      notes: `*דירה חדשה למכירה בבלעדיות בלב תל אביב!*
ברחוב בוגרשוב 34, לב העיר המבוקש.
3.5 חדרים מרווחת ומוארת במיוחד, כ-88 מ"ר, קומה 3 מתוך 5 עם מעלית!
מרפסת שמש מפנקת היוצאת ישירות מחלל הסלון.
ממ"ד תקני בדירה, חניה בטאבו ומחסן פרטי צמוד.
משופצת אדריכלית מהיסוד, פינוי גמיש.
מחיר שיווק מעודכן: 4,350,000 ש"ח.
בעל הנכס: אבי 050-1112233 (מפתח במשרד, שת״פ פתוח 50/50).`,
      photos: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-2',
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: false,
      property_type: 'penthouse',
      city: 'תל אביב-יפו',
      neighborhood: 'הצפון הישן',
      street: 'דיזנגוף',
      house_number: '180',
      apartment_number: '12',
      rooms: 4,
      floor: 5,
      total_floors: 5,
      sqm: 125,
      price: 6800000,
      price_history: [
        { price: 6800000, changed_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), note: 'מחיר פתיחה' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: true,
      parking_type: 'double',
      parking_legal: 'tabu',
      public_slug: 'dizengoff-penthouse-4',
      hide_exact_address: false,
      notes: `*פנטהאוז יוקרתי ומרהיב בצפון הישן!*
דיזנגוף 180, במיקום הכי חם בעיר.
4 חדרים מעוצבת ברמה הגבוהה ביותר, 125 מ"ר בנוי + מרפסת שמש ענקית לנוף פתוח.
קומה 5 ואחרונה עם מעלית, ממ"ד תקני, 2 חניות צמודות בטאבו ומחסן פרטי.
מטבח שף איכותי, יחידת הורים מפנקת, מוארת ושקטה במיוחד.
מחיר מבוקש: 6,800,000 ש"ח.
סוכן שת״פ: אלון מרימקס 052-4445555. מתואם לסיורים מראש.`,
      photos: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-3',
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'rent',
      is_exclusive: true,
      exclusive_until: exclusivityDate2.toISOString().split('T')[0],
      property_type: 'apartment',
      city: 'רמת גן',
      neighborhood: 'מרכז העיר',
      street: 'ביאליק',
      house_number: '55',
      apartment_number: '4',
      rooms: 3,
      floor: 2,
      total_floors: 4,
      sqm: 75,
      price: 6400,
      maintenance_fee: 250,
      price_history: [
        { price: 6400, changed_at: new Date().toISOString(), note: 'מחיר פתיחה' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: false,
      parking_type: 'single',
      parking_legal: 'tabu',
      public_slug: 'bialik-rg-3',
      hide_exact_address: true,
      notes: `*להשכרה בבלעדיות במרכז רמת גן!*
רחוב ביאליק 55, מרכז העיר התוסס, סמוך לכל מוקדי העניין והתחבורה.
3 חדרים משופצת כחדשה, כ-75 מ"ר, קומה 2 עם מעלית וממ"ד.
מרפסת שמש חזיתית, כיווני אוויר מעולים, פינוי מיידי.
חניה מקורה רשומה בטאבו.
דמי שכירות: 6,400 ש"ח לחודש (ועד בית: 250 ש"ח). דמי תיווך: חודש שכירות + מע״מ.`,
      photos: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      id: 'prop-4',
      created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      transaction_type: 'sale',
      is_exclusive: false,
      property_type: 'apartment',
      city: 'תל אביב-יפו',
      neighborhood: 'פלורנטין',
      street: 'הרצל',
      house_number: '82',
      apartment_number: '9',
      rooms: 2.5,
      floor: 2,
      total_floors: 6,
      sqm: 60,
      price: 2950000,
      price_history: [
        { price: 3100000, changed_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), note: 'מחיר פתיחה' },
        { price: 2950000, changed_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), note: 'הורדת מחיר לרציניים' }
      ],
      has_mamad: true,
      has_elevator: true,
      has_balcony: true,
      has_storage: false,
      parking_type: 'none',
      parking_legal: 'street_only',
      public_slug: 'herzl-florentin-2-5',
      hide_exact_address: false,
      notes: `*הזדמנות נדירה למשקיעים - פלורנטין המתחדשת!*
רחוב הרצל 82, פלורנטין, תל אביב-יפו.
2.5 חדרים מוארת ומעוצבת, 60 מ"ר, קומה 2 מתוך 6 בבניין חדיש עם מעלית.
מרפסת שמש מפנקת וממ"ד תקני בדירה.
מושכרת כרגע ב-6,800 ש"ח לחודש עם שוכרים מעולים ומוסדרים - תשואה מצוינת!
מחיר מבוקש: 2,950,000 ש"ח.`,
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
      ]
    }
  ]

  const leads = [
    {
      id: 'lead-1',
      created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'יוסי ומיכל כהן',
      phone: '052-3344556',
      id_number: '034981245',
      transaction_type: 'sale',
      source: 'whatsapp',
      stage: 'discovery',
      max_budget: 4500000,
      target_cities: ['תל אביב-יפו'],
      target_neighborhoods: ['לב העיר', 'הצפון הישן'],
      min_rooms: 3.5,
      preferred_floors: [2, 3, 4],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: false,
      require_parking: true,
      allowed_parking_types: ['single', 'double'],
      commission_agreed: '2% + מע״מ',
      next_followup: new Date(Date.now() + 3600000 * 4).toISOString(),
      notes: 'מחפשים דירה מוארת, הילד מתחיל בית ספר בשנה הבאה. אישרו תקציב ומשכנתא בבנק לאומי.'
    },
    {
      id: 'lead-2',
      created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'דניאל שפירא',
      phone: '050-7788990',
      id_number: '012398471',
      transaction_type: 'sale',
      source: 'yad2',
      stage: 'viewings',
      max_budget: 7200000,
      target_cities: ['תל אביב-יפו'],
      target_neighborhoods: ['הצפון הישן'],
      min_rooms: 4,
      preferred_floors: [4, 5],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: true,
      require_parking: true,
      allowed_parking_types: ['double'],
      commission_agreed: '2% + מע״מ',
      next_followup: new Date(Date.now() + 3600000 * 24).toISOString(),
      notes: 'מחפש פנטהאוז יוקרתי, גמיש במחיר אם הגימור ברמה גבוהה. תואם סיור בדיזנגוף 180.'
    },
    {
      id: 'lead-3',
      created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'שירן אלקובי',
      phone: '054-9988776',
      id_number: '312049823',
      transaction_type: 'rent',
      source: 'phone_call',
      stage: 'negotiation',
      max_budget: 6800,
      target_cities: ['רמת גן'],
      target_neighborhoods: ['מרכז העיר'],
      min_rooms: 3,
      preferred_floors: [1, 2, 3],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: false,
      require_parking: true,
      allowed_parking_types: ['single'],
      commission_agreed: 'חודש + מע״מ',
      next_followup: new Date(Date.now() + 3600000 * 2).toISOString(),
      notes: 'מעוניינת לסגור מיידית על ביאליק 55. ממתינה לטיוטת חוזה שכירות והסכם תיווך חתום.'
    },
    {
      id: 'lead-4',
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      updated_at: new Date().toISOString(),
      full_name: 'אלעד רוזנטל',
      phone: '052-1122334',
      transaction_type: 'sale',
      source: 'referral',
      stage: 'new_lead',
      max_budget: 3100000,
      target_cities: ['תל אביב-יפו'],
      target_neighborhoods: ['פלורנטין', 'נווה צדק'],
      min_rooms: 2,
      preferred_floors: [1, 2, 3],
      require_mamad: true,
      require_elevator: true,
      require_balcony: true,
      require_storage: false,
      require_parking: false,
      allowed_parking_types: ['none', 'single'],
      commission_agreed: '2% + מע״מ',
      notes: 'משקיע עם הון עצמי נזיל, מחפש דירה מושכרת עם תשואה טובה בתל אביב. הרצל 82 מתאימה בול.'
    }
  ]

  const reminders = [
    {
      id: 'rem-1',
      lead_id: 'lead-2',
      property_id: 'prop-2',
      reminder_type: 'showing_meeting',
      scheduled_time: new Date(Date.now() + 3600000 * 5).toISOString(),
      alert_offset_min: 60,
      heskem_status: 'draft',
      is_completed: false,
      notes: 'סיור פנטהאוז בדיזנגוף 180 עם דניאל שפירא. יש להחתים על הסכם תיווך במעמד הסיור!',
      created_at: new Date().toISOString()
    },
    {
      id: 'rem-2',
      lead_id: 'lead-1',
      property_id: 'prop-1',
      reminder_type: 'followup_call',
      scheduled_time: new Date(Date.now() + 3600000 * 2).toISOString(),
      alert_offset_min: 30,
      heskem_status: 'signed',
      is_completed: false,
      notes: 'שיחת מעקב עם יוסי כהן לאחר ירידת המחיר בבוגרשוב 34 (ירד ל-4.35M).',
      created_at: new Date().toISOString()
    },
    {
      id: 'rem-3',
      lead_id: 'lead-3',
      property_id: 'prop-3',
      reminder_type: 'heskem_tivuch',
      scheduled_time: new Date(Date.now() + 3600000 * 26).toISOString(),
      alert_offset_min: 120,
      heskem_status: 'sent_for_signature',
      is_completed: false,
      notes: 'בדיקת חתימה דיגיטלית של שירן אלקובי על הסכם תיווך לשכירות בביאליק 55.',
      created_at: new Date().toISOString()
    }
  ]

  const settings = [
    {
      key: 'agent_profile',
      value: {
        name: 'רועי ברקוביץ׳',
        phone: '054-8889999',
        email: 'roy.realtor@tlv-prime.co.il',
        license_number: '12489-01',
        agency_name: 'פריים נדל״ן תל אביב והמרכז'
      }
    }
  ]

  console.log('Upserting properties...')
  const { error: pErr } = await client.from('properties').upsert(properties)
  if (pErr) console.error('properties error:', pErr)
  else console.log(`✅ Upserted ${properties.length} properties`)

  console.log('Upserting leads...')
  const { error: lErr } = await client.from('leads').upsert(leads)
  if (lErr) console.error('leads error:', lErr)
  else console.log(`✅ Upserted ${leads.length} leads`)

  console.log('Upserting reminders...')
  const { error: rErr } = await client.from('reminders').upsert(reminders)
  if (rErr) console.error('reminders error:', rErr)
  else console.log(`✅ Upserted ${reminders.length} reminders`)

  console.log('Upserting settings...')
  const { error: sErr } = await client.from('settings').upsert(settings)
  if (sErr) console.error('settings error:', sErr)
  else console.log(`✅ Upserted ${settings.length} settings`)

  console.log('\n--- VERIFYING ROW COUNTS IN SUPABASE ---')
  for (const table of ['properties', 'leads', 'reminders', 'settings', 'notifications', 'incoming_listings']) {
    const { count } = await client.from(table).select('*', { count: 'exact', head: true })
    console.log(`Table '${table}': ${count} rows`)
  }
}

seed()
