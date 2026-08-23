import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountRole, StaffRole } from "@/lib/moderation/types";

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function requireUser(returnTo = "/account") {
  const user = await getAuthenticatedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function getAccountRole(userId: string): Promise<AccountRole> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data?.role as AccountRole | undefined) ?? "user";
}

export async function requireStaff(allowed: StaffRole[] = ["moderator", "editor", "admin"]) {
  const user = await requireUser("/admin");
  const role = await getAccountRole(user.id);
  if (!allowed.includes(role as StaffRole)) redirect("/account");
  return { user, role: role as StaffRole };
}
