export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      craftsman_events: {
        Row: {
          craftsman_id: string
          created_at: string
          device_key: string
          event_type: string
          id: number
          path: string
          session_id: string
        }
        Insert: {
          craftsman_id: string
          created_at?: string
          device_key: string
          event_type: string
          id?: never
          path?: string
          session_id: string
        }
        Update: {
          craftsman_id?: string
          created_at?: string
          device_key?: string
          event_type?: string
          id?: never
          path?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "craftsman_events_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      craftsman_stats: {
        Row: {
          calls: number
          craftsman_id: string
          updated_at: string
          views: number
          whatsapp: number
        }
        Insert: {
          calls?: number
          craftsman_id: string
          updated_at?: string
          views?: number
          whatsapp?: number
        }
        Update: {
          calls?: number
          craftsman_id?: string
          updated_at?: string
          views?: number
          whatsapp?: number
        }
        Relationships: [
          {
            foreignKeyName: "craftsman_stats_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: true
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      craftsmen: {
        Row: {
          added_at: string
          area_id: string
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          phone: string
          slug: string | null
          social_links: Json
          status: string
          submitted_by: string | null
          verified: boolean
          whatsapp: string | null
          updated_at: string
        }
        Insert: {
          added_at?: string
          area_id: string
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          phone: string
          slug?: string | null
          social_links?: Json
          status?: string
          submitted_by?: string | null
          verified?: boolean
          whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          added_at?: string
          area_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          phone?: string
          slug?: string | null
          social_links?: Json
          status?: string
          submitted_by?: string | null
          verified?: boolean
          whatsapp?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "craftsmen_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craftsmen_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craftsmen_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "craftsman_counts_by_category"
            referencedColumns: ["category_id"]
          },
        ]
      }
      favorites: {
        Row: {
          craftsman_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          craftsman_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          craftsman_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          craftsman_id: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          craftsman_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          craftsman_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          craftsman_name: string
          created_at: string
          id: string
          message: string
          phone: string | null
          reporter_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          craftsman_name: string
          created_at?: string
          id?: string
          message: string
          phone?: string | null
          reporter_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          craftsman_name?: string
          created_at?: string
          id?: string
          message?: string
          phone?: string | null
          reporter_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          craftsman_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment?: string | null
          craftsman_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          user_name?: string
        }
        Update: {
          comment?: string | null
          craftsman_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      craftsman_counts_by_category: {
        Row: {
          category_id: string | null
          craftsman_count: number | null
          slug: string | null
        }
        Relationships: []
      }
      craftsman_rating_summaries: {
        Row: {
          average_rating: number | null
          craftsman_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_craftsman_application: {
        Args: { p_craftsman_id: string }
        Returns: string
      }
      get_analytics_overview: { Args: never; Returns: Json }
      get_craftsman_favorites_count: {
        Args: { p_craftsman_id: string }
        Returns: number
      }
      get_craftsman_rating_summary: {
        Args: { p_craftsman_id: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      get_my_craftsman_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_related_craftsmen: {
        Args: { p_craftsman_id: string; p_limit?: number }
        Returns: {
          added_at: string
          area_name: string
          category_icon: string
          category_name: string
          category_slug: string
          co_count: number
          description: string
          id: string
          image_url: string
          name: string
          phone: string
          slug: string
          verified: boolean
          whatsapp: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      link_craftsman_user: {
        Args: { craftsman_id_input: string; user_email_input: string }
        Returns: boolean
      }
      record_craftsman_event: {
        Args: {
          p_device_key: string
          p_metric: string
          p_path?: string
          p_session_id: string
          p_slug: string
        }
        Returns: boolean
      }
      reject_craftsman_application: {
        Args: { p_craftsman_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const