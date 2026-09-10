import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Role = Tables<'roles'>
export type RolePermission = Tables<'role_permissions'>
export type Profile = Tables<'profiles'>
export type Company = Tables<'companies'>
export type Contact = Tables<'contacts'>
export type PipelineStage = Tables<'pipeline_stages'>
export type Deal = Tables<'deals'>
export type Activity = Tables<'activities'>
export type Call = Tables<'calls'>
export type Task = Tables<'tasks'>
export type DeviceToken = Tables<'device_tokens'>

export type EntityName =
  | 'contacts'
  | 'companies'
  | 'deals'
  | 'calls'
  | 'tasks'
  | 'activities'
  | 'roles'
  | 'settings'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export interface UserPermissionMap {
  [entity: string]: {
    can_view: boolean
    can_create: boolean
    can_edit: boolean
    can_delete: boolean
  }
}

export interface AuthUserProfile extends Omit<Profile, 'role'> {
  role?: string | Role | any
  permissions?: UserPermissionMap
}
