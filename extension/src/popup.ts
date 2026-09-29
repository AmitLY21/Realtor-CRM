/**
 * Realtor CRM - WhatsApp Web Companion
 * Action Popup Controller (TypeScript)
 *
 * Responsibilities:
 * 1. Display connection status for WhatsApp Web and Realtor CRM.
 * 2. Display and manage pending listings queue (count & clear).
 * 3. Render and manage monitored groups list (add, remove, toggle).
 * 4. Provide quick navigation links to WhatsApp Web and Realtor CRM.
 */

// DOM Elements
const waStatusDot = document.getElementById('wa-status-dot') as HTMLDivElement
const waStatusText = document.getElementById('wa-status-text') as HTMLDivElement
const crmStatusDot = document.getElementById('crm-status-dot') as HTMLDivElement
const crmStatusText = document.getElementById('crm-status-text') as HTMLDivElement

const queueCountEl = document.getElementById('queue-count') as HTMLDivElement
const btnClearQueue = document.getElementById('btn-clear-queue') as HTMLButtonElement

const groupsCountEl = document.getElementById('groups-count') as HTMLSpanElement
const addGroupForm = document.getElementById('add-group-form') as HTMLFormElement
const newGroupTitleInput = document.getElementById('new-group-title') as HTMLInputElement
const groupsListEl = document.getElementById('groups-list') as HTMLDivElement

const btnOpenWa = document.getElementById('btn-open-wa') as HTMLButtonElement
const btnOpenCrm = document.getElementById('btn-open-crm') as HTMLButtonElement

/**
 * Fetch monitored groups from chrome.storage.local
 */
async function getMonitoredGroups(): Promise<string[]> {
  try {
    const data = await chrome.storage.local.get('monitored_groups')
    const raw = data.monitored_groups
    if (Array.isArray(raw)) {
      return raw.map((item: any) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object' && item.title) return item.title.trim()
        return ''
      }).filter(Boolean)
    }
    return []
  } catch (err) {
    console.error('Failed to get monitored groups:', err)
    return []
  }
}

/**
 * Fetch pending listings from chrome.storage.local
 */
async function getPendingQueueLength(): Promise<number> {
  try {
    const data = await chrome.storage.local.get('pending_listings')
    return Array.isArray(data.pending_listings) ? data.pending_listings.length : 0
  } catch {
    return 0
  }
}

/**
 * Check if WhatsApp Web and CRM tabs are open
 */
async function checkTabs(): Promise<{ waOpen: boolean; crmOpen: boolean; crmTabUrl?: string }> {
  try {
    const [waTabs, crmTabs] = await Promise.all([
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }),
      chrome.tabs.query({
        url: [
          'http://localhost:*/*',
          'http://127.0.0.1:*/*',
          'https://*.github.io/*',
          'http://*.github.io/*'
        ]
      }),
    ])

    return {
      waOpen: waTabs.length > 0,
      crmOpen: crmTabs.length > 0,
      crmTabUrl: crmTabs[0]?.url,
    }
  } catch {
    return { waOpen: false, crmOpen: false }
  }
}

/**
 * Refresh full UI state
 */
async function refreshUI() {
  const [tabs, queueCount, groups] = await Promise.all([
    checkTabs(),
    getPendingQueueLength(),
    getMonitoredGroups(),
  ])

  // 1. WhatsApp status
  if (tabs.waOpen) {
    waStatusDot.classList.add('active')
    waStatusText.textContent = 'מחובר'
    waStatusText.style.color = '#059669'
  } else {
    waStatusDot.classList.remove('active')
    waStatusText.textContent = 'לא פתוח'
    waStatusText.style.color = '#64748b'
  }

  // 2. CRM status
  if (tabs.crmOpen) {
    crmStatusDot.classList.add('active')
    crmStatusText.textContent = 'מחובר'
    crmStatusText.style.color = '#059669'
  } else {
    crmStatusDot.classList.remove('active')
    crmStatusText.textContent = 'לא פתוח'
    crmStatusText.style.color = '#64748b'
  }

  // 3. Queue count
  queueCountEl.textContent = String(queueCount)
  btnClearQueue.disabled = queueCount === 0

  // 4. Groups list
  groupsCountEl.textContent = String(groups.length)
  renderGroupsList(groups)
}

/**
 * Render the list of monitored groups
 */
