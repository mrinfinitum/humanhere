"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/auth/neon";
import { requireUser } from "@/lib/auth/server";
import { expirePublishedHumanImmediately } from "@/lib/archive/cache";
import type { MediaAsset } from "@/lib/archive/types";
import { adminSql } from "@/lib/neon/admin";
import { getSiteUrl } from "@/lib/neon/env";
import { createDatabaseClient } from "@/lib/neon/server";
import { PRIVATE_BUCKET, PUBLIC_BUCKET, removeObjects } from "@/lib/storage/server";

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;
const ACCOUNT = "/account/settings/account";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Log only the status and code; never anything containing credentials. */
function logFailure(label: string, error: { status?: number; code?: string } | null | undefined) {
  console.error(`${label} failed:`, error?.status, error?.code ?? "unknown");
}

export async function changePassword(formData: FormData) {
  await requireUser(ACCOUNT);
  const currentPassword = field(formData, "currentPassword");
  const newPassword = field(formData, "newPassword");
  if (newPassword.length < PASSWORD_MIN) redirect(`${ACCOUNT}?problem=password-short`);
  if (newPassword.length > PASSWORD_MAX) redirect(`${ACCOUNT}?problem=password-long`);
  if (newPassword !== field(formData, "confirm")) redirect(`${ACCOUNT}?problem=mismatch`);
  const { error } = await getNeonAuth().changePassword({
    currentPassword, newPassword, revokeOtherSessions: formData.get("signOutOthers") === "on",
  });
  if (error) {
    logFailure("Password change", error);
    redirect(`${ACCOUNT}?problem=${error.status === 400 || error.status === 401 ? "current-password" : "password-service"}`);
  }
  redirect(`${ACCOUNT}?done=password`);
}

/** Members who sign in by email link set a first password through the reset email. */
export async function sendPasswordSetupLink() {
  const user = await requireUser(ACCOUNT);
  const { error } = await getNeonAuth().requestPasswordReset({ email: user.email, redirectTo: `${getSiteUrl()}/reset-password` });
  if (error) logFailure("Password setup link", error);
  redirect(`${ACCOUNT}?done=${error ? "link-failed" : "link-sent"}`);
}

export async function signOutOtherDevices() {
  await requireUser(ACCOUNT);
  const { error } = await getNeonAuth().revokeOtherSessions();
  if (error) {
    logFailure("Revoking other sessions", error);
    redirect(`${ACCOUNT}?problem=sessions`);
  }
  redirect(`${ACCOUNT}?done=sessions`);
}

const DELETE_PAGE = "/account/settings/delete";

/**
 * Deletes the member's stories (with their files), photo, follows, loves and
 * profile, then their sign-in account. Stories with help in progress stop it,
 * so nothing is half deleted.
 */
export async function deleteAccount(formData: FormData) {
  const user = await requireUser(DELETE_PAGE);
  const [profile] = await adminSql()`select username, avatar_path from public.profiles where id = ${user.id}::uuid`;
  const confirmation = field(formData, "confirm").trim().toLowerCase().replace(/^@/, "");
  if (!confirmation || confirmation !== String(profile?.username ?? user.email).toLowerCase()) redirect(`${DELETE_PAGE}?problem=confirm`);

  const database = await createDatabaseClient();
  const { data: owned, error: listError } = await database.from("submissions").select("id").eq("user_id", user.id);
  if (listError) throw new Error(`Stories could not be listed: ${listError.code}`);
  const publicAssets: MediaAsset[] = [];
  const privatePaths: string[] = [];
  for (const { id } of owned ?? []) {
    const { data, error } = await database.rpc("delete_owned_submission", { p_submission_id: id });
    if (error?.code === "23503") redirect(`${DELETE_PAGE}?problem=help-in-progress`);
    if (error) throw new Error(`Story could not be deleted: ${error.code}`);
    const removed = data as { slugs?: string[]; private_paths?: string[]; public_assets?: MediaAsset[] } | null;
    for (const slug of removed?.slugs ?? []) expirePublishedHumanImmediately(slug);
    publicAssets.push(...(removed?.public_assets ?? []));
    privatePaths.push(...(removed?.private_paths ?? []));
  }

  try {
    await adminSql()`delete from public.profiles where id = ${user.id}::uuid`;
  } catch (error) {
    // Staff records and fulfilled help keep a reference that blocks removal.
    console.error("Profile deletion failed:", (error as { code?: string }).code ?? "unknown");
    redirect(`${DELETE_PAGE}?problem=contact-us`);
  }
  // Nothing below uses the database client, which would recreate the profile.
  const { error: authError } = await getNeonAuth().deleteUser({});
  if (authError) {
    logFailure("Sign-in account deletion", authError);
    await adminSql()`delete from neon_auth."user" where id = ${user.id}::uuid`;
  }

  const publicPaths = publicAssets.filter(asset => asset?.provider === "neon" && asset.path).map(asset => asset.path);
  if (profile?.avatar_path) publicPaths.push(String(profile.avatar_path));
  // The records are gone; files that fail to delete are collected by storage:clean.
  await Promise.allSettled([
    publicPaths.length ? removeObjects(PUBLIC_BUCKET, [...new Set(publicPaths)]) : undefined,
    privatePaths.length ? removeObjects(PRIVATE_BUCKET, privatePaths) : undefined,
  ]);
  await getNeonAuth().signOut().catch(() => undefined);
  redirect("/?account=deleted");
}
