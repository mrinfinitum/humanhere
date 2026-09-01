type PublicSupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

export function hasSupabasePublicEnvironment() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabasePublicEnvironment(): PublicSupabaseEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment is not configured.");
  }

  return { url, publishableKey };
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }

  let url: URL;
  try {
    url = new URL(configured ?? "http://localhost:3000");
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }

  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!local) url.protocol = "https:";
  return url.origin;
}
