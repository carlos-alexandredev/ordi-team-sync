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
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
