import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { 
  Bell, 
  Search, 
  Plus, 
  Wifi, 
  WifiOff, 
  Building2, 
  ClipboardList, 
  UserPlus, 
  MessageCircle, 
  UserCircle2, 
  LogIn, 
  LogOut, 
  Copy, 
  Check 
} from 'lucide-react'
import { subscribeAuthState, signOut, getAuthState } from '../lib/auth'
import type { AuthState } from '../types'

interface HeaderProps {
  onOpenSearch: () => void
  onOpenSmartPaste: () => void
  onOpenNewLead: () => void
  onOpenNotifications: () => void
  onOpenWhatsAppDrawer: () => void
  onOpenAuth: () => void
  unreadCount: number
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSmartPaste,
  onOpenNewLead,
  onOpenNotifications,
  onOpenWhatsAppDrawer,
  onOpenAuth,
  unreadCount
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [auth, setAuth] = useState<AuthState>(getAuthState())

  useEffect(() => {
    return subscribeAuthState(setAuth)
  }, [])

  // Live count of pending WhatsApp listings
  const pendingWhatsAppCount = useLiveQuery(
    () => db.incoming_listings.where('status').equals('pending').count(),
    [],
    0
  )


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

          {/* WhatsApp Ingestion Inbox Button */}
          <button
            onClick={onOpenWhatsAppDrawer}
            className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
              pendingWhatsAppCount > 0
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title={`קליטת וואטסאפ (${pendingWhatsAppCount} ממתינים לסקירה)`}
          >
            <MessageCircle className="size-4 text-emerald-600" />
            {pendingWhatsAppCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold animate-pulse">
                {pendingWhatsAppCount > 9 ? '9+' : pendingWhatsAppCount}
              </span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors"
            title="מרכז התראות"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold">
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

          {/* User Auth & Team Status */}
          <div className="relative">
            {auth.isAuthenticated ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  title="פרופיל צוות ומשתמש"
                >
                  <UserCircle2 className="size-4 text-blue-600" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {auth.agency?.name || 'צוות נדל״ן'}
                  </span>
                </button>

                {showUserMenu && (
                  <div 
                    className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 p-2 shadow-xl z-50 text-right animate-in fade-in duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="font-semibold text-xs text-slate-900 truncate">
                        {auth.user?.user_metadata?.full_name || auth.user?.email}
                      </p>
                      <p className="text-[11px] text-blue-600 font-medium truncate">
                        {auth.agency?.name || 'צוות פריים'} ({auth.member?.role === 'owner' ? 'מנהל' : 'סוכן'})
                      </p>
                    </div>

                    {auth.agency?.invite_code && (
                      <div className="p-2 bg-slate-50 rounded-lg mb-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>קוד הזמנה לצוות:</span>
                          <span className="font-mono font-bold text-slate-800 tracking-wider">
                            {auth.agency.invite_code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (auth.agency?.invite_code) {
                              navigator.clipboard.writeText(auth.agency.invite_code)
                              setCopiedCode(true)
                              setTimeout(() => setCopiedCode(false), 2000)
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors"
                        >
                          {copiedCode ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 text-slate-400" />}
                          <span>{copiedCode ? 'הועתק ללוח!' : 'העתק קוד לצירוף שותף'}</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="size-3.5" />
                      <span>התנתקות</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                title="התחברות או הצטרפות לצוות"
              >
                <LogIn className="size-3.5 text-blue-600" />
                <span className="hidden sm:inline">התחבר לצוות</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
