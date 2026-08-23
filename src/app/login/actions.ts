"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";

function safeNext(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "/account";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/account";
}

export async function signInWithOAuth(formData: FormData) {
  const value = formData.get("provider");
  if (value !== "google" && value !== "apple") redirect("/login?error=provider");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: value,
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=oauth&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(`/login?error=email&next=${encodeURIComponent(next)}`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect(`/login?error=magic-link&next=${encodeURIComponent(next)}`);
  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
