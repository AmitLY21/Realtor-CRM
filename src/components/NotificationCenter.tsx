import React from 'react'
import { InAppNotification } from '../lib/notifications'
import { 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  CheckCheck, 
  Smartphone,
  CheckCircle2
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  notifications: InAppNotification[]
  onMarkAllAsRead: () => void
}

const IS_IOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead
}) => {
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="left" className="w-full max-w-sm p-0 flex flex-col" onClose={onClose}>
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <SheetTitle>מרכז התראות</SheetTitle>
          </div>
          <div className="flex items-center gap-1 pl-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMarkAllAsRead}
              className="size-7"
              title="סמן הכל כנקרא"
            >
              <CheckCheck className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* iOS PWA A2HS Banner */}
        {IS_IOS && (
          <div className="m-3 p-3 rounded-xl bg-muted/50 border border-border text-xs text-foreground flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Smartphone className="size-4 text-primary" />
              <span>התקנה ב-iPhone לקבלת פוש:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              באייפון, לחץ על כפתור <strong>שיתוף</strong> בתחתית הדפדפן ובחר <strong>״הוסף למסך הבית״</strong> להפעלת התראות פוש וגישה אופליין.
            </p>
          </div>
        )}

        {/* Web Push Permission Button */}
        <div className="px-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPush}
            className="w-full gap-2 text-xs"
          >
            <Bell className="size-3.5 text-primary" />
            <span>הפעל התראות פוש במכשיר זה</span>
          </Button>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto flex flex-col gap-2 flex-1">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
              <CheckCircle2 className="size-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p>אין התראות חדשות כרגע</p>
            </div>
          ) : (
            notifications.map(notif => {
              let Icon = Bell
              let color = 'bg-muted text-muted-foreground'
              if (notif.type === 'match') {
                Icon = Sparkles
                color = 'bg-primary/10 text-primary border border-primary/20'
              } else if (notif.type === 'exclusivity') {
                Icon = AlertTriangle
                color = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              } else if (notif.type === 'showing') {
                Icon = Clock
                color = 'bg-muted text-foreground border border-border'
              } else if (notif.type === 'price_drop') {
                Icon = TrendingDown
                color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
              }

              const timeAgo = new Date(notif.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

              return (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    notif.read ? 'bg-card border-border/60 opacity-60' : 'bg-card border-border shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-foreground truncate">{notif.title}</p>
                        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
