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
      <nav className="hidden md:block w-full border-b border-slate-200 bg-white px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold transition-colors relative border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`size- ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 pb-safe shadow-xs">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors relative ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className="size-" />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center min-size- px-1 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
