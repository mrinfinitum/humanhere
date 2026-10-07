import "server-only";

import type { MediaAsset } from "@/lib/archive/types";
import { adminSql } from "@/lib/neon/admin";
import { createDatabaseClient } from "@/lib/neon/server";

export type PublishedStory = { slug: string; loveCount: number };
export type ReceivedNote = { id: string; storySlug: string; body: string; createdAt: string; readAt: string | null };
export type LovedHuman = {
  id: string; slug: string; name: string; location: string | null; headline: string | null;
  thumbnail: MediaAsset | null; loveCount: number;
};
export type StoryPermissions = {
  publishStory: boolean; publishMedia: boolean; socialReuse: boolean; mayContact: boolean; partnerReferral: boolean;
  consentedAt: string; revokedAt: string | null;
};
export type AccountActivity = {
  displayName: string | null;
  joinedAt: string | null;
  published: Record<string, PublishedStory>;
  permissions: Record<string, StoryPermissions>;
  notes: ReceivedNote[];
  loved: LovedHuman[];
};

/** Everything the signed-in member's own page shows beyond their submissions. */
export async function getAccountActivity(userId: string): Promise<AccountActivity> {
  const database = await createDatabaseClient();
  const [profile, notes, loves, consents, entries] = await Promise.all([
    database.from("profiles").select("display_name,created_at").eq("id", userId).maybeSingle(),
    database.rpc("notes_for_me", { p_limit: 40 }),
    database.from("human_entry_loves").select("human_entry_id,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(60),
    // Staff can read every consent record, so always filter to the owner.
    database.from("consent_records").select("submission_id,publish_story,publish_media,social_reuse,may_contact,partner_referral,consented_at,revoked_at")
      .eq("user_id", userId).order("consented_at", { ascending: false }),
    // Members cannot read the private link between a submission and its public
    // entry directly, so this stays a server query scoped to the owner.
    adminSql()`select h.submission_id, h.slug, h.love_count from public.human_entries h
      join public.submissions s on s.id = h.submission_id
      where s.user_id = ${userId}::uuid and h.published = true`,
  ]);
  if (profile.error || notes.error || loves.error || consents.error) throw new Error("Could not load your account activity.");

  const lovedIds = (loves.data ?? []).map(row => String(row.human_entry_id));
  const humans = lovedIds.length
    ? await database.from("human_entries_public").select("id,slug,first_name,display_location,anonymous,thumbnail,headline,love_count").in("id", lovedIds)
    : { data: [], error: null };
  if (humans.error) throw new Error("Could not load the Humans you love.");
  const humansById = new Map((humans.data ?? []).map(human => [human.id, human]));

  // Records arrive newest first; the latest one per story is the one in force.
  const permissions: Record<string, StoryPermissions> = {};
  for (const record of consents.data ?? []) {
    permissions[String(record.submission_id)] ??= {
      publishStory: record.publish_story === true, publishMedia: record.publish_media === true,
      socialReuse: record.social_reuse === true, mayContact: record.may_contact === true,
      partnerReferral: record.partner_referral === true,
      consentedAt: String(record.consented_at), revokedAt: record.revoked_at ? String(record.revoked_at) : null,
    };
  }

  return {
    displayName: profile.data?.display_name ?? null,
    joinedAt: profile.data?.created_at ?? null,
    published: Object.fromEntries(entries.map(entry => [String(entry.submission_id), { slug: String(entry.slug), loveCount: Number(entry.love_count ?? 0) }])),
    permissions,
    notes: (notes.data ?? []).map(note => ({ id: note.note_id, storySlug: note.story_slug, body: note.body, createdAt: note.created_at, readAt: note.read_at })),
    // Keep the order the member loved them in; skip stories since unpublished.
    loved: lovedIds.flatMap(id => {
      const human = humansById.get(id);
      if (!human?.slug) return [];
      return [{
        id, slug: human.slug, name: human.anonymous ? "Anonymous" : human.first_name ?? "A Human",
        location: human.display_location, headline: human.headline,
        thumbnail: human.thumbnail as unknown as MediaAsset | null, loveCount: Number(human.love_count ?? 0),
      }];
    }),
  };
}
