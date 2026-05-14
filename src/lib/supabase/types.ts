export type AccentColor = "sky" | "blush" | "sun" | "grass" | "purple";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          accent_color: AccentColor;
          avatar_emoji: string;
          total_points: number;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: AccentColor;
          avatar_emoji?: string;
          total_points?: number;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: AccentColor;
          avatar_emoji?: string;
          total_points?: number;
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
          user_id: string;
          task_name: string;
          points: number;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_name: string;
          points?: number;
          completed_at?: string | null;
          sort_order?: number;
        };
        Update: {
          task_name?: string;
          points?: number;
          completed_at?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      daily_log: {
        Row: {
          user_id: string;
          log_date: string;
          tasks_completed: number;
          points_earned: number;
        };
        Insert: {
          user_id: string;
          log_date: string;
          tasks_completed?: number;
          points_earned?: number;
        };
        Update: {
          tasks_completed?: number;
          points_earned?: number;
        };
        Relationships: [];
      };
      wheel_quests: {
        Row: {
          id: string;
          tag: string;
          title: string;
          detail: string;
          accent: AccentColor;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tag: string;
          title: string;
          detail: string;
          accent: AccentColor;
          sort_order?: number;
        };
        Update: {
          tag?: string;
          title?: string;
          detail?: string;
          accent?: AccentColor;
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
    Functions: {
      toggle_daily_task: {
        Args: { task_id: string };
        Returns: void;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Pet = Database["public"]["Tables"]["pets"]["Row"];
export type DailyTask = Database["public"]["Tables"]["daily_tasks"]["Row"];
export type DailyLog = Database["public"]["Tables"]["daily_log"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WheelQuest = Database["public"]["Tables"]["wheel_quests"]["Row"];
