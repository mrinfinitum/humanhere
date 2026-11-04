"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import type { MediaAsset } from "@/lib/archive/types";
import { adminSql } from "@/lib/neon/admin";
import { removeObjects, PRIVATE_BUCKET, PUBLIC_BUCKET } from "@/lib/storage/server";
import { createDatabaseClient } from "@/lib/neon/server";
import { formatPlace } from "@/lib/account/queries";
import { placeCentroid } from "@/lib/geo/places";

// Approved derivatives are removed from the public bucket so previously
// copied URLs stop resolving once a story is no longer public.
async function removePublicMedia(assets: Array<MediaAsset | null | undefined>) {
  const paths = assets
    .filter((asset): asset is MediaAsset => asset?.provider === "neon" && Boolean(asset.path))
    .map(asset => asset.path);
  if (paths.length) await removeObjects(PUBLIC_BUCKET, [...new Set(paths)]);
}

async function ownedPublicMedia(submissionId: string, userId: string) {
  const entries = await adminSql()`select h.thumbnail, h.media from public.human_entries h
    join public.submissions s on s.id = h.submission_id
    where h.submission_id = ${submissionId}::uuid and s.user_id = ${userId}::uuid`;
  return entries.flatMap(entry => {
    const record = entry as { thumbnail?: MediaAsset | null; media?: MediaAsset[] | null };
    return [record.thumbnail, ...(record.media ?? [])];
  });
}

function submissionIdFrom(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  return /^[0-9a-f-]{36}$/i.test(submissionId) ? submissionId : null;
}

export async function revokeConsent(formData: FormData) {
  const user = await requireUser("/account");
  const submissionId = submissionIdFrom(formData);
  if (!submissionId) return;
  const database = await createDatabaseClient();
  const { data, error } = await database.rpc("revoke_owned_submission_consent", { p_submission_id: submissionId });
  if (error) throw new Error(`Consent revocation failed: ${error.code}`);
  // Revocation closes the public record first; files are removed after.
  for (const slug of data ?? []) expirePublishedHumanImmediately(slug);
  await removePublicMedia(await ownedPublicMedia(submissionId, user.id));
}

/** Returns a story to a private draft, unpublishing it, and opens the editor. */
export async function editStory(formData: FormData) {
  const user = await requireUser("/account");
  const submissionId = submissionIdFrom(formData);
  if (!submissionId) return;
  const database = await createDatabaseClient();
  const { data, error } = await database.rpc("withdraw_owned_submission", { p_submission_id: submissionId });
  if (error) throw new Error(`Story could not be reopened: ${error.code}`);
  for (const slug of data ?? []) expirePublishedHumanImmediately(slug);
  await removePublicMedia(await ownedPublicMedia(submissionId, user.id));
  redirect(`/share?draft=${submissionId}`);
}

export async function deleteStory(formData: FormData) {
  await requireUser("/account");
  const submissionId = submissionIdFrom(formData);
  if (!submissionId) return;
  const database = await createDatabaseClient();
  const { data, error } = await database.rpc("delete_owned_submission", { p_submission_id: submissionId });
  // Help that is already being fulfilled keeps its record until staff close it.
  if (error?.code === "23503") redirect("/account?error=delete-blocked");
  if (error) throw new Error(`Story could not be deleted: ${error.code}`);
  const removed = data as { slugs?: string[]; private_paths?: string[]; public_assets?: MediaAsset[] } | null;
  for (const slug of removed?.slugs ?? []) expirePublishedHumanImmediately(slug);
  // The rows are gone; a failed file removal is collected by storage:clean.
  await Promise.allSettled([
    removePublicMedia(removed?.public_assets ?? []),
    removed?.private_paths?.length ? removeObjects(PRIVATE_BUCKET, removed.private_paths) : undefined,
  ]);
  refresh();
}

const USERNAME_ERRORS: Record<string, string> = { "invalid username": "username-invalid", "username is reserved": "username-reserved", "username is taken": "username-taken" };
const PROFILE_SETTINGS = "/account/settings/profile";

/**
 * A story without its own location shows on the globe at the author's profile
 * city. When that city changes, those stories move with it; a story whose
 * author typed a different place keeps it. Anonymous stories never use it, so
 * the profile cannot be tied to them.
 */
async function moveStoriesToProfilePlace(userId: string, previous: string | null, next: string | null) {
  if (previous === next) return;
  const sql = adminSql();
  const stories = await sql`select h.id, h.slug, h.submission_id from public.human_entries h
    join public.submissions s on s.id = h.submission_id
    where s.user_id = ${userId}::uuid and h.published = true and not h.anonymous and not h.location_withheld
      and (nullif(btrim(coalesce(h.display_location, '')), '') is null or h.display_location = ${previous ?? ""})`;
  if (!stories.length) return;
  const pin = placeCentroid(next);
  for (const story of stories) {
    await sql`update public.human_entries set display_location = ${next},
        public_latitude = ${pin?.latitude ?? null}, public_longitude = ${pin?.longitude ?? null},
        public_location_precision = ${pin?.precision ?? null}::public.human_public_location_precision,
        public_location_approved_at = ${pin ? new Date() : null}, public_location_approved_by = ${pin ? userId : null}::uuid
      where id = ${story.id}::uuid`;
    await sql`update public.submissions set location = ${next} where id = ${story.submission_id}::uuid and user_id = ${userId}::uuid`;
    expirePublishedHumanImmediately(String(story.slug));
  }
}

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