function renderGroupsList(groups: string[]) {
  groupsListEl.innerHTML = ''

  if (groups.length === 0) {
    groupsListEl.innerHTML = `
      <div class="empty-state">
        אין קבוצות מנוטרות כרגע.<br />
        פתח שיחה בוואטסאפ ולחץ על כפתור <b>"סנכרן ל-CRM"</b>, או הוסף שם ידנית למעלה.
      </div>
    `
    return
  }

  groups.forEach((groupTitle) => {
    const item = document.createElement('div')
    item.className = 'group-item'

    const titleSpan = document.createElement('span')
    titleSpan.className = 'group-name'
    titleSpan.textContent = groupTitle
    titleSpan.title = groupTitle

    const actions = document.createElement('div')
    actions.className = 'group-actions'

    const removeBtn = document.createElement('button')
    removeBtn.className = 'btn-remove-group'
    removeBtn.type = 'button'
    removeBtn.innerHTML = '✕'
    removeBtn.title = `הסר את "${groupTitle}" מהניטור`
    removeBtn.addEventListener('click', async () => {
      await removeGroup(groupTitle)
    })

    actions.appendChild(removeBtn)
    item.appendChild(titleSpan)
    item.appendChild(actions)
    groupsListEl.appendChild(item)
  })
}

/**
 * Add a new group title to storage
 */
async function addGroup(title: string) {
  const clean = title.trim()
  if (!clean) return

  const groups = await getMonitoredGroups()
  const exists = groups.some((g) => g.toLowerCase() === clean.toLowerCase())
  if (!exists) {
    groups.push(clean)
    await chrome.storage.local.set({ monitored_groups: groups })
    await refreshUI()
  }
}

/**
 * Remove a group title from storage
 */
async function removeGroup(title: string) {
  const clean = title.trim().toLowerCase()
  const groups = await getMonitoredGroups()
  const filtered = groups.filter((g) => g.trim().toLowerCase() !== clean)
  await chrome.storage.local.set({ monitored_groups: filtered })
  await refreshUI()
}

/**
 * Clear the pending listings buffer
 */
async function clearQueue() {
  if (!confirm('האם אתה בטוח שברצונך לרוקן את כל המודעות הממתינות בתור?')) {
    return
  }

  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_QUEUE' })
    await chrome.storage.local.set({ pending_listings: [] })
    await chrome.action.setBadgeText({ text: '' })
  } catch {
    await chrome.storage.local.set({ pending_listings: [] })
  }
  await refreshUI()
}

/**
 * Focus or open a URL in Chrome
 */
async function focusOrOpen(urlMatchPattern: string, targetUrl: string) {
  try {
    const tabs = await chrome.tabs.query({ url: urlMatchPattern })
    if (tabs.length > 0 && tabs[0].id !== undefined) {
      await chrome.tabs.update(tabs[0].id, { active: true })
      if (tabs[0].windowId !== undefined) {
        await chrome.windows.update(tabs[0].windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: targetUrl })
    }
  } catch {
    chrome.tabs.create({ url: targetUrl })
  }
}

// Event Listeners
addGroupForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const val = newGroupTitleInput.value
  if (val.trim()) {
    await addGroup(val)
    newGroupTitleInput.value = ''
  }
})

btnClearQueue.addEventListener('click', clearQueue)

btnOpenWa.addEventListener('click', () => {
  focusOrOpen('https://web.whatsapp.com/*', 'https://web.whatsapp.com')
})

btnOpenCrm.addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({
      url: ['http://localhost:*/*', 'http://127.0.0.1:*/*', 'https://*.github.io/*', 'http://*.github.io/*'],
    })
    if (tabs.length > 0 && tabs[0].id) {
      await chrome.tabs.update(tabs[0].id, { active: true })
      if (tabs[0].windowId !== undefined) {
        await chrome.windows.update(tabs[0].windowId, { focused: true })
      }
    } else {
      await chrome.tabs.create({ url: 'https://amitly21.github.io/Realtor-CRM/' })
    }
  } catch {
    chrome.tabs.create({ url: 'https://amitly21.github.io/Realtor-CRM/' })
  }
})

// Listen for storage changes in real-time while popup is open
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.pending_listings || changes.monitored_groups) {
      refreshUI()
    }
  }
})

// Initial load
refreshUI()
