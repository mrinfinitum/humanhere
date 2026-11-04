import "server-only";

import type { MediaAsset } from "@/lib/archive/types";
import { memberLevel, type MemberLevel } from "@/lib/account/levels";
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
  level: MemberLevel;
  username: string | null;
  bio: string | null;
  city: string | null;
  region: string | null;
  allowSocialReuse: boolean;
  avatarPath: string | null;
  hideFollowLists: boolean;
  followers: number;
  following: number;
  published: Record<string, PublishedStory>;
  permissions: Record<string, StoryPermissions>;
  notes: ReceivedNote[];
  loved: LovedHuman[];
};

/** Everything the signed-in member's own page shows beyond their submissions. */
export async function getAccountActivity(userId: string): Promise<AccountActivity> {
  const database = await createDatabaseClient();
  const [profile, notes, loves, consents, entries, experience, followers, following] = await Promise.all([
    database.from("profiles").select("display_name,created_at,username,bio,city,region,allow_social_reuse,avatar_path,hide_follow_lists").eq("id", userId).maybeSingle(),
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
    database.rpc("my_experience"),
    // Members can read the follow rows they are part of.
    database.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", userId),
    database.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  const failed = Object.entries({ profile, notes, loves, consents, experience, followers, following }).flatMap(([name, result]) => result.error ? [`${name}: ${result.error.code} ${result.error.message}`] : []);
  if (failed.length) console.error("Account activity failed:", failed.join("; "));
  if (failed.length) throw new Error("Could not load your account activity.");

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
    level: memberLevel(experience.data?.[0] ?? { loves: 0, notes: 0, gifts: 0 }),
    username: profile.data?.username ?? null,
    bio: profile.data?.bio ?? null,
    city: profile.data?.city ?? null,
    region: profile.data?.region ?? null,
    allowSocialReuse: profile.data?.allow_social_reuse === true,
    avatarPath: profile.data?.avatar_path ?? null,
    hideFollowLists: profile.data?.hide_follow_lists === true,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
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

export type MailingAddress = {
  line1: string; line2: string; city: string; state: string; postalCode: string; country: string;
};

/** The member's own private address. Only they (and audited staff workflows) can read it. */
export async function getMailingAddress(userId: string): Promise<MailingAddress | null> {
  const database = await createDatabaseClient();
  const { data, error } = await database.from("fulfillment_profiles")
    .select("address_line_1,address_line_2,city,state,postal_code,country").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`Mailing address could not be loaded: ${error.code}`);
  if (!data?.address_line_1) return null;
  return {
    line1: String(data.address_line_1 ?? ""), line2: String(data.address_line_2 ?? ""), city: String(data.city ?? ""),
    state: String(data.state ?? ""), postalCode: String(data.postal_code ?? ""), country: String(data.country ?? "US"),
  };
}

/** "City, ST", or whichever part the member filled in. */
export function formatPlace(city?: string | null, region?: string | null) {
  return [city?.trim(), region?.trim()].filter(Boolean).join(", ") || null;
}
