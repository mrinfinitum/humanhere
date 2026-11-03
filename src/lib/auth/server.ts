import "server-only";

import { redirect } from "next/navigation";
import { createDatabaseClient, getSessionUser } from "@/lib/neon/server";
import { TERMS_VERSION } from "@/lib/legal/versions";
import type { AccountRole, StaffRole } from "@/lib/moderation/types";

export async function getAuthenticatedUser() {
  return getSessionUser();
}

export async function requireUser(returnTo = "/account") {
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Signed-in members must have agreed to the current terms and chosen a username. */
export async function requireMember(returnTo = "/account") {
  const user = await requireUser(returnTo);
  const database = await createDatabaseClient();
  const { data, error } = await database.from("profiles").select("terms_version,username").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Unable to load your account: ${error.code}`);
  if (data?.terms_version !== TERMS_VERSION || !data.username) redirect(`/welcome?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function getAccountRole(userId: string): Promise<AccountRole> {
  const database = await createDatabaseClient();
  const { data } = await database.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data?.role as AccountRole | undefined) ?? "user";
}

export async function requireStaff(allowed: StaffRole[] = ["moderator", "editor", "admin"]) {
  const user = await requireUser("/admin");
  const role = await getAccountRole(user.id);
  if (!allowed.includes(role as StaffRole)) redirect("/account");
  return { user, role: role as StaffRole };
}
