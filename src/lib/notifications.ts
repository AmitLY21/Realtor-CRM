/**
 * Notification Service & Audio Chimes
 * Provides Web Push integration, In-App Notification Center, and synthesized sound chimes.
 */

export interface InAppNotification {
  id: string
  title: string
  body: string
  type: 'match' | 'exclusivity' | 'showing' | 'price_drop' | 'system'
  timestamp: string
  read: boolean
  actionUrl?: string
}

// Global In-Memory Notification Store with LocalStorage backup
const STORAGE_KEY = 'realtor_in_app_notifications'

export function getNotifications(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveNotifications(notifs: InAppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50))) // Keep latest 50
}

/**
 * Web Audio API synthesizer for clean, subtle notification chimes
 * Zero external audio dependencies needed!
 */
export function playNotificationChime(type: 'success' | 'alert' | 'match' = 'match') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'match' || type === 'success') {
      // Pleasant double chime: E5 (659Hz) -> A5 (880Hz)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      osc.start(now)
      osc.stop(now + 0.4)
    } else {
      // Warning chime: A4 (440Hz) -> F4 (349Hz)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.1)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc.start(now)
      osc.stop(now + 0.5)
    }
  } catch (e) {
    console.warn('Audio chime skipped:', e)
  }
}

/**
 * Push Notification Dispatcher (Browser Notification API)
 */
export async function sendPushNotification(title: string, body: string, type: InAppNotification['type'] = 'match') {
  // 1. Play subtle audio chime
  playNotificationChime(type === 'showing' ? 'alert' : 'match')

  // 2. Save to In-App Notification Center
  const current = getNotifications()
  const newNotif: InAppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    body,
    type,
    timestamp: new Date().toISOString(),
    read: false
  }
  saveNotifications([newNotif, ...current])

  // 3. Dispatch system notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            body,
            icon: '/icons/192x192.png',
            badge: '/icons/96x96.png',
            dir: 'rtl',
            lang: 'he'
          })
          return
        }
      }
      new Notification(title, {
        body,
        icon: '/icons/192x192.png',
        dir: 'rtl',
        lang: 'he'
      })
    } catch (e) {
      console.warn('System push notification failed:', e)
    }
  }
}
