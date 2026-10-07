import "server-only";

import { hasNeonAuthEnvironment } from "@/lib/neon/env";

/** Keep these flags in sync with the methods enabled in Neon Auth. */
export async function getAuthProviderAvailability() {
  const configured = hasNeonAuthEnvironment();
  return {
    email: configured && process.env.NEON_AUTH_MAGIC_LINK_ENABLED === "true",
    google: configured && process.env.NEON_AUTH_GOOGLE_ENABLED === "true",
  };
}
