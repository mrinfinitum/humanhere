"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { createDatabaseClient } from "@/lib/neon/server";

function usernameFrom(formData: FormData) {
  const username = String(formData.get("username") ?? "").toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(username) ? username : null;
}

export async function followMember(formData: FormData) {
  const username = usernameFrom(formData);
  if (!username) return;
  if (!await getAuthenticatedUser()) redirect(`/login?next=${encodeURIComponent(`/@${username}`)}`);
  const { error } = await (await createDatabaseClient()).rpc("follow_member", { p_username: username });
  if (error) throw new Error(`Could not follow: ${error.code}`);
  refresh();
}

export async function unfollowMember(formData: FormData) {
  const username = usernameFrom(formData);
  if (!username || !await getAuthenticatedUser()) return;
  const { error } = await (await createDatabaseClient()).rpc("unfollow_member", { p_username: username });
  if (error) throw new Error(`Could not unfollow: ${error.code}`);
  refresh();
}
