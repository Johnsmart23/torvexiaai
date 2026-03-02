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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      investment_plans: {
        Row: {
          created_at: string
          daily_rate: number
          duration_days: number
          id: string
          is_active: boolean
          max_deposit: number | null
          min_deposit: number
          name: string
          referral_bonus: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate: number
          duration_days?: number
          id?: string
          is_active?: boolean
          max_deposit?: number | null
          min_deposit?: number
          name: string
          referral_bonus?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          max_deposit?: number | null
          min_deposit?: number
          name?: string
          referral_bonus?: number
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          daily_rate: number
          days_completed: number
          duration_days: number
          ends_at: string
          id: string
          plan_name: string
          started_at: string
          status: Database["public"]["Enums"]["investment_status"]
          total_profit_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          daily_rate: number
          days_completed?: number
          duration_days?: number
          ends_at?: string
          id?: string
          plan_name: string
          started_at?: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_profit_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          daily_rate?: number
          days_completed?: number
          duration_days?: number
          ends_at?: string
          id?: string
          plan_name?: string
          started_at?: string
          status?: Database["public"]["Enums"]["investment_status"]
          total_profit_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean
          is_suspended: boolean
          kyc_status: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_suspended?: boolean
          kyc_status?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_suspended?: boolean
          kyc_status?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          admin_note: string | null
          amount: number
          approved_by: string | null
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Insert: {
          admin_note?: string | null
          amount: number
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Update: {
          admin_note?: string | null
          amount?: number
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          wallet_type?: Database["public"]["Enums"]["wallet_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_type?: Database["public"]["Enums"]["wallet_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_deposit: {
        Args: { p_admin_id: string; p_transaction_id: string }
        Returns: Json
      }
      approve_withdrawal: {
        Args: { p_admin_id: string; p_transaction_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_investment: {
        Args: {
          p_amount: number
          p_daily_rate: number
          p_duration_days: number
          p_plan_name: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      investment_status: "active" | "completed" | "cancelled"
      transaction_status: "pending" | "completed" | "rejected" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "investment"
        | "profit"
        | "referral_bonus"
        | "capital_return"
        | "transfer"
      wallet_type:
        | "deposit"
        | "active_investment"
        | "profit"
        | "referral"
        | "withdrawable"
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
      app_role: ["admin", "moderator", "user"],
      investment_status: ["active", "completed", "cancelled"],
      transaction_status: ["pending", "completed", "rejected", "cancelled"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "investment",
        "profit",
        "referral_bonus",
        "capital_return",
        "transfer",
      ],
      wallet_type: [
        "deposit",
        "active_investment",
        "profit",
        "referral",
        "withdrawable",
      ],
    },
  },
} as const
