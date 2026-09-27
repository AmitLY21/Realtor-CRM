import React from 'react'
import { InAppNotification } from '../lib/notifications'
import { 
  X, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCheck, 
  Smartphone,
  CheckCircle2
} from 'lucide-react'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  notifications: InAppNotification[]
  onMarkAllAsRead: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead
}) => {
  if (!isOpen) return null

  const handleRequestPush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        alert('התראות פוש הופעלו בהצלחה!')
      }
    } else {
      alert('דפדפן זה אינו תומך בהתראות פוש מקוריות.')
    }
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full bg-white border-r border-slate-200 shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">מרכז התראות</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded-md text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="סמן הכל כנקרא"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS PWA A2HS Banner */}
        {isIOS && (
          <div className="m-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>התקנה ב-iPhone לקבלת פוש:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              באייפון, לחץ על כפתור <strong>שיתוף</strong> בתחתית הדפדפן ובחר <strong>״הוסף למסך הבית״</strong> להפעלת התראות פוש וגישה אופליין.
            </p>
          </div>
        )}

        {/* Web Push Permission Button */}
        <div className="px-3 pt-2">
          <button
            onClick={handleRequestPush}
            className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>הפעל התראות פוש במכשיר זה</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p>אין התראות חדשות כרגע</p>
            </div>
          ) : (
            notifications.map(notif => {
              let Icon = Bell
              let color = 'bg-slate-100 text-slate-700'
              if (notif.type === 'match') {
                Icon = Sparkles
                color = 'bg-blue-50 text-blue-700 border border-blue-200'
              } else if (notif.type === 'exclusivity') {
                Icon = AlertTriangle
                color = 'bg-amber-50 text-amber-800 border border-amber-200'
              } else if (notif.type === 'showing') {
                Icon = Clock
                color = 'bg-slate-100 text-slate-800 border border-slate-200'
              } else if (notif.type === 'price_drop') {
                Icon = TrendingDown
                color = 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }

              const timeAgo = new Date(notif.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

              return (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    notif.read ? 'bg-white border-slate-200/60 opacity-60' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                        <span className="text-[10px] text-slate-400">{timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.body}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
