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
  Plus
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
import type { Call } from '@/types'

const initialCalls = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    contact_name: 'Sarah Jenkins',
    company_name: 'Acme Cloud Dynamics',
    direction: 'outbound',
    from_number: '+1 (555) 000-1111',
    to_number: '+1 (555) 123-4567',
    status: 'completed',
    duration_seconds: 342,
    outcome: 'connected_interested',
    notes: 'Confirmed budget is approved. Needs proposal sent before Friday.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    agent_name: 'Alex Morgan',
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    contact_name: 'Michael Chang',
    company_name: 'Starlight FinTech',
    direction: 'outbound',
    from_number: '+1 (555) 000-1111',
    to_number: '+1 (555) 987-6543',
    status: 'completed',
    duration_seconds: 180,
    outcome: 'connected_interested',
    notes: 'Initial discovery call regarding payment API throughput.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    agent_name: 'Sarah Jenkins',
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    contact_name: 'Elena Rostova',
    company_name: 'Apex BioHealth',
    direction: 'inbound',
    from_number: '+1 (555) 876-5432',
    to_number: '+1 (555) 000-1111',
    status: 'completed',
    duration_seconds: 420,
    outcome: 'connected_interested',
    notes: 'Questions about HIPAA compliance and mobile app permissions.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    agent_name: 'Alex Morgan',
  },
]

export default function CallsPage() {
  const { supabase } = useSupabase()
  const [calls, setCalls] = useState(initialCalls)

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
            Twilio Voice call history, duration records, and post-call notes shared across Web and Mobile.
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
              <TableHead className="text-xs font-semibold">Phone Numbers</TableHead>
              <TableHead className="text-xs font-semibold">Duration</TableHead>
              <TableHead className="text-xs font-semibold">Outcome</TableHead>
              <TableHead className="text-xs font-semibold">Notes</TableHead>
              <TableHead className="text-xs font-semibold">Agent</TableHead>
              <TableHead className="text-xs font-semibold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
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
                      <p className="font-semibold text-foreground">{call.contact_name}</p>
                      <p className="text-[10px] text-muted-foreground">{call.company_name}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-[11px] text-foreground">{call.to_number}</span>
                </TableCell>

                <TableCell>
                  <span className="font-medium">{formatSeconds(call.duration_seconds)}</span>
                </TableCell>

                <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>

                <TableCell className="max-w-xs">
                  <p className="line-clamp-2 text-muted-foreground">{call.notes}</p>
                </TableCell>

                <TableCell>
                  <span className="text-muted-foreground">{call.agent_name}</span>
                </TableCell>

                <TableCell>
                  <span className="text-muted-foreground">{formatDateTime(call.created_at)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
