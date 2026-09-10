"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  PhoneCall,
  CheckSquare,
  ShieldCheck,
  Settings,
  Sparkles,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permission'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, entity: null },
  { name: 'Contacts & Leads', href: '/contacts', icon: Users, entity: 'contacts' },
  { name: 'Companies', href: '/companies', icon: Building2, entity: 'companies' },
  { name: 'Deals & Pipeline', href: '/deals', icon: KanbanSquare, entity: 'deals' },
  { name: 'Calls & Dialer', href: '/calls', icon: PhoneCall, entity: 'calls' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, entity: 'tasks' },
  { name: 'Roles & Permissions', href: '/roles', icon: ShieldCheck, entity: 'roles' },
  { name: 'Settings', href: '/settings', icon: Settings, entity: 'settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { can, role } = usePermissions()

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight">Apex CRM</span>
          <span className="text-[10px] text-muted-foreground">Realtime Sales Hub</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Core Platform
        </div>
        {navigation.map((item) => {
          if (item.entity && !can(item.entity as any, 'view')) {
            return null
          }

          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile App & Realtime Sync Indicator */}
      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate">Flutter App Sync</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-muted-foreground">Postgres Realtime</span>
            </div>
          </div>
        </div>

        {/* Current Active Role */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>Active Role:</span>
          <span className="font-semibold text-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
            {role}
          </span>
        </div>
      </div>
    </aside>
  )
}
