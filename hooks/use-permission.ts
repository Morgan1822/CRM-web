"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import { EntityName, PermissionAction } from "@/types"

export function usePermissions() {
  const { profile } = useSupabase()

  const can = (entity: EntityName, action: PermissionAction): boolean => {
    if (!profile) return true // default optimistic for dev preview

    // If super admin role
    if (profile.role?.name?.toLowerCase() === 'admin' || !profile.role_id) {
      return true
    }

    const entityPerms = profile.permissions?.[entity]
    if (!entityPerms) return false

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

  return {
    can,
    role: profile?.role?.name || 'Admin',
    isSuperAdmin: !profile?.role_id || profile?.role?.name?.toLowerCase() === 'admin',
  }
}
