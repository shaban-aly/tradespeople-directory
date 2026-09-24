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
      anonymous_push_outbox: {
        Row: {
          body: string
          category_slug: string
          craftsman_id: string
          created_at: string
          id: string
          key: string
          status: string
          title: string
          url: string
        }
        Insert: {
          body: string
          category_slug: string
          craftsman_id: string
          created_at?: string
          id?: string
          key: string
          status?: string
          title: string
          url?: string
        }
        Update: {
          body?: string
          category_slug?: string
          craftsman_id?: string
          created_at?: string
          id?: string
          key?: string
          status?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_push_outbox_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_push_subscriptions: {
        Row: {
          created_at: string
          id: string
          interests: string[]
          last_notified_at: string | null
          notification_count: number
          platform: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[]
          last_notified_at?: string | null
          notification_count?: number
          platform?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[]
          last_notified_at?: string | null
          notification_count?: number
          platform?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          plural_name: string
          singular_name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          plural_name: string
          singular_name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          plural_name?: string
          singular_name?: string
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
      craftsman_stats_daily: {
        Row: {
          calls: number
          craftsman_id: string
          day: string
          views: number
          whatsapp: number
        }
        Insert: {
          calls?: number
          craftsman_id: string
          day?: string
          views?: number
          whatsapp?: number
        }
        Update: {
          calls?: number
          craftsman_id?: string
          day?: string
          views?: number
          whatsapp?: number
        }
        Relationships: [
          {
            foreignKeyName: "craftsman_stats_daily_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      craftsmen: {
        Row: {
          added_at: string
          area_id: string
          avatar_position: Json
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
          updated_at: string
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          added_at?: string
          area_id: string
          avatar_position?: Json
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
          updated_at?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          added_at?: string
          area_id?: string
          avatar_position?: Json
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
          updated_at?: string
          verified?: boolean
          whatsapp?: string | null
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
      interaction_logs: {
        Row: {
          contact_method: string
          craftsman_id: string
          created_at: string
          id: number
          metadata: Json | null
          user_id: string | null
          user_status: string
        }
        Insert: {
          contact_method: string
          craftsman_id: string
          created_at?: string
          id?: never
          metadata?: Json | null
          user_id?: string | null
          user_status?: string
        }
        Update: {
          contact_method?: string
          craftsman_id?: string
          created_at?: string
          id?: never
          metadata?: Json | null
          user_id?: string | null
          user_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_logs_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          metadata: Json
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          key: string
          metadata?: Json
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          metadata?: Json
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: []
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
      push_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value?: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
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
      user_interest_subscriptions: {
        Row: {
          category_slug: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_slug: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_slug?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string
          device_name: string
          device_type: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string
          device_type?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token: string
          user_agent?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          device_type?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
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
      create_notification: {
        Args: {
          p_body: string
          p_key?: string
          p_metadata?: Json
          p_recipient_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      get_admin_activity_feed: {
        Args: { p_limit?: number; p_offset?: number; p_timeframe?: string }
        Returns: {
          contact_method: string
          craftsman_id: string
          craftsman_name: string
          craftsman_slug: string
          created_at: string
          log_id: number
          metadata: Json
          user_display_name: string | null
          user_status: string
        }[]
      }
      get_admin_breakdown_counts: { Args: never; Returns: Json }
      get_admin_nav_counts: { Args: never; Returns: Json }
      get_admin_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_admin_users: {
        Args: never
        Returns: {
          avatar_url: string | null
          craftsman_id: string | null
          craftsman_name: string | null
          craftsman_slug: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string
        }[]
      }
      get_craftsman_activity_feed: {
        Args: { p_limit?: number }
        Returns: {
          contact_method: string
          created_at: string
          log_id: number
          user_display_name: string | null
          user_status: string
        }[]
      }
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
      get_site_stats: { Args: never; Returns: Json }
      increment_craftsman_stats: {
        Args: {
          p_action: string
          p_ip?: string
          p_slug: string
          p_user_id?: string
          p_user_status?: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      link_craftsman_user: {
        Args: { craftsman_id_input: string; user_email_input: string }
        Returns: boolean
      }
      mark_notifications_read: { Args: { p_ids: string[] }; Returns: number }
      normalize_arabic: { Args: { p_text: string }; Returns: string }
      notify_all_admins: {
        Args: {
          p_body: string
          p_key: string
          p_metadata: Json
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      purge_old_interaction_logs: {
        Args: { p_max_age_days?: number }
        Returns: number
      }
      purge_old_notifications: {
        Args: { p_max_age_days?: number }
        Returns: number
      }
      rate_limit_consume: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: Json
      }
      register_anonymous_push: {
        Args: { p_interests?: string[]; p_platform?: string; p_token: string }
        Returns: undefined
      }
      register_push_token: {
        Args: {
          p_device_name?: string
          p_device_type?: string
          p_platform?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      reject_craftsman_application: {
        Args: { p_craftsman_id: string }
        Returns: undefined
      }
      search_craftsmen: {
        Args: {
          p_area?: string
          p_category?: string
          p_limit?: number
          p_query?: string
          p_sort?: string
        }
        Returns: {
          added_at: string
          area: Json
          avatar_position: Json
          category: Json
          description: string
          id: string
          image_url: string
          name: string
          phone: string
          slug: string
          social_links: Json
          updated_at: string
          verified: boolean
          whatsapp: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unregister_anonymous_push: {
        Args: { p_token: string }
        Returns: undefined
      }
      unregister_push_token: { Args: { p_token: string }; Returns: undefined }
      update_anonymous_interests: {
        Args: { p_interests: string[]; p_token: string }
        Returns: undefined
      }
      upsert_push_setting: {
        Args: { p_key: string; p_value: string }
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
