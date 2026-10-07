"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { createDatabaseClient } from "@/lib/neon/server";

export async function requestRemoval(formData: FormData) {
  const user = await requireUser("/remove-my-story");
  const requesterName = String(formData.get("name") ?? "").trim().slice(0, 160);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const entryId = String(formData.get("humanEntryId") ?? "").trim();
  if (!requesterName || !reason || !user.email) return;
  const database = await createDatabaseClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await database.from("removal_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= 5) redirect("/remove-my-story?error=limit");
  const { error } = await database.from("removal_requests").insert({
    human_entry_id: /^[0-9a-f-]{36}$/i.test(entryId) ? entryId : null,
    user_id: user.id,
    requester_name: requesterName,
    requester_email: user.email,
    reason,
    message: message || null,
  });
  redirect(error ? "/remove-my-story?error=1" : "/remove-my-story?submitted=1");
}
