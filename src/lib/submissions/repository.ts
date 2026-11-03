import "server-only";

import type { SubmissionDraft, SubmissionRepository, SubmissionStatus } from "./types";
import { createDatabaseClient } from "@/lib/neon/server";

/** A member hit one of the posting limits; the message is safe to show them. */
export class LimitError extends Error {}

const OWNED_COLUMNS = "id,user_id,intent,artifact_type,identity_mode,public_name,anonymous,location,headline,story,what_they_need,need_category,status,created_at,updated_at,submitted_at";

type SubmissionRow = {
  id: string; user_id: string; intent: SubmissionDraft["intent"] | null; artifact_type: SubmissionDraft["artifactType"] | null;
  identity_mode: SubmissionDraft["identityMode"] | null; public_name: string | null; anonymous: boolean; location: string | null;
  headline: string | null; story: string | null; what_they_need: string[] | null; need_category: SubmissionDraft["needCategory"] | null;
  status: SubmissionStatus; created_at: string; updated_at: string; submitted_at: string | null;
};

function mapSubmission(row: SubmissionRow): SubmissionDraft {
  return {
    id: row.id, userId: row.user_id, intent: row.intent ?? undefined, artifactType: row.artifact_type ?? undefined,
    identityMode: row.identity_mode ?? undefined, publicName: row.public_name ?? undefined, anonymous: row.anonymous,
    location: row.location ?? undefined, headline: row.headline ?? undefined, story: row.story ?? undefined,
    whatWouldHelp: row.what_they_need?.[0] as SubmissionDraft["whatWouldHelp"] | undefined,
    needCategory: row.need_category ?? undefined, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
    submittedAt: row.submitted_at ?? undefined,
  };
}

class NeonSubmissionRepository implements SubmissionRepository {
  async createDraft(userId: string, intent?: SubmissionDraft["intent"]) {
    const client = await createDatabaseClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await client.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
    if (countError) throw new Error(`Could not verify draft limit: ${countError.code}`);
    if ((count ?? 0) >= 10) throw new LimitError("You have started a lot of drafts recently. Please continue an existing draft.");
    // `status` is intentionally omitted. Authenticated users are not granted
    // direct INSERT access to that workflow column; the database default and
    // RLS policy establish every new submission as a draft.
    const { data, error } = await client.from("submissions").insert({ user_id: userId, intent: intent ?? null }).select(OWNED_COLUMNS).single();
    if (error?.message === "draft limit reached") throw new LimitError("You have started a lot of drafts recently. Please continue an existing draft.");
    if (error) throw new Error(`Could not create draft: ${error.code}`);
    return mapSubmission(data as unknown as SubmissionRow);
  }

  async listOwned(userId: string) {
    const client = await createDatabaseClient();
    const { data, error } = await client.from("submissions").select(OWNED_COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(40);
    if (error) throw new Error(`Could not list submissions: ${error.code}`);
    return (data as unknown as SubmissionRow[]).map(mapSubmission);
  }

  async getOwned(userId: string, id: string) {
    const client = await createDatabaseClient();
    const { data, error } = await client.from("submissions").select(OWNED_COLUMNS).eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`Could not read submission: ${error.code}`);
    return data ? mapSubmission(data as unknown as SubmissionRow) : undefined;
  }

  async updateOwnedDraft(userId: string, id: string, patch: Partial<SubmissionDraft>) {
    const client = await createDatabaseClient();
    const values = {
      intent: patch.intent, artifact_type: patch.artifactType, identity_mode: patch.identityMode,
      public_name: patch.publicName, anonymous: patch.anonymous, location: patch.location,
      headline: patch.headline, story: patch.story, what_they_need: patch.whatWouldHelp ? [patch.whatWouldHelp] : undefined,
      need_category: patch.needCategory,
    };
    const { data, error } = await client.from("submissions").update(values).eq("id", id).eq("user_id", userId).eq("status", "draft").select(OWNED_COLUMNS).single();
    if (error) throw new Error(`Could not save draft: ${error.code}`);
    return mapSubmission(data as unknown as SubmissionRow);
  }

  async submitOwnedDraft(userId: string, id: string) {
    const client = await createDatabaseClient();
    const { data, error } = await client.from("submissions").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).eq("status", "draft").select(OWNED_COLUMNS).single();
    if (error?.message === "post limit reached") throw new LimitError("You have shared a lot of stories recently. Please try again in a little while.");
    if (error) throw new Error(`Could not submit draft: ${error.code}`);
    return mapSubmission(data as unknown as SubmissionRow);
  }
}

export const submissionRepository: SubmissionRepository = new NeonSubmissionRepository();
