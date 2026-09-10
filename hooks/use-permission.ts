"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import { EntityName, PermissionAction } from "@/types"

export function usePermissions() {
  const { profile } = useSupabase()

  // Extract role string correctly whether it is a string ('Admin', 'Agent', 'Manager') or a Role object
  const getRoleName = (): string => {
    if (!profile) return 'Agent'
    if (typeof profile.role === 'string' && profile.role.trim().length > 0) {
      return profile.role
    }
    if (profile.role && typeof profile.role === 'object' && 'name' in profile.role) {
      return (profile.role as any).name || 'Agent'
    }
    return 'Agent'
  }

  const roleName = getRoleName()
  const normRole = roleName.toLowerCase()
  const isSuperAdmin = normRole === 'admin' || normRole === 'administrator'
  const isManager = normRole === 'manager'
  const isAgent = normRole === 'agent'

  const can = (entity: EntityName, action: PermissionAction): boolean => {
    if (!profile) return true // Optimistic while loading

    if (isSuperAdmin) {
      return true
    }

    // Granular database-configured permissions if available
    const entityPerms = profile.permissions?.[entity]
    if (entityPerms && Object.keys(entityPerms).length > 0) {
      switch (action) {
        case 'view':
          return !!entityPerms.can_view
        case 'create':
          return !!entityPerms.can_create
        case 'edit':
          return !!entityPerms.can_edit
        case 'delete':
          return !!entityPerms.can_delete
        default:
          return false
      }
    }

    // Standard fallback rules by role
    if (isManager) {
      if (entity === 'roles' || entity === 'settings') {
        return action === 'view'
      }
      if (action === 'delete') {
        return ['deals', 'contacts', 'companies', 'tasks'].includes(entity)
      }
      return true
    }

    if (isAgent) {
      if (entity === 'roles' || entity === 'settings') {
        return false
      }
      if (action === 'delete') {
        return false
      }
      return ['contacts', 'companies', 'deals', 'calls', 'tasks', 'activities'].includes(entity)
    }

    return false
  }

  return {
    can,
    role: roleName,
    isSuperAdmin,
    isManager,
    isAgent,
  }
}

