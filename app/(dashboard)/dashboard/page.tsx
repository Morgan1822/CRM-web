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
  KanbanSquare,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { supabase, profile, user } = useSupabase()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPipelineValue: 0,
    activeDealsCount: 0,
    totalContacts: 0,
    callsLogged: 0,
    pendingTasks: 0,
    conversionRate: '0%',
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, { count: number; value: number }>>({
    lead: { count: 0, value: 0 },
    qualified: { count: 0, value: 0 },
    proposal: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  })

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Contacts
      const { data: contactsData } = await (supabase.from('contacts') as any)
        .select('*')
        .order('created_at', { ascending: false })

      const contacts = contactsData || []

      // 2. Fetch Deals
      const { data: dealsData } = await (supabase.from('deals') as any)
        .select('*')
        .order('created_at', { ascending: false })

      const deals = dealsData || []

      // 3. Fetch Tasks
      const { data: tasksData } = await (supabase.from('tasks') as any)
        .select('*')
        .order('due_date', { ascending: true })

      const tasks = tasksData || []

      // 4. Fetch Calls
      const { data: callsData } = await (supabase.from('calls') as any)
        .select('*')

      const calls = callsData || []

      // Calculate Pipeline Value (all open deals not marked lost)
      const openDeals = deals.filter((d: any) => {
        const st = (d.stage || '').toLowerCase()
        return st !== 'lost' && st !== 'closed lost'
      })

      const totalPipeline = openDeals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0)
      const activeDeals = deals.filter((d: any) => {
        const st = (d.stage || '').toLowerCase()
        return st !== 'won' && st !== 'lost' && st !== 'closed won' && st !== 'closed lost'
      })

      const wonDeals = deals.filter((d: any) => {
        const st = (d.stage || '').toLowerCase()
        return st === 'won' || st === 'closed won'
      })

      const convRate = deals.length > 0 ? `${Math.round((wonDeals.length / deals.length) * 100)}%` : '0%'
      const pendingTasksList = tasks.filter((t: any) => !t.is_completed)

      setStats({
        totalPipelineValue: totalPipeline,
        activeDealsCount: activeDeals.length,
        totalContacts: contacts.length,
        callsLogged: calls.length,
        pendingTasks: pendingTasksList.length,
        conversionRate: convRate,
      })

      // Stage Distribution
      const stagesMap: Record<string, { count: number; value: number }> = {
        lead: { count: 0, value: 0 },
        qualified: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        won: { count: 0, value: 0 },
        lost: { count: 0, value: 0 },
      }

      deals.forEach((d: any) => {
        let st = (d.stage || 'lead').toLowerCase().replace(' ', '_')
        if (st.includes('won')) st = 'won'
        else if (st.includes('lost')) st = 'lost'
        else if (st.includes('proposal')) st = 'proposal'
        else if (st.includes('meeting') || st.includes('qualified')) st = 'qualified'
        else if (st.includes('negotiat')) st = 'negotiation'
        else st = 'lead'

        if (!stagesMap[st]) stagesMap[st] = { count: 0, value: 0 }
        stagesMap[st].count += 1
        stagesMap[st].value += Number(d.value) || 0
      })

      setStageCounts(stagesMap)
      setUpcomingTasks(pendingTasksList.slice(0, 5))

      // Activities: Build from recent contacts, deals, tasks, calls
      const generatedActivities: any[] = []

      contacts.slice(0, 3).forEach((c: any) => {
        generatedActivities.push({
          id: `contact-${c.id}`,
          type: 'contact',
          title: `Contact: ${c.first_name} ${c.last_name}`,
          desc: c.company ? `Company: ${c.company} • Status: ${c.status || 'lead'}` : (c.email || 'New Contact created'),
          time: formatDate(c.created_at),
          badge: c.status || 'Lead',
          created_at: c.created_at,
        })
      })

      deals.slice(0, 3).forEach((d: any) => {
        generatedActivities.push({
          id: `deal-${d.id}`,
          type: 'deal',
          title: `Deal: ${d.title}`,
          desc: `Value: ${formatCurrency(d.value)} • Stage: ${d.stage || 'lead'}`,
          time: formatDate(d.created_at),
          badge: formatCurrency(d.value),
          created_at: d.created_at,
        })
      })

      tasks.slice(0, 3).forEach((t: any) => {
        generatedActivities.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Task: ${t.title}`,
          desc: t.due_date ? `Due: ${formatDate(t.due_date)}` : 'Priority Task',
          time: formatDate(t.created_at),
          badge: t.type || 'Task',
          created_at: t.created_at,
        })
      })

      calls.slice(0, 3).forEach((call: any) => {
        generatedActivities.push({
          id: `call-${call.id}`,
          type: 'call',
          title: `Call: ${call.to_number}`,
          desc: `Duration: ${call.duration_seconds || 0}s • Outcome: ${call.outcome || 'completed'}`,
          time: formatDate(call.created_at),
          badge: 'Call Log',
          created_at: call.created_at,
        })
      })

      generatedActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivities(generatedActivities.slice(0, 6))
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Realtime subscription for cross-app synchronization
    const channel = supabase
      .channel('dashboard_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await (supabase.from('tasks') as any)
        .update({ is_completed: !currentCompleted, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      setUpcomingTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, is_completed: !currentCompleted } : t))
      )
      toast.success(!currentCompleted ? 'Task marked as completed' : 'Task marked as pending')
      fetchDashboardData()
    } catch (e) {
      console.error(e)
    }
  }

  const pipelineStagesSummary = [
    { name: 'Lead / Discovery', count: stageCounts.lead?.count || 0, value: stageCounts.lead?.value || 0, color: 'bg-indigo-500' },
    { name: 'Meeting Scheduled', count: stageCounts.qualified?.count || 0, value: stageCounts.qualified?.value || 0, color: 'bg-blue-500' },
    { name: 'Proposal Sent', count: stageCounts.proposal?.count || 0, value: stageCounts.proposal?.value || 0, color: 'bg-pink-500' },
    { name: 'Negotiation', count: stageCounts.negotiation?.count || 0, value: stageCounts.negotiation?.value || 0, color: 'bg-amber-500' },
    { name: 'Closed Won', count: stageCounts.won?.count || 0, value: stageCounts.won?.value || 0, color: 'bg-emerald-500' },
  ]

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is your live CRM pipeline and activity overview synced with the Flutter mobile app in real-time.
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>{stats.activeDealsCount} open active deals</span>
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
                <span>
                  {stats.activeDealsCount > 0
                    ? `Avg. deal size: ${formatCurrency(stats.totalPipelineValue / stats.activeDealsCount)}`
                    : 'No active deals'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Contacts */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Contacts</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.totalContacts} Contacts</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>Realtime synced across Mobile & Web</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Tasks</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{stats.pendingTasks} Pending</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span>{stats.callsLogged} Calls logged</span>
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Realtime Sync
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recent activity recorded yet. Create a contact, deal, or task to see live updates.
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Priority Tasks (1 col) */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Tasks</CardTitle>
              <Link href="/tasks" className="text-xs text-primary font-medium hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No pending tasks. You are all caught up!
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    task.is_completed
                      ? 'border-border/40 bg-muted/20 opacity-60 line-through'
                      : 'border-border bg-card hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={!!task.is_completed}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-muted-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </span>
                        <Badge
                          variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'}
                          className="text-[9px] h-4 px-1"
                        >
                          {(task.type || 'TODO').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
