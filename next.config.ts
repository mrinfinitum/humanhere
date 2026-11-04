import type { NextConfig } from "next";

function origin(value?: string) {
  try { return value ? new URL(value).origin : undefined; } catch { return undefined; }
}

// Which outside sites the browser may talk to. Static pages are prerendered,
// so per-request nonces are not available; inline scripts stay allowed and
// every outside source is listed by name instead.
function contentSecurityPolicy() {
  const dev = process.env.NODE_ENV === "development";
  const media = origin(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);
  // Signed upload URLs go straight to storage. If the build cannot see the
  // endpoint, allow Neon storage hosts rather than silently breaking uploads.
  const storage = origin(process.env.AWS_ENDPOINT_URL_S3) ?? "https://*.aws.neon.tech";
  const turnstile = "https://challenges.cloudflare.com";
  const list = (...values: Array<string | undefined | false>) => [...new Set(values.filter(Boolean))].join(" ");
  return [
    "default-src 'self'",
    `script-src ${list("'self'", "'unsafe-inline'", dev && "'unsafe-eval'", turnstile)}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${list("'self'", "data:", "blob:", media, "https://image.mux.com")}`,
    `media-src ${list("'self'", "blob:", media, "https://stream.mux.com")}`,
    "font-src 'self' data:",
    `connect-src ${list("'self'", storage, media, "https://stream.mux.com", turnstile, dev && "ws:")}`,
    `frame-src ${turnstile}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "); // HSTS already keeps every request on HTTPS.
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: Boolean(process.env.TURBOPACK),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: process.env.NEXT_PUBLIC_MEDIA_BASE_URL
      ? [{ protocol: "https", hostname: new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL).hostname, pathname: `${new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL).pathname.replace(/\/$/, "")}/**` }]
      : [],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy() },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      ],
    }];
  },
  async rewrites() {
    return [
      { source: "/@:username", destination: "/u/:username" },
      { source: "/@:username/:list(followers|following)", destination: "/u/:username/:list" },
    ];
  },
  async redirects() {
    return [
      { source: "/support", destination: "/give", permanent: true },
      { source: "/people", destination: "/humans", permanent: true },
      { source: "/people/:slug", destination: "/humans/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
