"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Phone, LogOut, User, ShieldCheck } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from './theme-toggle'
import { toast } from 'sonner'

interface HeaderProps {
  onOpenDialer?: () => void
}

export function Header({ onOpenDialer }: HeaderProps) {
  const router = useRouter()
  const { user, profile, supabase } = useSupabase()
  const { role, isSuperAdmin } = usePermissions()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    }
    toast.info('Signed out')
    router.push('/auth/login')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/contacts?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Alex Morgan'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative w-72 md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts, deals, companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-muted/40 text-xs rounded-lg"
        />
      </form>

      {/* Right Action Items */}
      <div className="flex items-center gap-2.5">
        {/* Click to Call Launcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDialer}
          className="h-9 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dialer</span>
        </Button>

        {/* Theme Mode Toggle */}
        <ThemeToggle />

        {/* Notifications Icon */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-lg">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* User Profile Avatar & Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-1 pr-2 rounded-lg">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                  {initials || 'AM'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left hidden md:block">
                <span className="text-xs font-medium line-clamp-1">{displayName}</span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {role || 'Agent'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email || user?.email || 'user@company.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem onClick={() => router.push('/roles')}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Roles & Access</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
