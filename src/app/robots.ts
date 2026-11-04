import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/neon/env";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/api/", "/auth/", "/home", "/login", "/reset-password", "/share", "/welcome", "/consent"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
