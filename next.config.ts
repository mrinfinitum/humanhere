import type { NextConfig } from "next";

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
