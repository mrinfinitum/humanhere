"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { TERMS_VERSION } from "@/lib/legal/versions";
import { createDatabaseClient } from "@/lib/neon/server";

export async function acceptTerms(formData: FormData) {
  const next = safeNext(formData.get("next"));
  await requireUser(next);
  if (formData.get("agree") !== "on" || formData.get("age") !== "on") redirect(`/welcome?error=required&next=${encodeURIComponent(next)}`);
  const database = await createDatabaseClient();
  const { error } = await database.rpc("accept_terms", { p_version: TERMS_VERSION });
  if (error) throw new Error(`Your agreement could not be saved: ${error.code}`);
  redirect(next);
}
