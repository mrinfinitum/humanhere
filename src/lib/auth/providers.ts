import "server-only";

import { getSupabasePublicEnvironment, hasSupabasePublicEnvironment } from "@/lib/supabase/env";

export type AuthProviderAvailability = {
  email: boolean;
  google: boolean;
  apple: boolean;
};

const UNAVAILABLE: AuthProviderAvailability = {
  email: false,
  google: false,
  apple: false,
};

export function parseAuthProviderAvailability(value: unknown): AuthProviderAvailability {
  const external = value && typeof value === "object" && "external" in value
    ? (value as { external?: unknown }).external
    : null;
  const settings = external && typeof external === "object"
    ? external as Record<string, unknown>
    : {};

  return {
    email: settings.email === true,
    google: settings.google === true,
    apple: settings.apple === true,
  };
}

export async function getAuthProviderAvailability(): Promise<AuthProviderAvailability> {
  if (!hasSupabasePublicEnvironment()) return UNAVAILABLE;
  const { url, publishableKey } = getSupabasePublicEnvironment();

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey },
      cache: "no-store",
    });
    if (!response.ok) return UNAVAILABLE;
    return parseAuthProviderAvailability(await response.json());
  } catch {
    return UNAVAILABLE;
  }
}
