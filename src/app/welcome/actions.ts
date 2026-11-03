"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { TERMS_VERSION } from "@/lib/legal/versions";
import { createDatabaseClient } from "@/lib/neon/server";

/** Saves the member's profile; continuing is their agreement to the terms. */
export async function acceptTerms(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const user = await requireUser(next);
  const back = (error: string) => redirect(`/welcome?error=${error}&next=${encodeURIComponent(next)}`);
  const database = await createDatabaseClient();
  const claimed = await database.rpc("claim_username", { p_username: String(formData.get("username") ?? "") });
  if (claimed.error) back(claimed.error.message === "username is taken" ? "username-taken" : claimed.error.message === "username is reserved" ? "username-reserved" : "username-invalid");
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 80);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 160);
  const profile = await database.from("profiles").update({ display_name: displayName || null, bio: bio || null }).eq("id", user.id);
  if (profile.error) throw new Error(`Your profile could not be saved: ${profile.error.code}`);
  const { error } = await database.rpc("accept_terms", { p_version: TERMS_VERSION });
  if (error) throw new Error(`Your agreement could not be saved: ${error.code}`);
  redirect(next);
}
