/**
 * Types for the Realtor CRM WhatsApp Web Companion extension.
 */

export interface WhatsAppMessagePayload {
  /** Unique ID of the message (from WhatsApp Web or generated hash) */
  id: string
  /** Cleaned message body */
  rawText: string
  /** Sender display name (if available) */
  senderName: string
  /** Sender phone number (if extracted from group author/data attribute) */
  senderPhone?: string
  /** Time of message from WhatsApp metadata or ISO string */
  timestamp: string
  /** WhatsApp group or chat title */
  groupTitle: string
  /** Real estate keywords detected in the message */
  matchedKeywords: string[]
  /** Timestamp when message was captured by the extension */
  receivedAt: string
  /** Source identifier */
  source: 'whatsapp'
}

export interface MonitoredGroup {
  id: string
  title: string
  addedAt: string
  enabled: boolean
}

export interface ExtensionStatus {
  whatsappConnected: boolean
  crmConnected: boolean
  pendingCount: number
  monitoredGroups: string[]
  pendingListings: WhatsAppMessagePayload[]
}

export type ExtensionMessage =
  | { type: 'NEW_WHATSAPP_MESSAGE'; payload: WhatsAppMessagePayload }
  | { type: 'CRM_PING' }
  | { type: 'FLUSH_REQUEST' }
  | { type: 'FLUSH_LISTINGS'; listings: WhatsAppMessagePayload[] }
  | { type: 'ACK_LISTINGS'; ids?: string[] }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'GET_STATUS' }
  | { type: 'TOGGLE_GROUP'; title: string }
  | { type: 'REMOVE_GROUP'; title: string }
  | { type: 'ADD_GROUP'; title: string }
