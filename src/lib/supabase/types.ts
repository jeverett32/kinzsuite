export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          birthday: string | null;
          species: string | null;
          image_url: string | null;
          art_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          birthday?: string | null;
          species?: string | null;
          image_url?: string | null;
          art_index?: number;
        };
        Update: {
          name?: string;
          birthday?: string | null;
          species?: string | null;
          image_url?: string | null;
          art_index?: number;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          task_name: string;
          reward: string | null;
          assigned_to: "me" | "partner" | "both";
          completed_by: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_name: string;
          reward?: string | null;
          assigned_to?: "me" | "partner" | "both";
          completed_by?: string | null;
          completed_at?: string | null;
          sort_order?: number;
        };
        Update: {
          task_name?: string;
          reward?: string | null;
          assigned_to?: "me" | "partner" | "both";
          completed_by?: string | null;
          completed_at?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          content: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          content?: string | null;
          image_url?: string | null;
        };
        Update: {
          content?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Pet = Database["public"]["Tables"]["pets"]["Row"];
export type DailyTask = Database["public"]["Tables"]["daily_tasks"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
