// ============================================================
// أنواع قاعدة بيانات Supabase — مولدّة من `supabase/schema.sql`
// و`supabase/migrations/` (منسّقة كإخراج `supabase gen types`).
// لا تعدّل يدوياً إلا عند تغيير المخطط ثم نعيد التوليد.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          icon: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          phone: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      craftsman_events: {
        Row: {
          id: number;
          event_type: string;
          craftsman_id: string;
          device_key: string;
          session_id: string;
          path: string;
          created_at: string;
        };
        Insert: {
          event_type: string;
          craftsman_id: string;
          device_key: string;
          session_id: string;
          path?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          event_type?: string;
          craftsman_id?: string;
          device_key?: string;
          session_id?: string;
          path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "craftsman_events_craftsman_id_fkey";
            columns: ["craftsman_id"];
            isOneToOne: false;
            referencedRelation: "craftsmen";
            referencedColumns: ["id"];
          },
        ];
      };
      craftsman_stats: {
        Row: {
          craftsman_id: string;
          views: number;
          calls: number;
          whatsapp: number;
          updated_at: string;
        };
        Insert: {
          craftsman_id: string;
          views?: number;
          calls?: number;
          whatsapp?: number;
          updated_at?: string;
        };
        Update: {
          craftsman_id?: string;
          views?: number;
          calls?: number;
          whatsapp?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "craftsman_stats_craftsman_id_fkey";
            columns: ["craftsman_id"];
            isOneToOne: true;
            referencedRelation: "craftsmen";
            referencedColumns: ["id"];
          },
        ];
      };
      craftsmen: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category_id: string;
          area_id: string;
          image_url: string | null;
          phone: string;
          whatsapp: string | null;
          description: string | null;
          verified: boolean;
          added_at: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category_id: string;
          area_id: string;
          image_url?: string | null;
          phone: string;
          whatsapp?: string | null;
          description?: string | null;
          verified?: boolean;
          added_at?: string;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category_id?: string;
          area_id?: string;
          image_url?: string | null;
          phone?: string;
          whatsapp?: string | null;
          description?: string | null;
          verified?: boolean;
          added_at?: string;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "craftsmen_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "craftsmen_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
      join_requests: {
        Row: {
          id: string;
          type: string;
          name: string | null;
          category_id: string | null;
          area_id: string | null;
          phone: string | null;
          whatsapp: string | null;
          description: string | null;
          image_url: string | null;
          craftsman_name: string | null;
          report_message: string | null;
          status: string;
          created_at: string;
          social_links: Json;
        };
        Insert: {
          id?: string;
          type: string;
          name?: string | null;
          category_id?: string | null;
          area_id?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          description?: string | null;
          image_url?: string | null;
          craftsman_name?: string | null;
          report_message?: string | null;
          status?: string;
          created_at?: string;
          social_links?: Json;
        };
        Update: {
          id?: string;
          type?: string;
          name?: string | null;
          category_id?: string | null;
          area_id?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          description?: string | null;
          image_url?: string | null;
          craftsman_name?: string | null;
          report_message?: string | null;
          status?: string;
          created_at?: string;
          social_links?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "join_requests_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "join_requests_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          window_start: string;
          count: number;
        };
        Insert: {
          key: string;
          window_start?: string;
          count?: number;
        };
        Update: {
          key?: string;
          window_start?: string;
          count?: number;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          id: string;
          craftsman_id: string;
          platform: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          craftsman_id: string;
          platform: string;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          craftsman_id?: string;
          platform?: string;
          url?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_links_craftsman_id_fkey";
            columns: ["craftsman_id"];
            isOneToOne: false;
            referencedRelation: "craftsmen";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_join_request: {
        Args: {
          p_request_id: string;
        };
        Returns: string;
      };
      get_analytics_overview: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_related_craftsmen: {
        Args: {
          p_craftsman_id: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          slug: string;
          name: string;
          image_url: string | null;
          phone: string;
          whatsapp: string | null;
          description: string | null;
          verified: boolean;
          added_at: string;
          category_slug: string;
          category_name: string;
          category_icon: string;
          area_name: string;
          co_count: number;
        }[];
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      rate_limit_consume: {
        Args: {
          p_key: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after: number;
        }[];
      };
      record_craftsman_event: {
        Args: {
          p_slug: string;
          p_metric: string;
          p_device_key: string;
          p_session_id: string;
          p_path?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
