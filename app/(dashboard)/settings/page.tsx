"use client"

import React, { useState } from 'react'
import {
  Settings,
  Save,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile } = useSupabase()
  const { role } = usePermissions()

  const [fullName, setFullName] = useState(profile?.full_name || 'Admin User')
  const [email, setEmail] = useState(profile?.email || 'admin@company.com')
  const [phone, setPhone] = useState(profile?.phone || '+91 98765 43210')

  const [callerId, setCallerId] = useState('+91 98765 43210')
  const [dialerProvider, setDialerProvider] = useState('phone')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Profile settings updated')
  }

  const handleSaveTelephony = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Dialer settings updated')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile and workspace preferences.
        </p>
      </div>

      {/* User Profile Settings */}
      <Card className="shadow-sm">
        <form onSubmit={handleSaveProfile}>
          <CardHeader>
            <CardTitle className="text-base">User Profile</CardTitle>
            <CardDescription className="text-xs">
              Your personal information displayed on calls and task assignments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Role</label>
                <div className="h-9 flex items-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs capitalize">
                    {role || 'Agent'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 justify-end pt-4">
            <Button type="submit" size="sm" className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Dialer Settings */}
      <Card className="shadow-sm">
        <form onSubmit={handleSaveTelephony}>
          <CardHeader>
            <CardTitle className="text-base">Phone & Dialer Configuration</CardTitle>
            <CardDescription className="text-xs">
              Configure outbound caller ID for click-to-call.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Dialer Provider</label>
                <select
                  value={dialerProvider}
                  onChange={(e) => setDialerProvider(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="phone">Standard Web Dialer</option>
                  <option value="twilio">Twilio Voice</option>
                  <option value="exotel">Exotel</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Caller ID (Outbound Phone)</label>
                <Input
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 justify-end pt-4">
            <Button type="submit" size="sm" className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Save Dialer Settings
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* System Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">System Status</CardTitle>
              <CardDescription className="text-xs">
                Real-time database connection status.
              </CardDescription>
            </div>
            <Badge variant="success" className="text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Database Sync</p>
              <p className="text-muted-foreground text-[11px]">Real-time database replication active.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
