"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { AuthUserProfile, RolePermission } from '@/types'

type TypedSupabaseClient = ReturnType<typeof createClient>

interface SupabaseContextType {
  supabase: TypedSupabaseClient
  user: User | null
  profile: AuthUserProfile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileData) {
        const rawProfile = profileData as any
        let permissionsMap: Record<string, any> = {}
        if (rawProfile.role_id) {
          const { data: permissions } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role_id', rawProfile.role_id)

          if (permissions) {
            ;(permissions as RolePermission[]).forEach(p => {
              permissionsMap[p.entity] = {
                can_view: p.can_view,
                can_create: p.can_create,
                can_edit: p.can_edit,
                can_delete: p.can_delete,
              }
            })
          }
        }
        setProfile({
          ...rawProfile,
          permissions: permissionsMap,
        })
      } else {
        // Fallback default admin profile for initial state
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Admin User',
          avatar_url: null,
          role_id: null,
          phone: null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          permissions: {
            contacts: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            companies: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            deals: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            calls: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            tasks: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            roles: { can_view: true, can_create: true, can_edit: true, can_delete: true },
            settings: { can_view: true, can_create: true, can_edit: true, can_delete: true },
          }
        })
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user)
        }
      } catch (err) {
        console.error('Supabase session init error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  return (
    <SupabaseContext.Provider value={{ supabase, user, profile, isLoading, refreshProfile }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