/** Saves the Edit profile form: name, bio, city and state and, when it changed, the @username. */
export async function updateProfile(formData: FormData) {
  const user = await requireUser(PROFILE_SETTINGS);
  const displayName = String(formData.get("displayName") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 160);
  const username = String(formData.get("username") ?? "").trim().toLowerCase().replace(/^@/, "");
  const city = field(formData, "city", 80);
  const region = field(formData, "region", 80);
  const database = await createDatabaseClient();
  const { data: before } = await database.from("profiles").select("city,region").eq("id", user.id).maybeSingle();
  // Name, bio and place save even when the new username is refused.
  const { error } = await database.from("profiles").update({ display_name: displayName || null, bio: bio || null, city: city || null, region: region || null }).eq("id", user.id);
  if (error) throw new Error(`Profile could not be saved: ${error.code}`);
  await moveStoriesToProfilePlace(user.id, formatPlace(before?.city, before?.region), formatPlace(city, region));
  if (username && username !== String(formData.get("currentUsername") ?? "")) {
    const { error: usernameError } = await database.rpc("claim_username", { p_username: username });
    if (usernameError) redirect(`${PROFILE_SETTINGS}?error=${USERNAME_ERRORS[usernameError.message] ?? "username-invalid"}`);
  }
  redirect(`${PROFILE_SETTINGS}?done=saved`);
}

/** Applies to stories submitted from now on; earlier stories keep their own record. */
export async function updateSocialSharing(formData: FormData) {
  const user = await requireUser("/account/settings/privacy");
  const database = await createDatabaseClient();
  const { error } = await database.from("profiles").update({ allow_social_reuse: formData.get("allowSocialReuse") === "on" }).eq("id", user.id);
  if (error) throw new Error(`Permissions could not be saved: ${error.code}`);
  refresh();
}

/** Hides who the member follows and who follows them from everyone else. */
export async function updateFollowListPrivacy(formData: FormData) {
  const user = await requireUser("/account/settings/privacy");
  const database = await createDatabaseClient();
  const { error } = await database.from("profiles").update({ hide_follow_lists: formData.get("hideFollowLists") === "on" }).eq("id", user.id);
  if (error) throw new Error(`Privacy setting could not be saved: ${error.code}`);
  refresh();
}

const NOTE_ACTIONS = { read: "mark_private_note_read", hide: "hide_private_note", report: "report_private_note" } as const;

export async function updateReceivedNote(formData: FormData) {
  await requireUser("/account?tab=notes");
  const noteId = String(formData.get("noteId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(noteId) || !Object.hasOwn(NOTE_ACTIONS, action)) return;
  const database = await createDatabaseClient();
  const { error } = await database.rpc(NOTE_ACTIONS[action as keyof typeof NOTE_ACTIONS], { p_note_id: noteId });
  if (error) throw new Error(`Note could not be updated: ${error.code}`);
  refresh();
}

/** Saves the member's private mailing address. It is never shown on their profile. */
export async function saveMailingAddress(formData: FormData) {
  const user = await requireUser(PROFILE_SETTINGS);
  const address = {
    address_line_1: field(formData, "line1", 200), address_line_2: field(formData, "line2", 200),
    city: field(formData, "addressCity", 160), state: field(formData, "addressState", 160),
    postal_code: field(formData, "postalCode", 32), country: field(formData, "country", 160) || "US",
  };
  if (!address.address_line_1 || !address.city || !address.state || !address.postal_code) redirect(`${PROFILE_SETTINGS}?error=address-incomplete#address`);
  const database = await createDatabaseClient();
  const { data: existing, error: readError } = await database.from("fulfillment_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (readError) throw new Error(`Mailing address could not be saved: ${readError.code}`);
  const values = { ...address, address_line_2: address.address_line_2 || null };
  const { error } = existing
    ? await database.from("fulfillment_profiles").update(values).eq("user_id", user.id)
    : await database.from("fulfillment_profiles").insert({ user_id: user.id, ...values });
  if (error) throw new Error(`Mailing address could not be saved: ${error.code}`);
  redirect(`${PROFILE_SETTINGS}?done=address#address`);
}

/** Clears the address fields; any help preferences stay as they were. */
export async function removeMailingAddress() {
  const user = await requireUser(PROFILE_SETTINGS);
  const database = await createDatabaseClient();
  const { error } = await database.from("fulfillment_profiles")
    .update({ address_line_1: null, address_line_2: null, city: null, state: null, postal_code: null, country: null }).eq("user_id", user.id);
  if (error) throw new Error(`Mailing address could not be removed: ${error.code}`);
  redirect(`${PROFILE_SETTINGS}?done=address-removed#address`);
}
