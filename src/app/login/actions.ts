"use server";

import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/auth/neon";
import { getSiteUrl } from "@/lib/neon/env";
import { getAuthProviderAvailability } from "@/lib/auth/providers";
import { safeNext } from "@/lib/auth/redirect";

const OAUTH_PROVIDERS = ["google", "apple"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;
const NAME_MAX = 80;

type AuthFailure = { status?: number; code?: string; message?: string } | null | undefined;

function loginUrl(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `/login?${text}` : "/login";
}

function completeUrl(next: string) {
  return `${getSiteUrl()}/auth/complete?next=${encodeURIComponent(next)}`;
}

function readEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254 ? email : null;
}

function readPassword(formData: FormData, field = "password") {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function passwordProblem(password: string) {
  if (password.length < PASSWORD_MIN) return "password-short";
  if (password.length > PASSWORD_MAX) return "password-long";
  return null;
}

/** Log only the status and code; never the request body or anything containing credentials. */
function logFailure(label: string, error: AuthFailure) {
  console.error(`${label} failed:`, error?.status, error?.code ?? "unknown");
}

function isOAuthProvider(value: unknown): value is OAuthProvider {
  return typeof value === "string" && (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

export async function signInWithOAuth(formData: FormData) {
  const value = formData.get("provider");
  if (!isOAuthProvider(value)) redirect("/login?error=provider");
  const next = safeNext(formData.get("next"));
  const available = await getAuthProviderAvailability();
  if (!available[value]) redirect(loginUrl({ error: "provider-unavailable", next }));
  const { data, error } = await getNeonAuth().signIn.social({
    provider: value,
    callbackURL: completeUrl(next),
  });
  if (error || !data?.url) {
    logFailure(`OAuth (${value}) sign-in`, error);
    redirect(loginUrl({ error: "oauth", next }));
  }
  redirect(data.url);
}

export async function signInWithMagicLink(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const email = readEmail(formData);
  if (!email) redirect(loginUrl({ error: "email", next }));
  const available = await getAuthProviderAvailability();
  if (!available.email) redirect(loginUrl({ error: "email-unavailable", next }));
  const { error } = await getNeonAuth().signIn.magicLink({ email, callbackURL: completeUrl(next) });
  if (error) {
    logFailure("Magic link request", error);
    redirect(loginUrl({ error: "magic-link", next }));
  }
  redirect(loginUrl({ sent: "1", next }));
}

export async function signInWithPassword(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const available = await getAuthProviderAvailability();
  if (!available.password) redirect(loginUrl({ error: "password-unavailable", next }));
  const email = readEmail(formData);
  if (!email) redirect(loginUrl({ error: "email", next }));
  const password = readPassword(formData);
  if (!password || password.length > PASSWORD_MAX) redirect(loginUrl({ error: "credentials", next }));
  // The server API copies the session cookies onto this response, so the
  // user is signed in as soon as this resolves without an /auth/complete hop.
  const { error } = await getNeonAuth().signIn.email({ email, password, callbackURL: completeUrl(next) });
  if (error) {
    logFailure("Password sign-in", error);
    const code = error.code === "email_not_confirmed" ? "unverified"
      : error.code === "over_request_rate_limit" || error.status === 429 ? "rate-limit"
      : error.status && error.status >= 500 ? "password-service"
      : "credentials";
    redirect(loginUrl({ error: code, next }));
  }
  redirect(next);
}

export async function signUpWithPassword(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const available = await getAuthProviderAvailability();
  if (!available.password) redirect(loginUrl({ mode: "signup", error: "password-unavailable", next }));
  const email = readEmail(formData);
  if (!email) redirect(loginUrl({ mode: "signup", error: "email", next }));
  const password = readPassword(formData);
  const problem = passwordProblem(password);
  if (problem) redirect(loginUrl({ mode: "signup", error: problem, next }));
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, NAME_MAX);
  const { data, error } = await getNeonAuth().signUp.email({ email, password, name, callbackURL: completeUrl(next) });
  if (error) {
    logFailure("Password sign-up", error);
    const code = error.code === "user_already_exists" || error.code === "email_exists" ? "account-exists"
      : error.code === "weak_password" ? "password-short"
      : error.code === "email_address_invalid" ? "email"
      : error.code === "over_request_rate_limit" || error.status === 429 ? "rate-limit"
      : "signup";
    redirect(loginUrl({ mode: "signup", error: code, next }));
  }
  // When Neon Auth requires email verification, sign-up returns no session token.
  if (!data?.token) redirect(loginUrl({ verify: "1", next }));
  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const available = await getAuthProviderAvailability();
  if (!available.password) redirect(loginUrl({ mode: "forgot", error: "password-unavailable", next }));
  const email = readEmail(formData);
  if (!email) redirect(loginUrl({ mode: "forgot", error: "email", next }));
  // Better Auth emails `<auth>/reset-password/<token>?callbackURL=<redirectTo>`,
  // which forwards to `redirectTo?token=...` (or `?error=INVALID_TOKEN`).
  const { error } = await getNeonAuth().requestPasswordReset({
    email,
    redirectTo: `${getSiteUrl()}/reset-password`,
  });
  // Always show the same neutral message so the form cannot reveal which emails have accounts.
  if (error) logFailure("Password reset request", error);
  redirect(loginUrl({ reset: "sent", next }));
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token || token.length > 512) redirect("/reset-password?error=INVALID_TOKEN");
  const tokenQuery = `token=${encodeURIComponent(token)}`;
  const password = readPassword(formData);
  const problem = passwordProblem(password);
  if (problem) redirect(`/reset-password?${tokenQuery}&problem=${problem}`);
  if (password !== readPassword(formData, "confirm")) redirect(`/reset-password?${tokenQuery}&problem=mismatch`);
  const { error } = await getNeonAuth().resetPassword({ newPassword: password, token });
  if (error) {
    logFailure("Password reset", error);
    if (error.code === "weak_password") redirect(`/reset-password?${tokenQuery}&problem=password-short`);
    if (error.status && error.status >= 500) redirect(`/reset-password?${tokenQuery}&problem=service`);
    redirect("/reset-password?error=INVALID_TOKEN");
  }
  redirect("/login?reset=1");
}

export async function signOut() {
  await getNeonAuth().signOut();
  redirect("/");
}
