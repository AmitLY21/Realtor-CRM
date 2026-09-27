import React from 'react'
import { LayoutDashboard, Building2, Users2, Sparkles, Settings } from 'lucide-react'

export type TabType = 'dashboard' | 'properties' | 'leads' | 'matches' | 'settings'

interface NavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  matchesCount: number
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  matchesCount
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'לוח בקרה', icon: LayoutDashboard },
    { id: 'properties' as TabType, label: 'נכסים', icon: Building2 },
    { id: 'leads' as TabType, label: 'לקוחות ומשפך', icon: Users2 },
    { 
      id: 'matches' as TabType, 
      label: 'התאמות', 
      icon: Sparkles, 
      badge: matchesCount > 0 ? matchesCount : null 
    },
    { id: 'settings' as TabType, label: 'הגדרות', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Sub-Header Navigation */}
      <nav className="hidden md:block w-full border-b border-white/5 bg-slate-900/60 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-emerald-400" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
