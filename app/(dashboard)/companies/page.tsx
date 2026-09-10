"use client"

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Globe,
  Phone,
  MapPin,
  Users,
  ExternalLink,
  MoreHorizontal
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
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { toast } from 'sonner'
import type { Company } from '@/types'

const initialCompanies = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Acme Cloud Dynamics',
    domain: 'acmecloud.io',
    industry: 'Cloud Infrastructure',
    size: '51-200',
    phone: '+1 (555) 234-5678',
    website: 'https://acmecloud.io',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    contacts_count: 3,
    deals_count: 1,
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    name: 'Starlight FinTech',
    domain: 'starlightpay.com',
    industry: 'Financial Technology',
    size: '201-1000',
    phone: '+1 (555) 345-6789',
    website: 'https://starlightpay.com',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    contacts_count: 2,
    deals_count: 1,
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    name: 'Apex BioHealth',
    domain: 'apexbio.health',
    industry: 'Healthcare AI',
    size: '11-50',
    phone: '+1 (555) 456-7890',
    website: 'https://apexbio.health',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    contacts_count: 1,
    deals_count: 1,
  },
]

export default function CompaniesPage() {
  const { supabase } = useSupabase()
  const { can } = usePermissions()

  const [companies, setCompanies] = useState(initialCompanies)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [industry, setIndustry] = useState('')
  const [size, setSize] = useState('11-50')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('USA')

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { data } = await (supabase.from('companies') as any)
          .select('*')
          .is('deleted_at', null)
          .order('name')

        if (data && data.length > 0) {
          setCompanies(data)
        }
      } catch (e) {
        // use initial
      }
    }
    loadCompanies()
  }, [supabase])

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error('Company name is required')
      return
    }

    const newCompany = {
      id: Math.random().toString(),
      name,
      domain,
      industry,
      size,
      phone,
      website: website || `https://${domain}`,
      city,
      state: 'CA',
      country,
      contacts_count: 0,
      deals_count: 0,
    }

    setCompanies((prev) => [newCompany, ...prev])
    toast.success('Company account created successfully')

    setName('')
    setDomain('')
    setIndustry('')
    setPhone('')
    setWebsite('')
    setCity('')
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Companies & Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize organization profiles, employee associations, and aggregate account deals.
          </p>
        </div>

        {can('companies', 'create') && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                <Plus className="h-4 w-4" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Company Account</DialogTitle>
                <DialogDescription>
                  Create a company profile to group contacts, deals, and communication logs.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCompany} className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Company Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Cloud Dynamics"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Domain</label>
                    <Input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="acme.io"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Industry</label>
                    <Input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="SaaS / Cloud"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Company Size</label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="1-10">1-10 Employees</option>
                      <option value="11-50">11-50 Employees</option>
                      <option value="51-200">51-200 Employees</option>
                      <option value="201-1000">201-1000 Employees</option>
                      <option value="1000+">1000+ Employees</option>
                    </select>
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
                    <label className="text-xs font-medium">City</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Website</label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Company</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter companies by name or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((company) => (
          <Card key={company.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {company.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{company.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{company.industry || 'Enterprise'}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {company.size}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="space-y-1.5 text-muted-foreground">
                {company.domain && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={company.website || `https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {company.domain} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {company.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {company.city}, {company.country}
                    </span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{company.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {company.contacts_count || 1} Contacts
                </span>
                <span className="font-semibold text-foreground">
                  {company.deals_count || 1} Active Deal
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
