"use client"

import React, { useState } from 'react'
import {
  Settings,
  Phone,
  Smartphone,
  Shield,
  Save,
  Key,
  Database,
  Bell,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { profile } = useSupabase()

  const [fullName, setFullName] = useState(profile?.full_name || 'Alex Morgan')
  const [email, setEmail] = useState(profile?.email || 'alex.morgan@company.com')
  const [phone, setPhone] = useState(profile?.phone || '+1 (555) 000-1111')

  const [twilioCallerId, setTwilioCallerId] = useState('+1 (555) 000-1111')
  const [dialerProvider, setDialerProvider] = useState('twilio')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Profile settings saved successfully')
  }

  const handleSaveTelephony = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Telephony and Twilio configuration updated')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Workspace & User Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure profile details, Twilio Voice caller ID, and Flutter mobile sync parameters.
        </p>
      </div>

      {/* User Profile Settings */}
      <Card className="shadow-sm">
        <form onSubmit={handleSaveProfile}>
          <CardHeader>
            <CardTitle className="text-base">User Profile</CardTitle>
            <CardDescription className="text-xs">
              Your personal information displayed across activity timelines and call logs.
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
                <label className="font-medium text-foreground">Direct Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Assigned Role</label>
                <div className="h-9 flex items-center">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {profile?.role?.name || 'Admin'}
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

      {/* Telephony & Dialer Configuration */}
      <Card className="shadow-sm">
        <form onSubmit={handleSaveTelephony}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Telephony & Voice Dialer</CardTitle>
                <CardDescription className="text-xs">
                  Configure outbound caller ID and WebRTC voice settings.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Twilio Programmable Voice
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Active Telephony Provider</label>
                <select
                  value={dialerProvider}
                  onChange={(e) => setDialerProvider(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="twilio">Twilio Voice (Default)</option>
                  <option value="exotel">Exotel Voice</option>
                  <option value="custom">Custom WebRTC Gateway</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Default Caller ID (Outbound Phone)</label>
                <Input
                  value={twilioCallerId}
                  onChange={(e) => setTwilioCallerId(e.target.value)}
                  placeholder="+1 (555) 000-1111"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 justify-end pt-4">
            <Button type="submit" size="sm" className="gap-1.5 text-xs">
              <Save className="h-3.5 w-3.5" /> Update Telephony
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Mobile App Sync & FCM Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Flutter Mobile App Sync (FCM Push)</CardTitle>
              <CardDescription className="text-xs">
                Shared Supabase Postgres Realtime synchronization status.
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
              <p className="font-semibold text-foreground">Supabase Realtime Replication</p>
              <p className="text-muted-foreground text-[11px]">Subscribed to contacts, deals, calls, and tasks tables.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">Active</span>
          </div>

          <div className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">FCM Device Tokens Registered</p>
              <p className="text-muted-foreground text-[11px]">Active Flutter mobile instances (iOS / Android).</p>
            </div>
            <Badge variant="secondary">3 Devices</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
