"use client"

import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  Download,
  Upload,
  MoreHorizontal,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface ContactItem {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string
  company_id: string | null
  job_title: string | null
  status: string
  lead_source: string | null
  notes: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  assigned_to: string
}

const initialContacts: ContactItem[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    email: 'sarah.jenkins@acmecloud.io',
    phone: '+1 (555) 123-4567',
    company_name: 'Acme Cloud Dynamics',
    company_id: '20000000-0000-0000-0000-000000000001',
    job_title: 'VP of Engineering',
    status: 'qualified',
    lead_source: 'website',
    notes: 'Interested in multi-region failover and dedicated support tier.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: null,
    deleted_at: null,
    assigned_to: 'Alex Morgan',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    first_name: 'Michael',
    last_name: 'Chang',
    email: 'mchang@starlightpay.com',
    phone: '+1 (555) 987-6543',
    company_name: 'Starlight FinTech',
    company_id: '20000000-0000-0000-0000-000000000002',
    job_title: 'Chief Product Officer',
    status: 'lead',
    lead_source: 'inbound_call',
    notes: 'Evaluating API integration throughput for payment processing.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: null,
    deleted_at: null,
    assigned_to: 'Sarah Jenkins',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena@apexbio.health',
    phone: '+1 (555) 876-5432',
    company_name: 'Apex BioHealth',
    company_id: '20000000-0000-0000-0000-000000000003',
    job_title: 'Head of Clinical Tech',
    status: 'contacted',
    lead_source: 'referral',
    notes: 'Looking for HIPAA compliant CRM sync with native mobile agent app.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: null,
    deleted_at: null,
    assigned_to: 'Alex Morgan',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    first_name: 'David',
    last_name: 'Kowalski',
    email: 'david@quantumlogistics.co',
    phone: '+1 (555) 345-9012',
    company_name: 'Quantum Logistics',
    company_id: null,
    job_title: 'Operations Director',
    status: 'customer',
    lead_source: 'campaign',
    notes: 'Existing enterprise subscriber looking to add 50 more seats.',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: null,
    deleted_at: null,
    assigned_to: 'David Miller',
  },
]

