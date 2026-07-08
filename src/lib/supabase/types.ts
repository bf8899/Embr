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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          event_type: string
          id: number
          path: string | null
          region: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_type: string
          id?: never
          path?: string | null
          region?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          event_type?: string
          id?: never
          path?: string | null
          region?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          max_uses: number
          note: string | null
          revoked: boolean
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          max_uses?: number
          note?: string | null
          revoked?: boolean
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          max_uses?: number
          note?: string | null
          revoked?: boolean
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "beta_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_length_requests: {
        Row: {
          approved_seconds: number | null
          creator_id: string
          cumulative_tips_at_request: number | null
          id: string
          leaderboard_rank_at_request: number | null
          requested_at: string
          requested_seconds: number
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          approved_seconds?: number | null
          creator_id: string
          cumulative_tips_at_request?: number | null
          id?: string
          leaderboard_rank_at_request?: number | null
          requested_at?: string
          requested_seconds: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          approved_seconds?: number | null
          creator_id?: string
          cumulative_tips_at_request?: number | null
          id?: string
          leaderboard_rank_at_request?: number | null
          requested_at?: string
          requested_seconds?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clip_length_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_length_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
          removed: boolean
          user_id: string
          video_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          removed?: boolean
          user_id: string
          video_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          removed?: boolean
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          creator_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          beta_mode: boolean
          creator_uploads_open: boolean
          default_clip_seconds: number
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          beta_mode?: boolean
          creator_uploads_open?: boolean
          default_clip_seconds?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          beta_mode?: boolean
          creator_uploads_open?: boolean
          default_clip_seconds?: number
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string
          ember_balance: number
          handle: string
          id: string
          is_admin: boolean
          is_demo: boolean
          max_clip_seconds: number | null
          onboarded: boolean
          role: Database["public"]["Enums"]["profile_role"]
          suspended: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          ember_balance?: number
          handle: string
          id: string
          is_admin?: boolean
          is_demo?: boolean
          max_clip_seconds?: number | null
          onboarded?: boolean
          role?: Database["public"]["Enums"]["profile_role"]
          suspended?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          ember_balance?: number
          handle?: string
          id?: string
          is_admin?: boolean
          is_demo?: boolean
          max_clip_seconds?: number | null
          onboarded?: boolean
          role?: Database["public"]["Enums"]["profile_role"]
          suspended?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          amount: number
          comment_id: string | null
          created_at: string
          id: string
          is_demo_currency: boolean
          recipient_id: string
          sender_id: string
          video_id: string | null
        }
        Insert: {
          amount: number
          comment_id?: string | null
          created_at?: string
          id?: string
          is_demo_currency?: boolean
          recipient_id: string
          sender_id: string
          video_id?: string | null
        }
        Update: {
          amount?: number
          comment_id?: string | null
          created_at?: string
          id?: string
          is_demo_currency?: boolean
          recipient_id?: string
          sender_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          duration_seconds: number | null
          ember_count: number
          id: string
          like_count: number
          status: Database["public"]["Enums"]["video_status"]
          tags: string[]
          thumbnail_url: string | null
          title: string
          video_asset_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          duration_seconds?: number | null
          ember_count?: number
          id?: string
          like_count?: number
          status?: Database["public"]["Enums"]["video_status"]
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          video_asset_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          duration_seconds?: number | null
          ember_count?: number
          id?: string
          like_count?: number
          status?: Database["public"]["Enums"]["video_status"]
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          video_asset_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_users_summary: { Args: { p_days?: number }; Returns: Json }
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_grant_tip: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      admin_remove_comment: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      admin_remove_video: { Args: { p_video_id: string }; Returns: undefined }
      admin_resolve_clip_request: {
        Args: {
          p_approved_seconds: number
          p_note: string
          p_request_id: string
          p_status: string
        }
        Returns: undefined
      }
      admin_resolve_report: {
        Args: {
          p_report_id: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      admin_set_admin: {
        Args: { p_is_admin: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_beta_mode: { Args: { p_on: boolean }; Returns: undefined }
      admin_set_creator_cap: {
        Args: { p_seconds: number; p_user_id: string }
        Returns: undefined
      }
      admin_set_ember_balance: {
        Args: { p_balance: number; p_user_id: string }
        Returns: number
      }
      admin_set_platform_default: {
        Args: { p_seconds: number }
        Returns: undefined
      }
      admin_set_suspended: {
        Args: { p_suspended: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_uploads_open: { Args: { p_open: boolean }; Returns: undefined }
      admin_user_directory: {
        Args: { p_search?: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          ember_balance: number
          handle: string
          id: string
          is_admin: boolean
          role: Database["public"]["Enums"]["profile_role"]
          suspended: boolean
          video_count: number
        }[]
      }
      advertiser_analytics: { Args: never; Returns: Json }
      advertiser_timeseries: {
        Args: { p_weeks?: number }
        Returns: {
          comments: number
          follows: number
          likes: number
          signups: number
          tips: number
          week_start: string
        }[]
      }
      creator_tip_standing: {
        Args: { p_creator: string }
        Returns: {
          cumulative: number
          rank: number
        }[]
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      dau_series: {
        Args: { p_days?: number }
        Returns: {
          actives: number
          day: string
        }[]
      }
      geo_breakdown: {
        Args: { p_days?: number }
        Returns: {
          actives: number
          country: string
        }[]
      }
      increment_view_count: { Args: { video_id: string }; Returns: undefined }
      invite_code_valid: { Args: { p_code: string }; Returns: boolean }
      platform_analytics: { Args: never; Returns: Json }
      redeem_invite_code: { Args: { p_code: string }; Returns: boolean }
      send_tip: {
        Args: { p_amount: number; p_comment_id?: string; p_video_id?: string }
        Returns: number
      }
      top_creators_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          earned: number
          handle: string
          id: string
        }[]
      }
      top_supporters_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          display_name: string
          handle: string
          id: string
          sent: number
        }[]
      }
      track_event: {
        Args: {
          p_country?: string
          p_event_type: string
          p_path?: string
          p_region?: string
          p_session_id: string
        }
        Returns: undefined
      }
      video_tip_leaderboard: {
        Args: { p_limit?: number; p_video_id: string }
        Returns: {
          display_name: string
          handle: string
          sender_id: string
          total: number
        }[]
      }
    }
    Enums: {
      profile_role: "viewer" | "creator" | "both"
      report_status: "open" | "actioned" | "dismissed"
      report_target: "video" | "comment" | "user"
      video_status: "processing" | "live" | "removed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      profile_role: ["viewer", "creator", "both"],
      report_status: ["open", "actioned", "dismissed"],
      report_target: ["video", "comment", "user"],
      video_status: ["processing", "live", "removed"],
    },
  },
} as const
