export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      creators: {
        Row: {
          consent_given: boolean
          created_at: string
          follower_count: number | null
          id: string
          instagram_handle: string | null
          phone: string
        }
        Insert: {
          consent_given?: boolean
          created_at?: string
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          phone: string
        }
        Update: {
          consent_given?: boolean
          created_at?: string
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          phone?: string
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          phone: string | null
          session_id: string | null
          step: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          phone?: string | null
          session_id?: string | null
          step: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          phone?: string | null
          session_id?: string | null
          step?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paise: number | null
          created_at: string
          creator_id: string | null
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
        }
        Insert: {
          amount_paise?: number | null
          created_at?: string
          creator_id?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number | null
          created_at?: string
          creator_id?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      otps: {
        Row: {
          id: string
          phone: string
          otp: string
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          otp: string
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          otp?: string
          created_at?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: string
          creator_id: string | null
          storage_path: string
          processing_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id?: string | null
          storage_path: string
          processing_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string | null
          storage_path?: string
          processing_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          }
        ]
      }
      detected_items: {
        Row: {
          id: string
          upload_id: string | null
          category: string
          name: string
          primary_color: string | null
          secondary_color: string | null
          pattern: string | null
          material_guess: string | null
          fit_or_style: string | null
          gender_presentation: string | null
          search_query: string
          confidence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          upload_id?: string | null
          category: string
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          pattern?: string | null
          material_guess?: string | null
          fit_or_style?: string | null
          gender_presentation?: string | null
          search_query: string
          confidence?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string | null
          category?: string
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          pattern?: string | null
          material_guess?: string | null
          fit_or_style?: string | null
          gender_presentation?: string | null
          search_query?: string
          confidence?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_items_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          }
        ]
      }
      affiliate_links: {
        Row: {
          id: string
          detected_item_id: string | null
          original_url: string
          short_code: string
          created_at: string
        }
        Insert: {
          id?: string
          detected_item_id?: string | null
          original_url: string
          short_code: string
          created_at?: string
        }
        Update: {
          id?: string
          detected_item_id?: string | null
          original_url?: string
          short_code?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_detected_item_id_fkey"
            columns: ["detected_item_id"]
            isOneToOne: false
            referencedRelation: "detected_items"
            referencedColumns: ["id"]
          }
        ]
      }
      clicks: {
        Row: {
          id: string
          link_id: string | null
          referrer: string | null
          user_agent: string | null
          hashed_ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          hashed_ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          hashed_ip?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          }
        ]
      }
      commission_rates: {
        Row: {
          id: string
          category: string
          rate_percent: number
          source_url: string | null
          verified_on: string
        }
        Insert: {
          id?: string
          category: string
          rate_percent: number
          source_url?: string | null
          verified_on?: string
        }
        Update: {
          id?: string
          category?: string
          rate_percent?: number
          source_url?: string | null
          verified_on?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
