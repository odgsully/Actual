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
      collaborators: {
        Row: {
          accepted_at: string | null
          collection_id: string
          id: string
          invited_at: string | null
          role: Database["public"]["Enums"]["collaborator_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          collection_id: string
          id?: string
          invited_at?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          collection_id?: string
          id?: string
          invited_at?: string | null
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborators_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      collections: {
        Row: {
          agent_optimization_level: Database["public"]["Enums"]["agent_optimization_level"]
          branch_carry_over: Json | null
          collaboration_mode: string
          created_at: string | null
          current_window: number
          description: string | null
          folder_id: string | null
          id: string
          output_type: Database["public"]["Enums"]["output_type"]
          owner_id: string
          parent_collection_id: string | null
          quaternary_labels: Json | null
          ranking_mode: Database["public"]["Enums"]["ranking_mode"]
          ravg_formula: string
          ravg_member_weights: Json
          supervisor_weight: number
          title: string
          updated_at: string | null
          wab_type: Database["public"]["Enums"]["wab_type"]
          window_duration: unknown
        }
        Insert: {
          agent_optimization_level?: Database["public"]["Enums"]["agent_optimization_level"]
          branch_carry_over?: Json | null
          collaboration_mode?: string
          created_at?: string | null
          current_window?: number
          description?: string | null
          folder_id?: string | null
          id?: string
          output_type?: Database["public"]["Enums"]["output_type"]
          owner_id: string
          parent_collection_id?: string | null
          quaternary_labels?: Json | null
          ranking_mode?: Database["public"]["Enums"]["ranking_mode"]
          ravg_formula?: string
          ravg_member_weights?: Json
          supervisor_weight?: number
          title: string
          updated_at?: string | null
          wab_type?: Database["public"]["Enums"]["wab_type"]
          window_duration?: unknown
        }
        Update: {
          agent_optimization_level?: Database["public"]["Enums"]["agent_optimization_level"]
          branch_carry_over?: Json | null
          collaboration_mode?: string
          created_at?: string | null
          current_window?: number
          description?: string | null
          folder_id?: string | null
          id?: string
          output_type?: Database["public"]["Enums"]["output_type"]
          owner_id?: string
          parent_collection_id?: string | null
          quaternary_labels?: Json | null
          ranking_mode?: Database["public"]["Enums"]["ranking_mode"]
          ravg_formula?: string
          ravg_member_weights?: Json
          supervisor_weight?: number
          title?: string
          updated_at?: string | null
          wab_type?: Database["public"]["Enums"]["wab_type"]
          window_duration?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "collections_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_parent_collection_id_fkey"
            columns: ["parent_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_parent_collection_id_fkey"
            columns: ["parent_collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rankings: {
        Row: {
          choice: string | null
          collection_id: string
          created_at: string | null
          id: string
          record_id: string
          score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          choice?: string | null
          collection_id: string
          created_at?: string | null
          id?: string
          record_id: string
          score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          choice?: string | null
          collection_id?: string
          created_at?: string | null
          id?: string
          record_id?: string
          score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rankings_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "rankings_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "collection_leaderboard"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "rankings_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "record_choices"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "rankings_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "record_scores"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "rankings_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          collection_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json
          sort_order: number | null
          title: string
          window_number: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          sort_order?: number | null
          title: string
          window_number?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          sort_order?: number | null
          title?: string
          window_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
    }
    Views: {
      collection_leaderboard: {
        Row: {
          avg_score: number | null
          collection_id: string | null
          position: number | null
          rank_count: number | null
          record_id: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      record_choices: {
        Row: {
          choice_a: number | null
          choice_b: number | null
          choice_c: number | null
          choice_d: number | null
          choice_no: number | null
          choice_yes: number | null
          collection_id: string | null
          record_id: string | null
          total_votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      record_scores: {
        Row: {
          avg_score: number | null
          collection_id: string | null
          max_score: number | null
          min_score: number | null
          rank_count: number | null
          record_id: string | null
          stddev_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_progress"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      user_progress: {
        Row: {
          collection_id: string | null
          collection_title: string | null
          completion_pct: number | null
          ranked_records: number | null
          total_records: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_optimization_level: "none" | "low" | "medium" | "high"
      collaborator_role: "owner" | "contributor" | "viewer"
      output_type: "image" | "video" | "text" | "3d" | "audio" | "deck"
      ranking_mode: "one_axis" | "two_axis" | "quaternary" | "binary"
      wab_type: "standard" | "vetted_ref"
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
      agent_optimization_level: ["none", "low", "medium", "high"],
      collaborator_role: ["owner", "contributor", "viewer"],
      output_type: ["image", "video", "text", "3d", "audio", "deck"],
      ranking_mode: ["one_axis", "two_axis", "quaternary", "binary"],
      wab_type: ["standard", "vetted_ref"],
    },
  },
} as const
