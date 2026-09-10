"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  DollarSign,
  Users,
  PhoneCall,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  KanbanSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSupabase } from '@/components/providers/supabase-provider'

export default function DashboardPage() {
  const { supabase, profile } = useSupabase()

  // State metrics
  const [stats, setStats] = useState({
    totalPipelineValue: 425000,
    activeDealsCount: 3,
    totalContacts: 18,
    callsLogged: 24,
    pendingTasks: 5,
    conversionRate: '34.5%',
  })

  const [recentActivities, setRecentActivities] = useState([
    {
      id: '1',
      type: 'call',
      title: 'Outbound call with Sarah Jenkins',
      desc: 'Completed 5m 42s discovery call regarding cloud migration roadmap.',
      time: '25 minutes ago',
      badge: 'Twilio Voice',
    },
    {
      id: '2',
      type: 'deal',
      title: 'Enterprise Cloud Migration moved to Proposal Sent',
      desc: 'Deal value: $120,000 • Expected close: Next Month',
      time: '2 hours ago',
      badge: '$120,000',
    },
    {
      id: '3',
      type: 'contact',
      title: 'New Lead: Michael Chang (Starlight FinTech)',
      desc: 'Lead source: Inbound Call • Assigned to Alex Morgan',
      time: '4 hours ago',
      badge: 'FinTech',
    },
    {
      id: '4',
      type: 'task',
      title: 'Task Due: Architecture review deck for Elena Rostova',
      desc: 'Priority: Urgent • Healthcare AI platform license',
      time: 'Today at 4:30 PM',
      badge: 'Urgent',
    },
  ])

  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: '1', title: 'Follow up on SLA questions with Sarah Jenkins', due: 'Today', priority: 'high', completed: false },
    { id: '2', title: 'Prepare FinTech Integration Deck for Michael', due: 'Tomorrow', priority: 'medium', completed: false },
    { id: '3', title: 'Legal contract final review with Elena', due: 'In 2 days', priority: 'urgent', completed: false },
  ])

  const pipelineStagesSummary = [
    { name: 'Lead / Discovery', count: 4, value: 45000, color: 'bg-indigo-500' },
    { name: 'Meeting Scheduled', count: 2, value: 65000, color: 'bg-blue-500' },
    { name: 'Proposal Sent', count: 2, value: 120000, color: 'bg-pink-500' },
    { name: 'Negotiation', count: 1, value: 240000, color: 'bg-amber-500' },
    { name: 'Closed Won', count: 5, value: 380000, color: 'bg-emerald-500' },
  ]

  const toggleTask = (taskId: string) => {
    setUpcomingTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || 'Alex'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is your live CRM pipeline and activity overview synced with the Flutter mobile app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/deals">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> New Deal
            </Button>
          </Link>
          <Link href="/contacts">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-4 w-4" /> Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pipeline Value</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPipelineValue)}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+18.4% from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Deals */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Deals</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <KanbanSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.activeDealsCount} Deals</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>Avg. deal size: {formatCurrency(stats.totalPipelineValue / stats.activeDealsCount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls Logged */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Dialer Calls</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.callsLogged} Calls</div>
              <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                <span>Twilio WebRTC logged</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts & Conversion */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Win Conversion</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.conversionRate}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>{stats.totalContacts} Total active contacts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Distribution Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Deal Pipeline Stages</CardTitle>
              <CardDescription className="text-xs">Live stage distribution across all open deals</CardDescription>
            </div>
            <Link href="/deals" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Open Kanban Board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {pipelineStagesSummary.map((stage) => (
                <div key={stage.name} className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold truncate">{stage.name}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-bold">{formatCurrency(stage.value)}</span>
                    <span className="text-xs text-muted-foreground font-medium">{stage.count} deals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Grid: Live Activity Stream & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities (2 cols) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Live Activity Timeline</CardTitle>
              <Badge variant="outline" className="text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Realtime
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentActivities.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'call' && <PhoneCall className="h-4 w-4" />}
                    {act.type === 'deal' && <DollarSign className="h-4 w-4" />}
                    {act.type === 'contact' && <Users className="h-4 w-4" />}
                    {act.type === 'task' && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{act.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {act.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Tasks (1 col) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Priority Tasks</CardTitle>
              <Link href="/tasks" className="text-xs text-primary font-medium hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  task.completed
                    ? 'border-border/40 bg-muted/20 opacity-60 line-through'
                    : 'border-border bg-card hover:bg-accent/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-muted-foreground"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {task.due}
                      </span>
                      <Badge
                        variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'}
                        className="text-[9px] h-4 px-1"
                      >
                        {task.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
