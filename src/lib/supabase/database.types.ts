export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string | null; role: Database["public"]["Enums"]["account_role"]; created_at: string; updated_at: string }>;
      human_entries: Table<Record<string, Json | undefined>>;
      submissions: Table<{
        id: string; user_id: string; intent: string | null; artifact_type: string | null; identity_mode: string | null;
        public_name: string | null; anonymous: boolean; location: string | null; headline: string | null; story: string | null;
        what_they_need: string[] | null; need_category: string | null; status: string; created_at: string; updated_at: string; submitted_at: string | null;
      }>;
      submission_media: Table<Record<string, Json | undefined>>;
      social_discovery_posts: Table<Record<string, Json | undefined>>;
      moderation_flags: Table<Record<string, Json | undefined>>;
      consent_records: Table<Record<string, Json | undefined>>;
      removal_requests: Table<Record<string, Json | undefined>>;
      partner_referrals: Table<Record<string, Json | undefined>>;
      social_creator_consent_tokens: Table<Record<string, Json | undefined>>;
      social_creator_consent_records: Table<Record<string, Json | undefined>>;
    };
    Views: {
      human_entries_public: {
        Row: {
          id: string | null;
          slug: string | null;
          type: Database["public"]["Enums"]["human_entry_type"] | null;
          source: Database["public"]["Enums"]["human_entry_source"] | null;
          public_name: string | null;
          first_name: string | null;
          age: number | null;
          display_location: string | null;
          anonymous: boolean | null;
          thumbnail: Json | null;
          media: Json | null;
          headline: string | null;
          quote: string | null;
          story: string | null;
          featured: boolean | null;
          layout: Json | null;
          source_platform: string | null;
          source_url: string | null;
          created_at: string | null;
          published_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_account_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["account_role"] };
      is_staff: { Args: { allowed?: Database["public"]["Enums"]["account_role"][] }; Returns: boolean };
      publish_submission: { Args: { p_submission_id: string; p_slug: string; p_thumbnail: Json; p_media?: Json; p_type?: Database["public"]["Enums"]["human_entry_type"]; p_layout?: Json }; Returns: string };
      revoke_owned_submission_consent: { Args: { p_submission_id: string }; Returns: string[] };
    };
    Enums: {
      account_role: "user" | "moderator" | "editor" | "admin";
      human_entry_type: "portrait" | "story" | "note" | "video" | "audio" | "object" | "place" | "quote";
      human_entry_source: "direct" | "editorial" | "social";
    };
    CompositeTypes: Record<PropertyKey, never>;
  };
};
