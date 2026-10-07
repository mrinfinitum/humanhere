import { getNeonAuth } from "@/lib/auth/neon";
import { hasNeonAuthEnvironment } from "@/lib/neon/env";

type Context = { params: Promise<{ path: string[] }> };

function unavailable() {
  return Response.json({ error: "Account access is temporarily unavailable." }, { status: 503 });
}

export async function GET(request: Request, context: Context) {
  if (!hasNeonAuthEnvironment()) return unavailable();
  return getNeonAuth().handler().GET(request, context);
}

export async function POST(request: Request, context: Context) {
  if (!hasNeonAuthEnvironment()) return unavailable();
  return getNeonAuth().handler().POST(request, context);
}
