"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/auth/neon";
import { getSiteUrl } from "@/lib/neon/env";
import { getAuthProviderAvailability } from "@/lib/auth/providers";
import { safeNext } from "@/lib/auth/redirect";

export async function signInWithOAuth(formData: FormData) {
  const value = formData.get("provider");
  if (value !== "google") redirect("/login?error=provider");
  const next = safeNext(formData.get("next"));
  const available = await getAuthProviderAvailability();
  if (!available[value]) redirect(`/login?error=provider-unavailable&next=${encodeURIComponent(next)}`);
  const { data, error } = await getNeonAuth().signIn.social({
    provider: value,
    callbackURL: `${getSiteUrl()}/auth/complete?next=${encodeURIComponent(next)}`,
  });
  if (error || !data?.url) redirect(`/login?error=oauth&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(`/login?error=email&next=${encodeURIComponent(next)}`);
  const available = await getAuthProviderAvailability();
  if (!available.email) redirect(`/login?error=email-unavailable&next=${encodeURIComponent(next)}`);
  const { error } = await getNeonAuth().signIn.magicLink({
    email,
    callbackURL: `${getSiteUrl()}/auth/complete?next=${encodeURIComponent(next)}`,
  });
  if (error) {
    console.error("Magic link request failed:", error.status, error.code ?? error.message);
    redirect(`/login?error=magic-link&next=${encodeURIComponent(next)}`);
  }
  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  await getNeonAuth().signOut();
  redirect("/");
}
