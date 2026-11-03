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
      profiles: Table<{ id: string; display_name: string | null; role: Database["public"]["Enums"]["account_role"]; notes_suspended_at: string | null; notes_suspension_reason: string | null; notes_suspended_by: string | null; terms_accepted_at: string | null; terms_version: string | null; username: string | null; bio: string | null; allow_social_reuse: boolean; avatar_path: string | null; created_at: string; updated_at: string }>;
      human_entries: Table<Record<string, Json | undefined>>;
      submissions: Table<{
        id: string; user_id: string; intent: string | null; artifact_type: string | null; identity_mode: string | null;
        public_name: string | null; anonymous: boolean; location: string | null; headline: string | null; story: string | null;
        what_they_need: string[] | null; need_category: string | null; is_minor: boolean; guardian_consent_verified: boolean;
        location_withheld: boolean; media_withheld: boolean; requested_publish_after: string | null; allow_private_notes: boolean;
        status: string; created_at: string; updated_at: string; submitted_at: string | null;
      }>;
      submission_media: Table<Record<string, Json | undefined>>;
      social_discovery_posts: Table<Record<string, Json | undefined>>;
      moderation_flags: Table<Record<string, Json | undefined>>;
      consent_records: Table<Record<string, Json | undefined>>;
      removal_requests: Table<Record<string, Json | undefined>>;
      partner_referrals: Table<Record<string, Json | undefined>>;
      social_creator_consent_tokens: Table<Record<string, Json | undefined>>;
      social_creator_consent_records: Table<Record<string, Json | undefined>>;
      human_entry_loves: Table<Record<string, Json | undefined>>;
      human_entry_share_events: Table<Record<string, Json | undefined>>;
      human_entry_notes: Table<Record<string, Json | undefined>>;
      help_feature_flags: Table<Record<string, Json | undefined>>;
      help_staff_memberships: Table<Record<string, Json | undefined>>;
      help_partners: Table<Record<string, Json | undefined>>;
      help_partner_memberships: Table<Record<string, Json | undefined>>;
      fulfillment_profiles: Table<Record<string, Json | undefined>>;
      help_consent_records: Table<Record<string, Json | undefined>>;
      human_needs: Table<Record<string, Json | undefined>>;
      human_need_partner_assignments: Table<Record<string, Json | undefined>>;
      fulfillment_orders: Table<Record<string, Json | undefined>>;
      sensitive_access_events: Table<Record<string, Json | undefined>>;
      follows: Table<{ follower_id: string; followee_id: string; created_at: string }>;
      content_reports: Table<{ id: string; human_entry_id: string; reporter_id: string | null; reason: Database["public"]["Enums"]["report_reason"]; details: string | null; created_at: string; resolved_at: string | null; resolved_by: string | null; resolution: "removed" | "dismissed" | null }>;
      member_gifts: Table<{ id: string; user_id: string | null; provider: string; provider_reference: string; status: "succeeded" | "refunded"; created_at: string; updated_at: string }>;
    };
    Views: {
      human_entries_public: {
        Row: {
          id: string | null;
          slug: string | null;
          type: Database["public"]["Enums"]["human_entry_type"] | null;
          source: Database["public"]["Enums"]["human_entry_source"] | null;
          first_name: string | null;
          display_location: string | null;
          anonymous: boolean | null;
          thumbnail: Json | null;
          media: Json | null;
          headline: string | null;
          quote: string | null;
          story: string | null;
          featured: boolean | null;
          layout: Json | null;
          love_count: number | null;
          allow_private_notes: boolean | null;
          social_image_allowed: boolean | null;
          created_at: string | null;
          published_at: string | null;
          public_latitude: number | null;
          public_longitude: number | null;
          public_location_precision: Database["public"]["Enums"]["human_public_location_precision"] | null;
          author_username: string | null;
        };
        Relationships: [];
      };
      human_needs_public: {
        Row: {
          id: string | null;
          human_entry_id: string | null;
          need_type: Database["public"]["Enums"]["help_need_type"] | null;
          public_title: string | null;
          public_description: string | null;
          quantity_needed: number | null;
          quantity_fulfilled: number | null;
          public_status: "needed" | "in_progress" | "fulfilled" | null;
          created_at: string | null;
          updated_at: string | null;
          fulfilled_at: string | null;
        };
        Relationships: [];
      };
      help_partners_public: {
        Row: Record<string, Json | undefined>;
        Relationships: [];
      };
    };
    Functions: {
      ensure_profile: { Args: { p_display_name?: string }; Returns: string };
      accept_terms: { Args: { p_version: string }; Returns: string };
      my_experience: { Args: Record<PropertyKey, never>; Returns: Array<{ loves: number; notes: number; gifts: number }> };
      claim_username: { Args: { p_username: string }; Returns: string };
      member_profile: { Args: { p_username: string }; Returns: Array<{ username: string; display_name: string | null; bio: string | null; joined_at: string; followers: number; following: number; viewer_follows: boolean; is_self: boolean; loves: number; notes: number; gifts: number; avatar_path: string | null }> };
      member_follow_list: { Args: { p_username: string; p_direction: "followers" | "following"; p_limit?: number; p_before?: string }; Returns: Array<{ username: string; display_name: string | null; avatar_path: string | null; followed_at: string; viewer_follows: boolean; is_self: boolean }> };
      follow_member: { Args: { p_username: string }; Returns: boolean };
      search_members: { Args: { p_query: string; p_limit?: number }; Returns: Array<{ username: string; display_name: string | null; bio: string | null; followers: number; avatar_path: string | null }> };
      unfollow_member: { Args: { p_username: string }; Returns: boolean };
      following_feed: { Args: { p_limit?: number; p_before?: string }; Returns: Array<Database["public"]["Views"]["human_entries_public"]["Row"]> };
      report_content: { Args: { p_human_entry_id: string; p_reason: Database["public"]["Enums"]["report_reason"]; p_details?: string }; Returns: string };
      current_account_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["account_role"] };
      is_staff: { Args: { allowed?: Database["public"]["Enums"]["account_role"][] }; Returns: boolean };
      publish_submission: { Args: { p_submission_id: string; p_slug: string; p_thumbnail: Json; p_media?: Json; p_type?: Database["public"]["Enums"]["human_entry_type"]; p_layout?: Json; p_sensitive_story?: boolean }; Returns: string };
      publish_submission_with_location: { Args: { p_submission_id: string; p_slug: string; p_thumbnail: Json; p_media?: Json; p_type?: Database["public"]["Enums"]["human_entry_type"]; p_layout?: Json; p_sensitive_story?: boolean; p_public_latitude?: number; p_public_longitude?: number; p_public_location_precision?: Database["public"]["Enums"]["human_public_location_precision"] }; Returns: string };
      set_human_entry_public_location: { Args: { p_human_entry_id: string; p_latitude?: number; p_longitude?: number; p_precision?: Database["public"]["Enums"]["human_public_location_precision"] }; Returns: string };
      revoke_owned_submission_consent: { Args: { p_submission_id: string }; Returns: string[] };
      withdraw_owned_submission: { Args: { p_submission_id: string }; Returns: string[] };
      delete_owned_submission: { Args: { p_submission_id: string }; Returns: Json };
      unpublish_human_entry: { Args: { p_human_entry_id: string }; Returns: string };
      issue_social_creator_consent_token: { Args: { p_social_discovery_post_id: string; p_expires_in?: string }; Returns: string };
      accept_social_creator_consent: { Args: { p_token: string; p_publish_story: boolean; p_publish_media: boolean; p_social_reuse: boolean; p_creator_name: string; p_creator_email: string }; Returns: string };
      revoke_social_creator_consent: { Args: { p_social_discovery_post_id: string }; Returns: string[] };
      submit_private_note: { Args: { p_human_entry_id: string; p_body: string }; Returns: string };
      notes_for_me: { Args: { p_limit?: number; p_before_created_at?: string; p_before_id?: string }; Returns: Array<{ note_id: string; human_entry_id: string; story_slug: string; recipient_first_name: string | null; body: string; created_at: string; read_at: string | null }> };
      mark_private_note_read: { Args: { p_note_id: string }; Returns: boolean };
      hide_private_note: { Args: { p_note_id: string }; Returns: boolean };
      report_private_note: { Args: { p_note_id: string }; Returns: boolean };
      is_show_up_enabled: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_help_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_help_partner_member: { Args: { p_partner_id: string }; Returns: boolean };
      owns_help_human_entry: { Args: { p_human_entry_id: string }; Returns: boolean };
      is_public_help_human_entry: { Args: { p_human_entry_id: string }; Returns: boolean };
      my_human_needs: { Args: Record<PropertyKey, never>; Returns: Array<Record<string, Json | undefined>> };
      get_fulfillment_profile_for_help: { Args: { p_user_id: string }; Returns: Array<Record<string, Json | undefined>> };
      get_private_human_need_for_help: { Args: { p_human_need_id: string }; Returns: Array<Record<string, Json | undefined>> };
      revoke_my_help_consent: { Args: { p_consent_id: string }; Returns: boolean };
      review_help_need: { Args: { p_human_need_id: string; p_status: string; p_verification_status: string; p_publicly_visible?: boolean }; Returns: boolean };
      assign_help_partner: { Args: { p_human_need_id: string; p_partner_id: string; p_internal_notes?: string }; Returns: string };
      create_help_fulfillment_order: { Args: { p_human_need_id: string; p_partner_id: string | null; p_provider: string; p_fulfillment_type: Database["public"]["Enums"]["help_fulfillment_type"]; p_amount_cents?: number | null; p_currency?: string | null }; Returns: string };
    };
    Enums: {
      account_role: "user" | "moderator" | "editor" | "admin";
      human_entry_type: "portrait" | "story" | "note" | "video" | "audio" | "object" | "place" | "quote";
      human_entry_source: "direct" | "editorial" | "social";
      human_public_location_precision: "city" | "region" | "country";
      help_need_type: "groceries" | "clothing" | "household" | "transportation" | "utilities" | "school" | "baby" | "employment" | "medical_nonclinical" | "housing" | "other";
      report_reason: "harassment" | "hate" | "private_information" | "sexual_content" | "violence" | "self_harm" | "minor_safety" | "spam" | "impersonation" | "other";
      help_fulfillment_type: "goods" | "grocery" | "voucher" | "partner_service" | "other";
    };
    CompositeTypes: Record<PropertyKey, never>;
  };
};
