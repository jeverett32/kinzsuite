export type AccentColor = "sky" | "blush" | "sun" | "grass" | "purple";

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          created_by?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
          sort_order: number;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: "owner" | "member";
          joined_at?: string;
          sort_order?: number;
        };
        Update: {
          role?: "owner" | "member";
          sort_order?: number;
        };
        Relationships: [];
      };
      group_invites: {
        Row: {
          code: string;
          group_id: string;
          created_by: string;
          expires_at: string | null;
          revoked_at: string | null;
          uses_remaining: number | null;
          created_at: string;
        };
        Insert: {
          code?: string;
          group_id: string;
          created_by: string;
          expires_at?: string | null;
          revoked_at?: string | null;
          uses_remaining?: number | null;
          created_at?: string;
        };
        Update: {
          group_id?: string;
          created_by?: string;
          expires_at?: string | null;
          revoked_at?: string | null;
          uses_remaining?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          accent_color: AccentColor;
          avatar_emoji: string;
          total_points: number;
          chat_last_read_at: string | null;
          active_group_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: AccentColor;
          avatar_emoji?: string;
          total_points?: number;
          chat_last_read_at?: string | null;
          active_group_id?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: AccentColor;
          avatar_emoji?: string;
          total_points?: number;
          chat_last_read_at?: string | null;
          active_group_id?: string | null;
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
          gender: string | null;
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
          gender?: string | null;
          image_url?: string | null;
          art_index?: number;
        };
        Update: {
          name?: string;
          birthday?: string | null;
          species?: string | null;
          gender?: string | null;
          image_url?: string | null;
          art_index?: number;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          task_name: string;
          points: number;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          task_name: string;
          points?: number;
          completed_at?: string | null;
          sort_order?: number;
        };
        Update: {
          group_id?: string | null;
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
          group_id: string | null;
          tag: string;
          title: string;
          detail: string;
          accent: AccentColor;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          tag: string;
          title: string;
          detail: string;
          accent: AccentColor;
          sort_order?: number;
        };
        Update: {
          group_id?: string | null;
          tag?: string;
          title?: string;
          detail?: string;
          accent?: AccentColor;
          sort_order?: number;
        };
        Relationships: [];
      };
      date_wheel_pick: {
        Row: {
          id: number;
          accepted_quest_id: string | null;
          group_id: string | null;
          updated_at: string;
        };
        Insert: {
          id: number;
          accepted_quest_id?: string | null;
          group_id?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_quest_id?: string | null;
          group_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          group_id: string | null;
          content: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          group_id?: string | null;
          content?: string | null;
          image_url?: string | null;
        };
        Update: {
          group_id?: string | null;
          content?: string | null;
          image_url?: string | null;
        };
        Relationships: [];
      };
      message_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          emoji: string;
        };
        Update: {
          emoji?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: {
          user_id?: string;
          p256dh?: string;
          auth?: string;
        };
        Relationships: [];
      };
      chat_last_read: {
        Row: {
          user_id: string;
          group_id: string | null;
          last_read_at: string;
        };
        Insert: {
          user_id: string;
          group_id?: string | null;
          last_read_at?: string;
        };
        Update: {
          group_id?: string | null;
          last_read_at?: string;
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
      current_active_group: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_group_member: {
        Args: { gid: string };
        Returns: boolean;
      };
      get_group_members: {
        Args: { gid: string };
        Returns: {
          user_id: string;
          role: "owner" | "member";
          sort_order: number;
          joined_at: string;
        }[];
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_group: {
        Args: { p_name: string };
        Returns: {
          group_id: string;
          invite_code: string;
        }[];
      };
      join_group_by_code: {
        Args: { p_code: string };
        Returns: string;
      };
      leave_group: {
        Args: { p_group_id: string };
        Returns: string | null;
      };
      delete_group: {
        Args: { p_group_id: string };
        Returns: undefined;
      };
      get_or_create_group_invite: {
        Args: { p_group_id: string };
        Returns: string;
      };
      backfill_legacy_group: {
        Args: {
          p_group_name: string;
          p_owner_user_id: string;
          p_member_user_ids: string[];
        };
        Returns: string;
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
export type MessageReaction = Database["public"]["Tables"]["message_reactions"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WheelQuest = Database["public"]["Tables"]["wheel_quests"]["Row"];
export type DateWheelPick = Database["public"]["Tables"]["date_wheel_pick"]["Row"];
