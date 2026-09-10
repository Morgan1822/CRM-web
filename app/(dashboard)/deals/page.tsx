"use client"

import React, { useState, useEffect } from 'react'
import {
  KanbanSquare,
  Plus,
  Calendar,
  Building2,
  User,
  MoreVertical,
  Loader2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

const STAGES = [
  { key: 'lead', name: 'Lead / Discovery', color: 'bg-indigo-500', probability: 10 },
  { key: 'qualified', name: 'Meeting / Qualified', color: 'bg-blue-500', probability: 30 },
  { key: 'proposal', name: 'Proposal Sent', color: 'bg-pink-500', probability: 60 },
  { key: 'negotiation', name: 'Negotiation', color: 'bg-amber-500', probability: 80 },
  { key: 'won', name: 'Closed Won', color: 'bg-emerald-500', probability: 100 },
  { key: 'lost', name: 'Closed Lost', color: 'bg-rose-500', probability: 0 },
]

export default function DealsPage() {
  const { supabase, user } = useSupabase()
  const { can } = usePermissions()

  const [deals, setDeals] = useState<any[]>([])
  const [contactsList, setContactsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [dealTitle, setDealTitle] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [dealStage, setDealStage] = useState('lead')
  const [contactId, setContactId] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [notes, setNotes] = useState('')

  const loadDealsAndContacts = async () => {
    try {
      const [dealsRes, contactsRes] = await Promise.all([
        (supabase.from('deals') as any)
          .select(`
            *,
            contact:contacts(first_name, last_name, company)
          `)
          .order('created_at', { ascending: false }),
        (supabase.from('contacts') as any)
          .select('id, first_name, last_name, company')
          .order('first_name')
      ])

      if (dealsRes.data) {
        setDeals(dealsRes.data)
      }
      if (contactsRes.data) {
        setContactsList(contactsRes.data)
      }
    } catch (e) {
      console.error('Failed to load deals:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDealsAndContacts()

    const channel = supabase
      .channel('deals_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        loadDealsAndContacts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const totalPipeline = deals
    .filter((d) => (d.stage || '').toLowerCase() !== 'lost')
    .reduce((acc, curr) => acc + Number(curr.value || 0), 0)

  const handleMoveStage = async (dealId: string, newStageKey: string) => {
    if (!can('deals', 'edit')) {
      toast.error('Permission denied')
      return
    }

    try {
      const { error } = await (supabase.from('deals') as any)
        .update({
          stage: newStageKey,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId)

      if (error) throw error

      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: newStageKey } : d))
      )

      const targetStage = STAGES.find((s) => s.key === newStageKey)
      toast.success(`Deal moved to "${targetStage?.name}"`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update deal stage')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!can('deals', 'delete')) {
      toast.error('Permission denied')
      return
    }

    try {
      const { error } = await (supabase.from('deals') as any)
        .delete()
        .eq('id', dealId)

      if (error) throw error
      toast.success('Deal deleted')
      await loadDealsAndContacts()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete deal')
    }
  }

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealTitle || !dealValue) {
      toast.error('Please enter a title and value')
      return
    }

    try {
      const { error } = await (supabase.from('deals') as any)
        .insert([
          {
            title: dealTitle,
            value: parseFloat(dealValue) || 0,
            currency: 'INR',
            stage: dealStage,
            contact_id: contactId || null,
            expected_close_date: closeDate || null,
            notes: notes || null,
            assigned_to: user?.id || null,
          },
        ])

      if (error) throw error

      toast.success('Deal created successfully')
      await loadDealsAndContacts()

      setDealTitle('')
      setDealValue('')
      setContactId('')
      setCloseDate('')
      setNotes('')
      setIsAddOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to create deal')
    }
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
            Visual sales pipeline with stage tracking and conversion metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card/60">
            <span className="text-xs text-muted-foreground">Active Pipeline:</span>
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
                    Add a deal to your sales pipeline.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateDeal} className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Deal Title *</label>
                    <Input
                      value={dealTitle}
                      onChange={(e) => setDealTitle(e.target.value)}
                      placeholder="e.g. Annual Software License"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Deal Value (₹ INR) *</label>
                      <Input
                        type="number"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        placeholder="100000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Stage</label>
                      <select
                        value={dealStage}
                        onChange={(e) => setDealStage(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.name} ({s.probability}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Linked Contact</label>
                    <select
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="">-- Select Contact (Optional) --</option>
                      {contactsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
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
                      placeholder="Key terms, requirements, or next steps..."
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
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading pipeline...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => {
              const st = (d.stage || 'lead').toLowerCase()
              return st === stage.key || (stage.key === 'lead' && st === 'lead / discovery') || (stage.key === 'won' && st === 'closed won') || (stage.key === 'lost' && st === 'closed lost')
            })

            const stageTotal = stageDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0)

            return (
              <div key={stage.key} className="flex flex-col min-w-[240px] bg-muted/30 rounded-xl p-3 border border-border/70">
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
                    stageDeals.map((deal) => {
                      const contactName = deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}`.trim() : null
                      const companyName = deal.contact?.company || null

                      return (
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
                                  {STAGES.map((s) => (
                                    <DropdownMenuItem
                                      key={s.key}
                                      onClick={() => handleMoveStage(deal.id, s.key)}
                                      disabled={s.key === (deal.stage || 'lead').toLowerCase()}
                                      className="text-xs"
                                    >
                                      Move to {s.name}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="text-destructive text-xs"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1.5" /> Delete Deal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Value */}
                            <div className="text-sm font-bold text-foreground">
                              {formatCurrency(deal.value)}
                            </div>

                            {/* Contact / Company */}
                            {(contactName || companyName) && (
                              <div className="space-y-1 text-[11px] text-muted-foreground">
                                {contactName && (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{contactName}</span>
                                  </div>
                                )}
                                {companyName && (
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{companyName}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Close Date */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {deal.expected_close_date ? formatDate(deal.expected_close_date) : 'No date'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
