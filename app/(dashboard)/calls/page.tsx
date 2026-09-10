"use client"

import React, { useState, useEffect } from 'react'
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Play,
  FileText,
  User,
  Plus,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'

export default function CallsPage() {
  const { supabase } = useSupabase()
  const [calls, setCalls] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadCalls = async () => {
    try {
      const { data, error } = await (supabase.from('calls') as any)
        .select(`
          *,
          contact:contacts(first_name, last_name, company)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setCalls(data)
      }
    } catch (e) {
      console.error('Failed to load calls:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCalls()

    const channel = supabase
      .channel('calls_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        loadCalls()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds}s`
  }

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'connected_interested':
        return <Badge variant="success">Interested</Badge>
      case 'left_voicemail':
        return <Badge variant="warning">Voicemail</Badge>
      case 'follow_up_needed':
        return <Badge variant="secondary">Follow-Up</Badge>
      default:
        return <Badge variant="outline">Logged</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-primary" /> Calls & Telephony Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Twilio Voice call history, duration records, and post-call notes synchronized across Web and Mobile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            Provider: <strong className="ml-1 text-primary">Twilio Voice (WebRTC)</strong>
          </Badge>
        </div>
      </div>

      {/* Calls Table */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">Direction & Contact</TableHead>
              <TableHead className="text-xs font-semibold">Phone Number</TableHead>
              <TableHead className="text-xs font-semibold">Duration</TableHead>
              <TableHead className="text-xs font-semibold">Outcome</TableHead>
              <TableHead className="text-xs font-semibold">Notes</TableHead>
              <TableHead className="text-xs font-semibold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading call records from Supabase...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                  No call logs found in database. Use the in-app dialer to place a call.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => {
                const contactName = call.contact ? `${call.contact.first_name} ${call.contact.last_name}`.trim() : null
                const companyName = call.contact?.company || null

                return (
                  <TableRow key={call.id} className="text-xs hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            call.direction === 'inbound'
                              ? 'bg-blue-500/15 text-blue-600'
                              : 'bg-emerald-500/15 text-emerald-600'
                          }`}
                        >
                          {call.direction === 'inbound' ? (
                            <PhoneIncoming className="h-3.5 w-3.5" />
                          ) : (
                            <PhoneOutgoing className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{contactName || 'Unassigned Contact'}</p>
                          {companyName && <p className="text-[10px] text-muted-foreground">{companyName}</p>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-[11px] text-foreground">{call.to_number}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">{formatSeconds(call.duration_seconds || 0)}</span>
                    </TableCell>

                    <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>

                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-muted-foreground">{call.notes || 'No notes'}</p>
                    </TableCell>

                    <TableCell>
                      <span className="text-muted-foreground">{formatDateTime(call.created_at)}</span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
