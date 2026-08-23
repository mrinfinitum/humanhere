import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [{ protocol: "https", hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, pathname: "/storage/v1/object/public/published-media/**" }]
      : [],
  },
  async redirects() {
    return [
      { source: "/people", destination: "/humans", permanent: true },
      { source: "/people/:slug", destination: "/humans/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
