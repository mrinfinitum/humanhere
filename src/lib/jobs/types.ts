export type BackgroundJobName =
  | "social_ingestion" | "thumbnail_generation" | "transcription" | "moderation_prescreen"
  | "duplicate_detection" | "email_notification" | "creator_contact" | "public_media_cleanup";

export type BackgroundJob<TPayload = Record<string, unknown>> = {
  name: BackgroundJobName;
  payload: TPayload;
  idempotencyKey: string;
  requestedAt: string;
};

/** Launch implementations may execute through Vercel Cron, a protected server
 * workflow, or a Supabase Edge Function. Public render paths never call this. */
export interface BackgroundJobDispatcher {
  dispatch<TPayload>(job: BackgroundJob<TPayload>): Promise<void>;
}
