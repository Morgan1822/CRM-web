"use client"

import React, { useState, useEffect } from 'react'
import {
  KanbanSquare,
  Plus,
  DollarSign,
  Calendar,
  Building2,
  User,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { toast } from 'sonner'
import type { Deal } from '@/types'

const initialStages = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Lead / Discovery', color: 'bg-indigo-500', probability: 10 },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Meeting Scheduled', color: 'bg-blue-500', probability: 30 },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Proposal Sent', color: 'bg-pink-500', probability: 60 },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Negotiation', color: 'bg-amber-500', probability: 80 },
  { id: '10000000-0000-0000-0000-000000000005', name: 'Closed Won', color: 'bg-emerald-500', probability: 100 },
  { id: '10000000-0000-0000-0000-000000000006', name: 'Closed Lost', color: 'bg-rose-500', probability: 0 },
]

const initialDeals = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    title: 'Enterprise Cloud Migration 2026',
    value: 120000,
    currency: 'USD',
    stage_id: '10000000-0000-0000-0000-000000000003',
    company_name: 'Acme Cloud Dynamics',
    contact_name: 'Sarah Jenkins',
    expected_close_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    notes: 'Proposal submitted, technical architecture approved.',
    assigned_to: 'Alex Morgan',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    title: 'Payment Gateway Integration',
    value: 65000,
    currency: 'USD',
    stage_id: '10000000-0000-0000-0000-000000000002',
    company_name: 'Starlight FinTech',
    contact_name: 'Michael Chang',
    expected_close_date: new Date(Date.now() + 86400000 * 45).toISOString(),
    notes: 'Demo meeting scheduled for upcoming sprint.',
    assigned_to: 'Sarah Jenkins',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    title: 'Healthcare AI Platform License',
    value: 240000,
    currency: 'USD',
    stage_id: '10000000-0000-0000-0000-000000000004',
    company_name: 'Apex BioHealth',
    contact_name: 'Elena Rostova',
    expected_close_date: new Date(Date.now() + 86400000 * 15).toISOString(),
    notes: 'Final contract redlining with compliance team.',
    assigned_to: 'Alex Morgan',
  },
]

export default function DealsPage() {
  const { supabase } = useSupabase()
  const { can } = usePermissions()

  const [stages, setStages] = useState(initialStages)
  const [deals, setDeals] = useState(initialDeals)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [dealTitle, setDealTitle] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [dealStage, setDealStage] = useState(stages[0].id)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [notes, setNotes] = useState('')

  // Load live deals if connected
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const { data } = await (supabase.from('deals') as any)
          .select(`
            *,
            stage:pipeline_stages(*),
            company:companies(name),
            contact:contacts(first_name, last_name)
          `)
          .is('deleted_at', null)

        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            ...d,
            company_name: d.company?.name || 'Individual',
            contact_name: d.contact ? `${d.contact.first_name} ${d.contact.last_name}` : '',
          }))
          setDeals(mapped)
        }
      } catch (e) {
        // fallback
      }
    }
    loadDeals()
  }, [supabase])

  const totalPipeline = deals.reduce((acc, curr) => acc + Number(curr.value || 0), 0)

  const handleMoveStage = (dealId: string, newStageId: string) => {
    if (!can('deals', 'edit')) {
      toast.error('You do not have permission to edit deal stages')
      return
    }

    const targetStage = stages.find((s) => s.id === newStageId)
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
    )

    toast.success(`Deal moved to "${targetStage?.name}"`)
  }

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealTitle || !dealValue) {
      toast.error('Please enter a title and value')
      return
    }

    const newDeal = {
      id: Math.random().toString(),
      title: dealTitle,
      value: parseFloat(dealValue) || 0,
      currency: 'USD',
      stage_id: dealStage,
      company_name: companyName || 'Apex Client',
      contact_name: contactName || 'Primary Lead',
      expected_close_date: closeDate || new Date(Date.now() + 86400000 * 30).toISOString(),
      notes,
      assigned_to: 'Alex Morgan',
    }

    setDeals((prev) => [newDeal, ...prev])
    toast.success('Deal created and synced across Web & Mobile CRM')

    // Reset Form
    setDealTitle('')
    setDealValue('')
    setCompanyName('')
    setContactName('')
    setCloseDate('')
    setNotes('')
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-primary" /> Deals & Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual sales pipeline with drag-and-drop stage updates, probability weighting, and realtime mobile synchronization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card/60">
            <span className="text-xs text-muted-foreground">Total Pipeline:</span>
            <span className="text-xs font-bold text-foreground">{formatCurrency(totalPipeline)}</span>
          </div>

          {can('deals', 'create') && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 shadow-sm text-xs">
                  <Plus className="h-4 w-4" /> Create Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Deal</DialogTitle>
                  <DialogDescription>
                    Add a deal to your sales pipeline. It will be immediately visible on the Flutter mobile app.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateDeal} className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Deal Title *</label>
                    <Input
                      value={dealTitle}
                      onChange={(e) => setDealTitle(e.target.value)}
                      placeholder="e.g. Enterprise SLA Agreement"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Deal Value ($ USD) *</label>
                      <Input
                        type="number"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        placeholder="50000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Initial Stage</label>
                      <select
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.probability}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Company</label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Cloud"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Primary Contact</label>
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Sarah Jenkins"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Expected Close Date</label>
                    <Input
                      type="date"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Deal Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Key deal drivers, decision makers, competitors..."
                      className="w-full h-16 rounded-md border border-input bg-background p-2 text-xs resize-none"
                    />
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Deal</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id)
          const stageTotal = stageDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0)

          return (
            <div key={stage.id} className="flex flex-col min-w-[240px] bg-muted/30 rounded-xl p-3 border border-border/70">
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-xs text-foreground truncate">{stage.name}</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                  {stageDeals.length}
                </Badge>
              </div>

              {/* Column Total */}
              <div className="text-[11px] text-muted-foreground font-medium py-1.5">
                {formatCurrency(stageTotal)}
              </div>

              {/* Deal Cards */}
              <div className="flex-1 space-y-3 mt-2">
                {stageDeals.length === 0 ? (
                  <div className="h-24 rounded-lg border border-dashed border-border/80 flex items-center justify-center text-[11px] text-muted-foreground">
                    No deals
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <Card key={deal.id} className="shadow-sm hover:shadow-md transition-shadow bg-card border-border/80">
                      <CardContent className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-foreground leading-tight line-clamp-2">
                            {deal.title}
                          </h4>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1.5 -mt-1">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-[11px]">Move Stage</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {stages.map((s) => (
                                <DropdownMenuItem
                                  key={s.id}
                                  onClick={() => handleMoveStage(deal.id, s.id)}
                                  disabled={s.id === deal.stage_id}
                                  className="text-xs"
                                >
                                  Move to {s.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Value */}
                        <div className="text-sm font-bold text-foreground">
                          {formatCurrency(deal.value)}
                        </div>

                        {/* Company & Contact */}
                        <div className="space-y-1 text-[11px] text-muted-foreground">
                          {deal.company_name && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{deal.company_name}</span>
                            </div>
                          )}
                          {deal.contact_name && (
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{deal.contact_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Close Date */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(deal.expected_close_date)}
                          </span>
                          <span className="font-medium text-foreground">{deal.assigned_to?.split(' ')[0]}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
