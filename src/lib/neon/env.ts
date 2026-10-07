export function hasNeonEnvironment() {
  return Boolean(process.env.NEON_DATA_API_URL && process.env.NEON_AUTH_BASE_URL);
}

export function hasNeonAuthEnvironment() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
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
