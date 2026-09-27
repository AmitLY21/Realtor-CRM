import React, { useState, useEffect } from 'react'
import { Bell, Search, Plus, Wifi, WifiOff, Sparkles } from 'lucide-react'
import { InAppNotification, getNotifications } from '../lib/notifications'

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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-600 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Realtor<span className="text-emerald-400">CRM</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">מערכת חכמה למתווכי נדל״ן</p>
          </div>
        </div>

        {/* Sync Status & Action Bar */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'מחובר ומסונכרן (0ms)' : 'מצב לא מקוון'}</span>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs"
            title="חיפוש מהיר (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">חיפוש נכס או לקוח...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">⌘K</kbd>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="מרכז התראות"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md shadow-rose-500/30 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Add Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>הוספה</span>
            </button>

            {showAddMenu && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-52 rounded-2xl bg-slate-900 border border-white/15 p-1.5 shadow-2xl shadow-black z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowAddMenu(false)}
              >
                <button
                  onClick={onOpenSmartPaste}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors text-right"
                >
                  <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">📋</span>
                  <div>
                    <p className="font-semibold">הדבקה מהירה (וואטסאפ)</p>
                    <p className="text-[10px] text-slate-400">חילוץ אוטומטי של נכס</p>
                  </div>
                </button>
                <button
                  onClick={onOpenNewLead}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-right"
                >
                  <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">👤</span>
                  <div>
                    <p className="font-semibold">לקוח / ליד חדש</p>
                    <p className="text-[10px] text-slate-400">הגדרת תקציב ודרישות</p>
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