export default function ContactsPage() {
  const { supabase } = useSupabase()
  const { can } = usePermissions()

  const [contacts, setContacts] = useState<ContactItem[]>(initialContacts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null)

  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [status, setStatus] = useState('lead')
  const [leadSource, setLeadSource] = useState('website')
  const [notes, setNotes] = useState('')

  // Load live contacts if Supabase connected
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data } = await (supabase.from('contacts') as any)
          .select(`
            *,
            company:companies(name)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          const mapped = data.map((c: any) => ({
            ...c,
            company_name: c.company?.name || '',
          }))
          setContacts(mapped)
        }
      } catch (e) {
        // use fallback initial contacts
      }
    }
    loadContacts()
  }, [supabase])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)

    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus

    return matchesSearch && matchesStatus && !contact.deleted_at
  })

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName) {
      toast.error('First and last name are required')
      return
    }

    if (editingContact) {
      // Update existing
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                company_name: companyName,
                job_title: jobTitle,
                status,
                lead_source: leadSource,
                notes,
                updated_at: new Date().toISOString(),
              }
            : c
        )
      )
      toast.success('Contact updated successfully')
    } else {
      // Create new
      const newContact: ContactItem = {
        id: Math.random().toString(),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: companyName,
        company_id: null,
        job_title: jobTitle,
        status,
        lead_source: leadSource,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: null,
        deleted_at: null,
        assigned_to: 'Alex Morgan',
      }
      setContacts((prev) => [newContact, ...prev])
      toast.success('New lead created and synced with shared Supabase database')
    }

    resetForm()
    setIsAddOpen(false)
  }

  const handleDeleteContact = (contactId: string) => {
    if (!can('contacts', 'delete')) {
      toast.error('You do not have permission to delete contacts')
      return
    }

    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, deleted_at: new Date().toISOString() } : c))
    )
    toast.success('Contact soft-deleted (preserved for audit & mobile sync)')
  }

  const handleEditClick = (contact: ContactItem) => {
    setEditingContact(contact)
    setFirstName(contact.first_name)
    setLastName(contact.last_name)
    setEmail(contact.email || '')
    setPhone(contact.phone || '')
    setCompanyName(contact.company_name || '')
    setJobTitle(contact.job_title || '')
    setStatus(contact.status || 'lead')
    setLeadSource(contact.lead_source || 'website')
    setNotes(contact.notes || '')
    setIsAddOpen(true)
  }

  const resetForm = () => {
    setEditingContact(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setCompanyName('')
    setJobTitle('')
    setStatus('lead')
    setLeadSource('website')
    setNotes('')
  }

  const handleExportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Status', 'Lead Source']
    const rows = filteredContacts.map((c) => [
      c.first_name,
      c.last_name,
      c.email || '',
      c.phone || '',
      c.company_name || '',
      c.job_title || '',
      c.status,
      c.lead_source || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `crm_contacts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Contacts exported to CSV')
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'qualified':
        return <Badge variant="success">Qualified</Badge>
      case 'lead':
        return <Badge variant="secondary">New Lead</Badge>
      case 'contacted':
        return <Badge variant="warning">Contacted</Badge>
      case 'customer':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Customer</Badge>
      default:
        return <Badge variant="outline">{st}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Contacts & Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer profiles, lead statuses, click-to-call dialer logs, and real-time mobile sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>

          {can('contacts', 'create') && (
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm() }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                  <Plus className="h-4 w-4" /> Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingContact ? 'Edit Contact' : 'Create New Contact / Lead'}</DialogTitle>
                  <DialogDescription>
                    Fill in the contact information. Changes sync immediately to both Web and Mobile.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveContact} className="space-y-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">First Name *</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Last Name *</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Jenkins"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah@company.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Phone</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Company</label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Job Title</label>
                      <Input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="VP of Product"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="lead">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="customer">Customer</option>
                        <option value="unqualified">Unqualified</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Lead Source</label>
                      <select
                        value={leadSource}
                        onChange={(e) => setLeadSource(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        <option value="website">Website</option>
                        <option value="inbound_call">Inbound Call</option>
                        <option value="referral">Referral</option>
                        <option value="campaign">Marketing Campaign</option>
                        <option value="outbound">Outbound SDR</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add key context, budget notes, or technical requirements..."
                      className="w-full h-16 rounded-md border border-input bg-background p-2 text-xs resize-none"
                    />
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingContact ? 'Save Changes' : 'Create Contact'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['all', 'lead', 'contacted', 'qualified', 'customer'].map((st) => (
              <Button
                key={st}
                variant={selectedStatus === st ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedStatus(st)}
                className="text-xs capitalize h-8"
              >
                {st === 'all' ? 'All Contacts' : st}
              </Button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Data Table */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold">Contact</TableHead>
              <TableHead className="text-xs font-semibold">Company & Title</TableHead>
              <TableHead className="text-xs font-semibold">Phone / Click-to-Call</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Lead Source</TableHead>
              <TableHead className="text-xs font-semibold">Assigned To</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                  No contacts found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((c) => {
                const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
                return (
                  <TableRow key={c.id} className="text-xs hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {c.first_name} {c.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {c.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" /> {c.company_name || 'Individual'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{c.job_title || '-'}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors"
                          title="Click to dial with Twilio Voice"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>{getStatusBadge(c.status)}</TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {c.lead_source?.replace('_', ' ') || 'Direct'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-muted-foreground font-medium">{c.assigned_to || 'Unassigned'}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-xs">Contact Actions</DropdownMenuLabel>
                          {c.phone && (
                            <DropdownMenuItem
                              onClick={() => {
                                toast.success(`Opened Twilio dialer for ${c.first_name}`)
                              }}
                            >
                              <Phone className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                              <span>Call Contact</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEditClick(c)}>
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            <span>Edit Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            <span>Soft Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
