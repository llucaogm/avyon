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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agua_logs: {
        Row: {
          created_at: string
          data: string
          id: string
          ml: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          ml: number
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          ml?: number
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          limite_alerta_percentual: number
          renda_liquida_override: number | null
          saldo_atual_conta: number
          saldo_atual_em: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          limite_alerta_percentual?: number
          renda_liquida_override?: number | null
          saldo_atual_conta?: number
          saldo_atual_em?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          limite_alerta_percentual?: number
          renda_liquida_override?: number | null
          saldo_atual_conta?: number
          saldo_atual_em?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          cor: string
          created_at: string
          id: string
          is_active: boolean
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["categoria_tipo"]
          user_id: string
        }
        Insert: {
          cor: string
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
          ordem?: number
          tipo: Database["public"]["Enums"]["categoria_tipo"]
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["categoria_tipo"]
          user_id?: string
        }
        Relationships: []
      }
      category_month_status: {
        Row: {
          category_id: string
          created_at: string
          id: string
          observacao: string | null
          pago: boolean
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          pago?: boolean
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          pago?: boolean
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_month_status_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_fund_config: {
        Row: {
          created_at: string
          gastos_mensais_essenciais: number
          meses_reserva_desejados: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gastos_mensais_essenciais?: number
          meses_reserva_desejados?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gastos_mensais_essenciais?: number
          meses_reserva_desejados?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_fund_contributions: {
        Row: {
          aporte: number
          created_at: string
          id: string
          mes: string
          observacao: string | null
          user_id: string
        }
        Insert: {
          aporte: number
          created_at?: string
          id?: string
          mes: string
          observacao?: string | null
          user_id: string
        }
        Update: {
          aporte?: number
          created_at?: string
          id?: string
          mes?: string
          observacao?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          categoria_id: string | null
          charge_date: string | null
          created_at: string
          due_month: number | null
          end_date: string | null
          frequencia: Database["public"]["Enums"]["expense_frequency"]
          grupo: Database["public"]["Enums"]["category_group"]
          id: string
          is_active: boolean
          nome: string
          observacao: string | null
          updated_at: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          categoria_id?: string | null
          charge_date?: string | null
          created_at?: string
          due_month?: number | null
          end_date?: string | null
          frequencia?: Database["public"]["Enums"]["expense_frequency"]
          grupo: Database["public"]["Enums"]["category_group"]
          id?: string
          is_active?: boolean
          nome: string
          observacao?: string | null
          updated_at?: string
          user_id: string
          valor_mensal?: number
        }
        Update: {
          categoria_id?: string | null
          charge_date?: string | null
          created_at?: string
          due_month?: number | null
          end_date?: string | null
          frequencia?: Database["public"]["Enums"]["expense_frequency"]
          grupo?: Database["public"]["Enums"]["category_group"]
          id?: string
          is_active?: boolean
          nome?: string
          observacao?: string | null
          updated_at?: string
          user_id?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          created_at: string
          data: string
          goal_id: string
          id: string
          observacao: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          goal_id: string
          id?: string
          observacao?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          goal_id?: string
          id?: string
          observacao?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          nome: string
          prazo_meses: number
          status: string
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          prazo_meses: number
          status?: string
          updated_at?: string
          user_id: string
          valor_total: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          prazo_meses?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          data: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habitos_config: {
        Row: {
          created_at: string
          meta_agua_ml: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          meta_agua_ml?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          meta_agua_ml?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          created_at: string
          dias_semana: number[] | null
          frequencia_tipo: Database["public"]["Enums"]["habit_frequency"]
          icone: string | null
          id: string
          is_active: boolean
          nome: string
          ordem: number
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_semana?: number[] | null
          frequencia_tipo?: Database["public"]["Enums"]["habit_frequency"]
          icone?: string | null
          id?: string
          is_active?: boolean
          nome: string
          ordem?: number
          user_id: string
        }
        Update: {
          created_at?: string
          dias_semana?: number[] | null
          frequencia_tipo?: Database["public"]["Enums"]["habit_frequency"]
          icone?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          ordem?: number
          user_id?: string
        }
        Relationships: []
      }
      income_categories: {
        Row: {
          categoria_id: string | null
          created_at: string
          id: string
          is_active: boolean
          nome: string
          observacao: string | null
          recorrencia: Database["public"]["Enums"]["income_recurrence"]
          updated_at: string
          user_id: string
          valor_mensal: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
          observacao?: string | null
          recorrencia?: Database["public"]["Enums"]["income_recurrence"]
          updated_at?: string
          user_id: string
          valor_mensal?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
          observacao?: string | null
          recorrencia?: Database["public"]["Enums"]["income_recurrence"]
          updated_at?: string
          user_id?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "income_categories_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      peso_logs: {
        Row: {
          created_at: string
          data: string
          id: string
          peso_kg: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          peso_kg: number
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          peso_kg?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria_id: string | null
          created_at: string
          data: string
          descricao: string
          expense_category_id: string | null
          forma_pagamento: string | null
          id: string
          income_category_id: string | null
          observacao: string | null
          updated_at: string
          user_id: string
          valor_entrada: number
          valor_saida: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao: string
          expense_category_id?: string | null
          forma_pagamento?: string | null
          id?: string
          income_category_id?: string | null
          observacao?: string | null
          updated_at?: string
          user_id: string
          valor_entrada?: number
          valor_saida?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          expense_category_id?: string | null
          forma_pagamento?: string | null
          id?: string
          income_category_id?: string | null
          observacao?: string | null
          updated_at?: string
          user_id?: string
          valor_entrada?: number
          valor_saida?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_income_category_id_fkey"
            columns: ["income_category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_tipo: "despesa" | "receita"
      category_group: "fixo" | "variavel" | "objetivo" | "reserva"
      expense_frequency: "mensal" | "anual" | "semestral" | "unico"
      habit_frequency: "diaria" | "dias_da_semana"
      income_recurrence: "mensal" | "anual" | "semestral" | "eventual"
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
      categoria_tipo: ["despesa", "receita"],
      category_group: ["fixo", "variavel", "objetivo", "reserva"],
      expense_frequency: ["mensal", "anual", "semestral", "unico"],
      habit_frequency: ["diaria", "dias_da_semana"],
      income_recurrence: ["mensal", "anual", "semestral", "eventual"],
    },
  },
} as const
