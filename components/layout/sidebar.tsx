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
  Settings
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
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
          C
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight">Sales CRM</span>
          <span className="text-[10px] text-muted-foreground">Workspace</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Navigation
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

      {/* Bottom User / Role Card */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs px-1">
          <span className="text-muted-foreground">Role:</span>
          <span className="font-semibold text-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
            {role || 'Admin'}
          </span>
        </div>
      </div>
    </aside>
  )
}
