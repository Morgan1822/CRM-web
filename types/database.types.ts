export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          entity: string
          can_view: boolean
          can_create: boolean
          can_edit: boolean
          can_delete: boolean
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          entity: string
          can_view?: boolean
          can_create?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          entity?: string
          can_view?: boolean
          can_create?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role_id: string | null
          phone: string | null
          status: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          company_id: string | null
          job_title: string | null
          status: string
          lead_source: string | null
          notes: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          company_id?: string | null
          job_title?: string | null
          status?: string
          lead_source?: string | null
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          company_id?: string | null
          job_title?: string | null
          status?: string
          lead_source?: string | null
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
      }
      pipeline_stages: {
        Row: {
          id: string
          name: string
          order_index: number
          color: string
          win_probability: number
          is_closed_won: boolean
          is_closed_lost: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          order_index?: number
          color?: string
          win_probability?: number
          is_closed_won?: boolean
          is_closed_lost?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          order_index?: number
          color?: string
          win_probability?: number
          is_closed_won?: boolean
          is_closed_lost?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          value: number
          currency: string
          stage_id: string
          contact_id: string | null
          company_id: string | null
          assigned_to: string | null
          expected_close_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          value?: number
          currency?: string
          stage_id: string
          contact_id?: string | null
          company_id?: string | null
          assigned_to?: string | null
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          value?: number
          currency?: string
          stage_id?: string
          contact_id?: string | null
          company_id?: string | null
          assigned_to?: string | null
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          type: string
          title: string
          description: string | null
          contact_id: string | null
          deal_id: string | null
          company_id: string | null
          user_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          description?: string | null
          contact_id?: string | null
          deal_id?: string | null
          company_id?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          description?: string | null
          contact_id?: string | null
          deal_id?: string | null
          company_id?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      calls: {
        Row: {
          id: string
          contact_id: string | null
          deal_id: string | null
          user_id: string | null
          provider: string
          provider_call_sid: string | null
          direction: string
          from_number: string | null
          to_number: string
          status: string
          duration_seconds: number
          recording_url: string | null
          notes: string | null
          outcome: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          contact_id?: string | null
          deal_id?: string | null
          user_id?: string | null
          provider?: string
          provider_call_sid?: string | null
          direction?: string
          from_number?: string | null
          to_number: string
          status?: string
          duration_seconds?: number
          recording_url?: string | null
          notes?: string | null
          outcome?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string | null
          deal_id?: string | null
          user_id?: string | null
          provider?: string
          provider_call_sid?: string | null
          direction?: string
          from_number?: string | null
          to_number?: string
          status?: string
          duration_seconds?: number
          recording_url?: string | null
          notes?: string | null
          outcome?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          priority: string
          due_date: string | null
          is_completed: boolean
          contact_id: string | null
          deal_id: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: string
          priority?: string
          due_date?: string | null
          is_completed?: boolean
          contact_id?: string | null
          deal_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          priority?: string
          due_date?: string | null
          is_completed?: boolean
          contact_id?: string | null
          deal_id?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
        }
      }
      device_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: string
          last_seen_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          platform: string
          last_seen_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          platform?: string
          last_seen_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: {
          user_id: string
          entity_name: string
          action_name: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
