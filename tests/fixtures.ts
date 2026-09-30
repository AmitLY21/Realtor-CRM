import { Page } from '@playwright/test'

export async function seedTestFixtures(page: Page) {
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('RealtorCRM_DB')
      req.onerror = () => reject(req.error)
      req.onsuccess = (e: any) => {
        const idb = e.target.result
        const tx = idb.transaction(['properties', 'leads', 'reminders'], 'readwrite')
        const propStore = tx.objectStore('properties')
        const leadStore = tx.objectStore('leads')
        const remStore = tx.objectStore('reminders')

        const now = new Date()
        const exclusivityDate1 = new Date()
        exclusivityDate1.setDate(now.getDate() + 9)

        // Seed test property with expiring exclusivity
        propStore.put({
          id: 'prop-test-1',
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
            { price: 4350000, changed_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), note: 'ירידת מחיר' }
          ],
          has_mamad: true,
          has_elevator: true,
          has_balcony: true,
          has_storage: true,
          parking_type: 'single',
          parking_legal: 'tabu',
          public_slug: 'bograshov-3-5',
          hide_exact_address: true,
          notes: 'דירה חדשה למכירה בבלעדיות בלב תל אביב! בוגרשוב 34',
          photos: []
        })

        // Seed test leads
        leadStore.put({
          id: 'lead-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          full_name: 'יוסי ומיכל כהן',
          phone: '052-3344556',
          id_number: '034981245',
          transaction_type: 'sale',
          source: 'whatsapp',
          stage: 'discovery',
          max_budget: 4500000,
          target_cities: ['תל אביב-יפו'],
          target_neighborhoods: ['לב העיר'],
          min_rooms: 3.5,
          preferred_floors: [2, 3, 4],
          require_mamad: true,
          require_elevator: true,
          require_balcony: true,
          require_storage: false,
          require_parking: true,
          allowed_parking_types: ['single', 'double'],
          commission_agreed: '2% + מע״מ',
          notes: 'מחפשים דירה מוארת'
        })

        leadStore.put({
          id: 'lead-test-2',
          created_at: new Date().toISOString(),
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
          allowed_parking_types: ['single', 'double'],
          commission_agreed: '2% + מע״מ',
          notes: 'הייטקיסט, מחפש פנטהאוז'
        })

        // Seed test reminder
        const showingTime = new Date()
        showingTime.setHours(showingTime.getHours() + 1)
        remStore.put({
          id: 'rem-test-1',
          lead_id: 'lead-test-1',
          property_id: 'prop-test-1',
          reminder_type: 'showing_meeting',
          scheduled_time: showingTime.toISOString(),
          alert_offset_min: 60,
          heskem_status: 'draft',
          is_completed: false,
          notes: 'סיור בבוגרשוב 34',
          created_at: new Date().toISOString()
        })

        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      }
    })
  })
}
