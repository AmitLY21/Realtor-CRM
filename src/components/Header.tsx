import React, { useState, useEffect } from 'react'
import { Bell, Search, Plus, Wifi, WifiOff, Building2, ClipboardList, UserPlus } from 'lucide-react'

interface HeaderProps {
  onOpenSearch: () => void
  onOpenSmartPaste: () => void
  onOpenNewLead: () => void
  onOpenNotifications: () => void
  unreadCount: number
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSmartPaste,
  onOpenNewLead,
  onOpenNotifications,
  unreadCount
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size- rounded-lg bg-blue-600 text-white shadow-xs">
            <Building2 className="size-" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              Realtor<span className="text-blue-600">CRM</span>
            </h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              PWA
            </span>
          </div>
        </div>

        {/* Sync Status & Action Bar */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline 
              ? 'bg-slate-50 border-slate-200 text-slate-600' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isOnline ? <Wifi className="size- text-blue-600" /> : <WifiOff className="size- text-amber-600" />}
            <span>{isOnline ? 'מחובר ומסונכרן' : 'מצב לא מקוון'}</span>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors text-xs"
            title="חיפוש מהיר (Ctrl+K)"
          >
            <Search className="size- text-slate-400" />
            <span className="hidden sm:inline">חיפוש נכס או לקוח...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white text-slate-500 rounded border border-slate-200">⌘K</kbd>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors"
            title="מרכז התראות"
          >
            <Bell className="size-" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-size- px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Add Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors active:scale-98"
            >
              <Plus className="size-" />
              <span>הוספה</span>
            </button>

            {showAddMenu && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-52 rounded-xl bg-white border border-slate-200 p-1 shadow-lg z-50 animate-in fade-in duration-100"
                onClick={() => setShowAddMenu(false)}
              >
                <button
                  onClick={onOpenSmartPaste}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-800 hover:bg-slate-50 transition-colors text-right"
                >
                  <span className="size- rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="size-" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">הדבקה מהירה (וואטסאפ)</p>
                    <p className="text-[10px] text-slate-500">חילוץ אוטומטי של נכס</p>
                  </div>
                </button>
                <button
                  onClick={onOpenNewLead}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-800 hover:bg-slate-50 transition-colors text-right"
                >
                  <span className="size- rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <UserPlus className="size-" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">לקוח / ליד חדש</p>
                    <p className="text-[10px] text-slate-500">הגדרת תקציב ודרישות</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
