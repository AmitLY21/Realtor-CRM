import React from 'react'
import { InAppNotification, saveNotifications } from '../lib/notifications'
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
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full bg-slate-900 border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">מרכז התראות</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              title="סמן הכל כנקרא"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS PWA A2HS Banner */}
        {isIOS && (
          <div className="m-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>התקנה ב-iPhone לקבלת פוש:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              באייפון, לחץ על כפתור <strong>שיתוף</strong> בתחתית הדפדפן ובחר <strong>״הוסף למסך הבית״</strong> להפעלת התראות פוש וגישה אופליין.
            </p>
          </div>
        )}

        {/* Web Push Permission Button */}
        <div className="px-3 pt-2">
          <button
            onClick={handleRequestPush}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>הפעל התראות פוש במכשיר זה</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>אין התראות חדשות כרגע</p>
            </div>
          ) : (
            notifications.map(notif => {
              let Icon = Bell
              let color = 'bg-slate-800 text-slate-300'
              if (notif.type === 'match') {
                Icon = Sparkles
                color = 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              } else if (notif.type === 'exclusivity') {
                Icon = AlertTriangle
                color = 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              } else if (notif.type === 'showing') {
                Icon = Clock
                color = 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              } else if (notif.type === 'price_drop') {
                Icon = TrendingDown
                color = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }

              const timeAgo = new Date(notif.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

              return (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    notif.read ? 'bg-slate-900/60 border-white/5 opacity-70' : 'bg-slate-850 border-white/15 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                        <span className="text-[10px] text-slate-500">{timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.body}</p>
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
