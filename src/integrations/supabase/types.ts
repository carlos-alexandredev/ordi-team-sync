export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      call_attachments: {
        Row: {
          call_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          call_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          call_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["call_priority"]
          status: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["call_priority"]
          status?: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["call_priority"]
          status?: Database["public"]["Enums"]["call_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          active: boolean | null
          address: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          fantasy_name: string | null
          id: string
          name: string
          phone: string | null
          responsible_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          fantasy_name?: string | null
          id?: string
          name: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          fantasy_name?: string | null
          id?: string
          name?: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          id: string
          installation_date: string | null
          last_maintenance_date: string | null
          location: string | null
          model: string | null
          name: string
          observations: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          model?: string | null
          name: string
          observations?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          model?: string | null
          name?: string
          observations?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipments_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipments_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          order_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          order_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          order_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      order_comments: {
        Row: {
          attachments: Json | null
          comment: string
          created_at: string
          id: string
          is_internal: boolean | null
          order_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          order_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_comments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_equipments: {
        Row: {
          action_type: string
          created_at: string
          equipment_id: string
          id: string
          observations: string | null
          order_id: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          equipment_id: string
          id?: string
          observations?: string | null
          order_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          equipment_id?: string
          id?: string
          observations?: string | null
          order_id?: string
        }
        Relationships: []
      }
      order_history: {
        Row: {
          comment: string | null
          created_at: string
          from_status: string | null
          id: string
          order_id: string
          to_status: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          order_id: string
          to_status: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          order_id?: string
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_questionnaire_responses: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          order_id: string
          responses: Json
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          responses?: Json
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          responses?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_questionnaire_responses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_time_logs: {
        Row: {
          check_in_location: string | null
          check_in_time: string | null
          check_out_location: string | null
          check_out_time: string | null
          created_at: string
          id: string
          order_id: string
          technician_id: string
          total_minutes: number | null
          updated_at: string
        }
        Insert: {
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          order_id: string
          technician_id: string
          total_minutes?: number | null
          updated_at?: string
        }
        Update: {
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          order_id?: string
          technician_id?: string
          total_minutes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          call_id: string | null
          client_id: string
          company_id: string
          created_at: string
          description: string
          execution_date: string | null
          id: string
          priority: Database["public"]["Enums"]["order_priority"]
          scheduled_date: string | null
          sla_hours: number | null
          status: Database["public"]["Enums"]["order_status"]
          technician_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          call_id?: string | null
          client_id: string
          company_id: string
          created_at?: string
          description: string
          execution_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["order_priority"]
          scheduled_date?: string | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          technician_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          call_id?: string | null
          client_id?: string
          company_id?: string
          created_at?: string
          description?: string
          execution_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["order_priority"]
          scheduled_date?: string | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          technician_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          role_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: string
          role_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          role_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          attachments: Json | null
          category: string
          completed_at: string | null
          cost: number | null
          created_at: string
          description: string
          due_date: string | null
          estimated_hours: number | null
          id: string
          location: string | null
          order_number: string
          priority: string
          requester_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description: string
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          order_number: string
          priority?: string
          requester_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          location?: string | null
          order_number?: string
          priority?: string
          requester_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean
          name: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      task_additional_costs: {
        Row: {
          created_at: string
          description: string
          id: string
          task_id: string
          value: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          task_id: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          task_id?: string
          value?: number
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      task_equipments: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          task_id?: string
        }
        Relationships: []
      }
      task_products: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          name: string
          quantity: number
          task_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          name: string
          quantity: number
          task_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          name?: string
          quantity?: number
          task_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: []
      }
      task_services: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          name: string
          quantity: number
          task_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          name: string
          quantity: number
          task_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          name?: string
          quantity?: number
          task_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          additional_costs_total: number | null
          address: string | null
          assigned_to: string
          check_in_type: string
          client_id: string | null
          company_id: string
          created_at: string
          description: string
          duration_minutes: number
          end_date: string | null
          end_type: string | null
          external_code: string | null
          final_total: number | null
          frequency: string | null
          global_discount: number | null
          google_maps_url: string | null
          id: string
          is_recurring: boolean | null
          keyword: string | null
          latitude: number | null
          longitude: number | null
          priority: string
          products_total: number | null
          questionnaire_id: string | null
          repeat_count: number | null
          scheduled_date: string
          services_total: number | null
          status: string
          survey_recipient_email: string | null
          task_type: string
          updated_at: string
          use_satisfaction_survey: boolean | null
          week_days: number[] | null
        }
        Insert: {
          additional_costs_total?: number | null
          address?: string | null
          assigned_to: string
          check_in_type?: string
          client_id?: string | null
          company_id: string
          created_at?: string
          description: string
          duration_minutes: number
          end_date?: string | null
          end_type?: string | null
          external_code?: string | null
          final_total?: number | null
          frequency?: string | null
          global_discount?: number | null
          google_maps_url?: string | null
          id?: string
          is_recurring?: boolean | null
          keyword?: string | null
          latitude?: number | null
          longitude?: number | null
          priority?: string
          products_total?: number | null
          questionnaire_id?: string | null
          repeat_count?: number | null
          scheduled_date: string
          services_total?: number | null
          status?: string
          survey_recipient_email?: string | null
          task_type: string
          updated_at?: string
          use_satisfaction_survey?: boolean | null
          week_days?: number[] | null
        }
        Update: {
          additional_costs_total?: number | null
          address?: string | null
          assigned_to?: string
          check_in_type?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          end_date?: string | null
          end_type?: string | null
          external_code?: string | null
          final_total?: number | null
          frequency?: string | null
          global_discount?: number | null
          google_maps_url?: string | null
          id?: string
          is_recurring?: boolean | null
          keyword?: string | null
          latitude?: number | null
          longitude?: number | null
          priority?: string
          products_total?: number | null
          questionnaire_id?: string | null
          repeat_count?: number | null
          scheduled_date?: string
          services_total?: number | null
          status?: string
          survey_recipient_email?: string | null
          task_type?: string
          updated_at?: string
          use_satisfaction_survey?: boolean | null
          week_days?: number[] | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          granted_by: string | null
          id: string
          module_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          module_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          granted_by?: string | null
          id?: string
          module_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          last_page: string | null
          login_time: string
          logout_time: string | null
          session_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          last_page?: string | null
          login_time?: string
          logout_time?: string | null
          session_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          last_page?: string | null
          login_time?: string
          logout_time?: string | null
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_sla_remaining: {
        Args: { order_id: string; sla_hours?: number }
        Returns: unknown
      }
      check_sla_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          title: string
          client_name: string
          technician_name: string
          sla_status: string
          remaining_hours: number
        }[]
      }
      count_online_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_users_by_role: {
        Args: { role_name: string }
        Returns: number
      }
      ensure_admin_master_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_online_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          user_name: string
          user_email: string
          user_role: string
          login_time: string
          last_activity: string
          last_page: string
          ip_address: string
          session_duration: unknown
          is_online: boolean
        }[]
      }
      get_role_permissions: {
        Args: { role_name: string }
        Returns: {
          permission_name: string
          display_name: string
          description: string
          resource: string
          action: string
        }[]
      }
      get_user_allowed_modules: {
        Args: { target_user_id?: string }
        Returns: {
          module_name: string
          module_title: string
          module_url: string
          module_icon: string
          has_custom_permission: boolean
          is_allowed: boolean
        }[]
      }
      get_user_company: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_master: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      call_priority: "baixa" | "média" | "alta"
      call_status: "aberto" | "em análise" | "fechado"
      order_priority: "baixa" | "média" | "alta"
      order_status: "pendente" | "em execução" | "concluída" | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      call_priority: ["baixa", "média", "alta"],
      call_status: ["aberto", "em análise", "fechado"],
      order_priority: ["baixa", "média", "alta"],
      order_status: ["pendente", "em execução", "concluída", "cancelada"],
    },
  },
} as const
