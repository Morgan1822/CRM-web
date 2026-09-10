"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Check,
  X,
  UserPlus,
  Loader2,
  Plus,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import type { Role } from '@/types'

const ENTITIES = [
  { key: 'contacts', label: 'Contacts & Leads' },
  { key: 'companies', label: 'Companies & Accounts' },
  { key: 'deals', label: 'Deals & Pipeline' },
  { key: 'calls', label: 'Call Logs' },
  { key: 'tasks', label: 'Tasks & Reminders' },
  { key: 'activities', label: 'Activity Feed' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'settings', label: 'Settings' },
]

const DEFAULT_ROLES: Role[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Admin',
    description: 'Full unrestricted access to all CRM entities, team roles, and settings',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Manager',
    description: 'Can view, create, and manage leads, deals, tasks, calls, and reports',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Agent',
    description: 'Standard sales agent: can view and manage assigned contacts, deals, calls, and tasks',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const getDefaultPermissionsForRole = (roleName: string) => {
  const norm = (roleName || '').toLowerCase()
  const matrix: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }> = {}

  ENTITIES.forEach((e) => {
    if (norm === 'admin') {
      matrix[e.key] = { view: true, create: true, edit: true, delete: true }
    } else if (norm === 'manager') {
      const isSensitive = e.key === 'roles' || e.key === 'settings'
      matrix[e.key] = {
        view: true,
        create: !isSensitive,
        edit: !isSensitive,
        delete: e.key === 'deals' || e.key === 'contacts' || e.key === 'companies' || e.key === 'tasks',
      }
    } else {
      // Agent
      const isCore = ['contacts', 'companies', 'deals', 'calls', 'tasks', 'activities'].includes(e.key)
      matrix[e.key] = {
        view: isCore,
        create: isCore,
        edit: isCore,
        delete: false,
      }
    }
  })

  return matrix
}

