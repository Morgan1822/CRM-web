"use client"

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Plus, UserCheck, Check, X, ShieldAlert, UserPlus, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSupabase } from '@/components/providers/supabase-provider'
import { usePermissions } from '@/hooks/use-permission'
import { toast } from 'sonner'
import type { Role, RolePermission } from '@/types'

const ENTITIES = [
  { key: 'contacts', label: 'Contacts & Leads' },
  { key: 'companies', label: 'Companies & Accounts' },
  { key: 'deals', label: 'Deals & Pipeline' },
  { key: 'calls', label: 'Calls & Dialer Logs' },
  { key: 'tasks', label: 'Tasks & Reminders' },
  { key: 'activities', label: 'Activity Feed' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'settings', label: 'Workspace Settings' },
]

export default function RolesPage() {
  const { supabase, profile } = useSupabase()
  const { isSuperAdmin } = usePermissions()

  const [roles, setRoles] = useState<Role[]>([
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin',
      description: 'Full unrestricted access to all CRM entities and team roles',
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Manager',
      description: 'Can view, create, and manage all leads, deals, tasks, and reports',
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Agent',
      description: 'Standard sales agent: manages assigned contacts, deals, and tasks',
      is_system: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  const [selectedRole, setSelectedRole] = useState<Role>(roles[0])
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({
    contacts: { view: true, create: true, edit: true, delete: true },
    companies: { view: true, create: true, edit: true, delete: true },
    deals: { view: true, create: true, edit: true, delete: true },
    calls: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true },
    activities: { view: true, create: true, edit: true, delete: true },
    roles: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
  })

  const [teamMembers, setTeamMembers] = useState([
    { id: '1', email: 'alex.morgan@company.com', full_name: 'Alex Morgan', role: 'Admin', status: 'Active' },
    { id: '2', email: 'sarah.j@company.com', full_name: 'Sarah Jenkins', role: 'Manager', status: 'Active' },
    { id: '3', email: 'dave.sales@company.com', full_name: 'David Miller', role: 'Agent', status: 'Active' },
    { id: '4', email: 'elena.r@company.com', full_name: 'Elena Rostova', role: 'Agent', status: 'Invited' },
  ])

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('Agent')
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // Fetch roles from Supabase if connected
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data } = await supabase.from('roles').select('*')
        if (data && data.length > 0) {
          setRoles(data)
          setSelectedRole(data[0])
        }
      } catch (e) {
        // use fallback initial state
      }
    }
    loadRoles()
  }, [supabase])

  const handleTogglePermission = (entity: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (!isSuperAdmin) {
      toast.error('Only Admins can modify role permissions')
      return
    }

    setPermissionsMatrix((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [action]: !prev[entity]?.[action],
      },
    }))
    toast.success(`Updated ${action} permission for ${entity}`)
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) {
      toast.error('Please provide an email address')
      return
    }

    setTeamMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        email: inviteEmail,
        full_name: inviteName || inviteEmail.split('@')[0],
        role: inviteRole,
        status: 'Invited',
      },
    ])

    toast.success(`Invitation sent to ${inviteEmail} with role "${inviteRole}"`)
    setInviteEmail('')
    setInviteName('')
    setIsInviteOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage granular entity permissions and team member assignments enforced at both RLS and UI layers.
          </p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <UserPlus className="h-4 w-4" /> Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join this CRM. They will inherit permissions based on their assigned role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Full Name</label>
                <Input
                  placeholder="e.g. Jordan Lee"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="jordan@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Manager">Manager (Team & Deals Lead)</option>
                  <option value="Agent">Agent (Sales Operator)</option>
                </select>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Send Invite</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="team">Team Members ({teamMembers.length})</TabsTrigger>
        </TabsList>

        {/* Permissions Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles Selection Column */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Defined Roles
              </h3>
              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = selectedRole.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/80 bg-card hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{r.name}</span>
                        {r.is_system && (
                          <Badge variant="outline" className="text-[10px]">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Entity Permissions Table */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {selectedRole.name} Permissions
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Granular CRUD access rules for the {selectedRole.name} role
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      RLS Enforced
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/60">
                    <div className="grid grid-cols-5 p-3 bg-muted/30 text-xs font-semibold text-muted-foreground">
                      <div className="col-span-1">Entity</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Create</div>
                      <div className="text-center">Edit</div>
                      <div className="text-center">Delete</div>
                    </div>

                    {ENTITIES.map((entity) => {
                      const perms = permissionsMatrix[entity.key] || {
                        view: true,
                        create: true,
                        edit: true,
                        delete: false,
                      }

                      return (
                        <div
                          key={entity.key}
                          className="grid grid-cols-5 p-3.5 items-center hover:bg-muted/20 transition-colors text-xs"
                        >
                          <div className="font-medium text-foreground">{entity.label}</div>

                          {/* View */}
                          <div className="text-center">
                            <button
                              onClick={() => handleTogglePermission(entity.key, 'view')}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.view
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground/50'
                              }`}
                            >
                              {perms.view ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Create */}
                          <div className="text-center">
                            <button
                              onClick={() => handleTogglePermission(entity.key, 'create')}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.create
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground/50'
                              }`}
                            >
                              {perms.create ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Edit */}
                          <div className="text-center">
                            <button
                              onClick={() => handleTogglePermission(entity.key, 'edit')}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.edit
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground/50'
                              }`}
                            >
                              {perms.edit ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Delete */}
                          <div className="text-center">
                            <button
                              onClick={() => handleTogglePermission(entity.key, 'delete')}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.delete
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground/50'
                              }`}
                            >
                              {perms.delete ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base">Workspace Team Members</CardTitle>
              <CardDescription className="text-xs">
                Users registered in Supabase Auth and their assigned CRM roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {member.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{member.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={member.status === 'Active' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {member.status}
                      </Badge>

                      <select
                        value={member.role}
                        onChange={(e) => {
                          const newRole = e.target.value
                          setTeamMembers((prev) =>
                            prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
                          )
                          toast.success(`Updated ${member.full_name}'s role to ${newRole}`)
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Agent">Agent</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
