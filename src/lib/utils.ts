import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatILS(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  }
  return phone
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('9725') && digits.length === 12) {
    return '0' + digits.slice(3)
  }
  return digits
}

export function getDaysSince(dateStr?: string): number {
  if (!dateStr) return 0
  const target = new Date(dateStr).getTime()
  if (isNaN(target)) return 0
  const diff = Date.now() - target
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