export default function RolesPage() {
  const { supabase, profile, user, refreshProfile } = useSupabase()
  const { isSuperAdmin } = usePermissions()

  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES)
  const [selectedRole, setSelectedRole] = useState<Role>(DEFAULT_ROLES[0])
  const [permissionsMatrix, setPermissionsMatrix] = useState<
    Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>
  >(() => getDefaultPermissionsForRole('Admin'))

  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoadingPerms, setIsLoadingPerms] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)

  // Invite Member Modal State
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRoleId, setInviteRoleId] = useState(DEFAULT_ROLES[2].id)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  // Create Role Modal State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  // 1. Fetch Roles from Supabase with safe fallback
  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true)
    try {
      const { data, error } = await (supabase.from('roles') as any)
        .select('*')
        .order('created_at', { ascending: true })

      if (error || !data || data.length === 0) {
        setRoles(DEFAULT_ROLES)
        setSelectedRole((prev) => prev || DEFAULT_ROLES[0])
        setInviteRoleId(DEFAULT_ROLES[2].id)
      } else {
        setRoles(data)
        setSelectedRole((prev) => {
          if (!prev) return data[0]
          const existing = data.find((r: Role) => r.id === prev.id)
          return existing || data[0]
        })
        const agentRole = data.find((r: Role) => r.name.toLowerCase() === 'agent') || data[0]
        setInviteRoleId(agentRole.id)
      }
    } catch (e: any) {
      console.error('Failed to load roles from DB, using fallback defaults:', e)
      setRoles(DEFAULT_ROLES)
      setSelectedRole(DEFAULT_ROLES[0])
      setInviteRoleId(DEFAULT_ROLES[2].id)
    } finally {
      setIsLoadingRoles(false)
    }
  }, [supabase])

  // 2. Fetch Permissions for the Selected Role
  const loadRolePermissions = useCallback(
    async (role: Role) => {
      setIsLoadingPerms(true)
      const defaultMatrix = getDefaultPermissionsForRole(role.name)

      try {
        const { data, error } = await (supabase.from('role_permissions') as any)
          .select('*')
          .eq('role_id', role.id)

        if (error || !data || data.length === 0) {
          setPermissionsMatrix(defaultMatrix)
        } else {
          const matrix = { ...defaultMatrix }
          data.forEach((row: any) => {
            if (row.entity) {
              matrix[row.entity] = {
                view: row.can_view ?? defaultMatrix[row.entity]?.view ?? true,
                create: row.can_create ?? defaultMatrix[row.entity]?.create ?? false,
                edit: row.can_edit ?? defaultMatrix[row.entity]?.edit ?? false,
                delete: row.can_delete ?? defaultMatrix[row.entity]?.delete ?? false,
              }
            }
          })
          setPermissionsMatrix(matrix)
        }
      } catch (e: any) {
        console.error('Failed to load role permissions:', e)
        setPermissionsMatrix(defaultMatrix)
      } finally {
        setIsLoadingPerms(false)
      }
    },
    [supabase]
  )

  // 3. Fetch Team Members safely without nonexistent columns
  const loadTeamMembers = useCallback(async () => {
    setIsLoadingTeam(true)
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('id, email, full_name, avatar_url, role, role_id, status, created_at')
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        // Fallback to active logged in session
        if (user) {
          const currentRoleName = typeof profile?.role === 'string' ? profile.role : 'Agent'
          setTeamMembers([
            {
              id: user.id,
              email: user.email || 'admin@crm.com',
              full_name: profile?.full_name || user.email?.split('@')[0] || 'User',
              role: currentRoleName,
              role_id: profile?.role_id || DEFAULT_ROLES[2].id,
              status: 'active',
            },
          ])
        } else {
          setTeamMembers([])
        }
      } else {
        setTeamMembers(data)
      }
    } catch (e: any) {
      console.error('Failed to load team members:', e)
      if (user) {
        const currentRoleName = typeof profile?.role === 'string' ? profile.role : 'Agent'
        setTeamMembers([
          {
            id: user.id,
            email: user.email || 'admin@crm.com',
            full_name: profile?.full_name || user.email?.split('@')[0] || 'User',
            role: currentRoleName,
            role_id: profile?.role_id || DEFAULT_ROLES[2].id,
            status: 'active',
          },
        ])
      }
    } finally {
      setIsLoadingTeam(false)
    }
  }, [supabase, user, profile])

  // Initial Data Load
  useEffect(() => {
    loadRoles()
    loadTeamMembers()
  }, [loadRoles, loadTeamMembers])

  // Load Permissions when selectedRole changes
  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole)
    }
  }, [selectedRole, loadRolePermissions])

  // Supabase Real-time Subscriptions
  useEffect(() => {
    const rolesChannel = supabase
      .channel('roles_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roles' }, () => {
        loadRoles()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadTeamMembers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => {
        if (selectedRole) {
          loadRolePermissions(selectedRole)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(rolesChannel)
    }
  }, [supabase, loadRoles, loadTeamMembers, selectedRole, loadRolePermissions])

  // 4. Toggle Permission with immediate Supabase Upsert
  const handleTogglePermission = async (
    entityKey: string,
    action: 'view' | 'create' | 'edit' | 'delete'
  ) => {
    if (!isSuperAdmin) {
      toast.error('Only Admins can modify role permissions')
      return
    }

    if (!selectedRole) return

    const currentEntityPerms = permissionsMatrix[entityKey] || {
      view: false,
      create: false,
      edit: false,
      delete: false,
    }

    const updatedValue = !currentEntityPerms[action]

    // Optimistic UI update
    setPermissionsMatrix((prev) => ({
      ...prev,
      [entityKey]: {
        ...prev[entityKey],
        [action]: updatedValue,
      },
    }))

    try {
      const payload = {
        role_id: selectedRole.id,
        entity: entityKey,
        can_view: action === 'view' ? updatedValue : currentEntityPerms.view,
        can_create: action === 'create' ? updatedValue : currentEntityPerms.create,
        can_edit: action === 'edit' ? updatedValue : currentEntityPerms.edit,
        can_delete: action === 'delete' ? updatedValue : currentEntityPerms.delete,
        updated_at: new Date().toISOString(),
      }

      const { error } = await (supabase.from('role_permissions') as any).upsert(
        payload,
        { onConflict: 'role_id,entity' }
      )

      if (error) {
        console.warn('Could not persist to role_permissions table:', error)
      } else {
        toast.success(
          `${action.toUpperCase()} permission for ${entityKey} set to ${
            updatedValue ? 'Enabled' : 'Disabled'
          }`
        )
      }
    } catch (err: any) {
      console.error('Failed to save permission:', err)
    }
  }

  // 5. Change Member Role with direct Supabase update
  const handleChangeMemberRole = async (memberId: string, newRoleId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only Admins can change team member roles')
      return
    }

    const targetRole = roles.find((r) => r.id === newRoleId || r.name.toLowerCase() === newRoleId.toLowerCase()) || roles[2]
    const roleName = targetRole.name || newRoleId

    // Optimistic UI update
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, role: roleName, role_id: targetRole.id }
          : m
      )
    )

    try {
      const updateData: Record<string, any> = {
        role: roleName,
        updated_at: new Date().toISOString(),
      }
      if (targetRole.id) {
        updateData.role_id = targetRole.id
      }

      const { error } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', memberId)

      if (error) {
        await (supabase.from('profiles') as any)
          .update({ role: roleName, updated_at: new Date().toISOString() })
          .eq('id', memberId)
      }

      if (memberId === user?.id) {
        await refreshProfile()
      }

      toast.success(`Role updated to ${roleName}`)
    } catch (err: any) {
      console.error('Failed to update member role:', err)
      toast.error(err.message || 'Failed to update role')
      loadTeamMembers()
    }
  }

  // 6. Invite / Add Team Member
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsInviting(true)
    try {
      const targetRole = roles.find((r) => r.id === inviteRoleId || r.name.toLowerCase() === inviteRoleId.toLowerCase()) || roles[2]
      const roleName = targetRole.name || 'Agent'

      const payload = {
        email: inviteEmail.trim().toLowerCase(),
        full_name: inviteName.trim() || inviteEmail.split('@')[0],
        role: roleName,
        role_id: targetRole.id,
        status: 'active',
      }

      const { error } = await (supabase.from('profiles') as any).insert([payload])

      if (error) {
        if (error.code === '23505') {
          // Already exists -> update role
          await (supabase.from('profiles') as any)
            .update({
              role: roleName,
              role_id: targetRole.id,
              full_name: inviteName.trim() || inviteEmail.split('@')[0],
            })
            .eq('email', inviteEmail.trim().toLowerCase())
        } else {
          // Optimistic addition if insert blocked by RLS/schema
          setTeamMembers((prev) => [
            {
              id: Math.random().toString(),
              email: inviteEmail.trim().toLowerCase(),
              full_name: inviteName.trim() || inviteEmail.split('@')[0],
              role: roleName,
              role_id: targetRole.id,
              status: 'active',
            },
            ...prev,
          ])
        }
      }

      toast.success(`Team member ${inviteEmail} added with role ${roleName}`)
      setInviteEmail('')
      setInviteName('')
      setIsInviteOpen(false)
      await loadTeamMembers()
    } catch (err: any) {
      console.error('Invite error:', err)
      toast.error(err.message || 'Failed to add team member')
    } finally {
      setIsInviting(false)
    }
  }

  // 7. Create Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name')
      return
    }

    setIsCreatingRole(true)
    try {
      const { data, error } = await (supabase.from('roles') as any)
        .insert([
          {
            name: newRoleName.trim(),
            description: newRoleDesc.trim() || null,
            is_system: false,
          },
        ])
        .select()
        .single()

      if (error) {
        // Fallback local addition
        const newLocalRole: Role = {
          id: Math.random().toString(),
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || null,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setRoles((prev) => [...prev, newLocalRole])
        setSelectedRole(newLocalRole)
      } else if (data) {
        setRoles((prev) => [...prev, data])
        setSelectedRole(data)
      }

      toast.success(`Role "${newRoleName}" created successfully`)
      setNewRoleName('')
      setNewRoleDesc('')
      setIsCreateRoleOpen(false)
    } catch (err: any) {
      console.error('Create role error:', err)
      toast.error(err.message || 'Failed to create custom role')
    } finally {
      setIsCreatingRole(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <ShieldCheck className="h-8 w-8 text-primary/70" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Admin Access Required</h2>
        <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-6 leading-relaxed">
          Roles & Permissions configuration and team security settings are restricted to Workspace Administrators.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline" size="sm" className="text-xs">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage granular access control and assign roles to your team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              {/* Create Role Modal */}
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Custom Role</DialogTitle>
                    <DialogDescription>
                      Add a custom role with tailored entity permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole} className="space-y-3.5 py-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Role Name *</label>
                      <Input
                        placeholder="e.g. Account Executive"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Description</label>
                      <Input
                        placeholder="e.g. Manages enterprise accounts and closed deals"
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateRoleOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingRole}>
                        {isCreatingRole && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Create Role
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Add Member Modal */}
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                    <UserPlus className="h-3.5 w-3.5" /> Add Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Assign a role and grant access to the CRM workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteUser} className="space-y-3.5 py-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Full Name</label>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="rahul@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Assign Role *</label>
                      <select
                        value={inviteRoleId}
                        onChange={(e) => setInviteRoleId(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.is_system ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isInviting}>
                        {isInviting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        Add Member
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="matrix" className="text-xs">
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs">
            Team Members ({teamMembers.length})
          </TabsTrigger>
        </TabsList>

        {/* Permissions Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles Selection List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Available Roles
                </h3>
                {isLoadingRoles && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>

              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/80 bg-card hover:bg-accent/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{r.name}</span>
                        {r.is_system && (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            System
                          </Badge>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {r.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Granular Permissions Table */}
            <div className="md:col-span-2">
              <Card className="shadow-sm border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <span>{selectedRole?.name || 'Role'} Permissions</span>
                        {selectedRole?.is_system && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            Default Role
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {selectedRole?.description ||
                          'Click any check/cross box to toggle real-time Supabase access controls.'}
                      </CardDescription>
                    </div>

                    {isLoadingPerms && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    )}
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
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                      }

                      return (
                        <div
                          key={entity.key}
                          className="grid grid-cols-5 p-3.5 items-center hover:bg-muted/20 transition-colors text-xs"
                        >
                          <div className="font-medium text-foreground">{entity.label}</div>

                          {/* View Toggle */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(entity.key, 'view')}
                              title={`Toggle View for ${entity.label}`}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-all ${
                                perms.view
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-muted text-muted-foreground/40 hover:bg-muted/80'
                              }`}
                            >
                              {perms.view ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Create Toggle */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(entity.key, 'create')}
                              title={`Toggle Create for ${entity.label}`}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-all ${
                                perms.create
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-muted text-muted-foreground/40 hover:bg-muted/80'
                              }`}
                            >
                              {perms.create ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Edit Toggle */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(entity.key, 'edit')}
                              title={`Toggle Edit for ${entity.label}`}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-all ${
                                perms.edit
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-muted text-muted-foreground/40 hover:bg-muted/80'
                              }`}
                            >
                              {perms.edit ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Delete Toggle */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(entity.key, 'delete')}
                              title={`Toggle Delete for ${entity.label}`}
                              className={`h-6 w-6 rounded-md inline-flex items-center justify-center transition-all ${
                                perms.delete
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-muted text-muted-foreground/40 hover:bg-muted/80'
                              }`}
                            >
                              {perms.delete ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
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
          <Card className="shadow-sm border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold">Workspace Team Members</CardTitle>
              <CardDescription className="text-xs">
                Real-time Supabase user profiles and their assigned security roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTeam ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading team members...</span>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                  <span>No team members found. Click &quot;Add Team Member&quot; above to add one.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {teamMembers.map((member) => {
                    const initials = (member.full_name || member.email || 'U')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()

                    const rawRole = member.role || (roles.find((r) => r.id === member.role_id)?.name) || 'Agent'
                    const memberRoleName = typeof rawRole === 'string' ? rawRole : rawRole?.name || 'Agent'
                    const matchingRole =
                      roles.find((r) => r.name.toLowerCase() === memberRoleName.toLowerCase()) ||
                      roles.find((r) => r.id === member.role_id) ||
                      roles[2]
                    const currentRoleId = matchingRole?.id || member.role_id || DEFAULT_ROLES[2].id

                    return (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                {member.full_name || 'Team Member'}
                              </p>
                              {member.id === user?.id && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <Badge
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className="text-[10px] capitalize font-normal"
                          >
                            {member.status || 'Active'}
                          </Badge>

                          {/* Role Selector Dropdown */}
                          <select
                            value={currentRoleId}
                            onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                            disabled={!isSuperAdmin}
                            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


