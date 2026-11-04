import { timingSafeEqual } from "node:crypto";
import { cleanOrphanedMedia } from "@/lib/storage/cleanup";

// Called daily by Vercel Cron (vercel.json), which sends the CRON_SECRET.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await cleanOrphanedMedia();
    console.log("Media cleanup:", JSON.stringify(result));
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Media cleanup failed:", error instanceof Error ? error.message : error);
    return Response.json({ error: "cleanup_failed" }, { status: 500 });
  }
}
