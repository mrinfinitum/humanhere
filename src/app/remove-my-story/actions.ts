"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestRemoval(formData: FormData) {
  const user = await requireUser("/remove-my-story");
  const requesterName = String(formData.get("name") ?? "").trim().slice(0, 160);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  const entryId = String(formData.get("humanEntryId") ?? "").trim();
  if (!requesterName || !reason || !user.email) return;
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase.from("removal_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return;
  const { error } = await supabase.from("removal_requests").insert({
    human_entry_id: /^[0-9a-f-]{36}$/i.test(entryId) ? entryId : null,
    user_id: user.id,
    requester_name: requesterName,
    requester_email: user.email,
    reason,
    message: message || null,
    status: "pending",
  });
  if (!error) redirect("/remove-my-story?submitted=1");
}
