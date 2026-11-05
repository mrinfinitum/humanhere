import { NextRequest } from "next/server";
import { decodeHumanCursor } from "@/lib/archive/cursor";
import { humanArchiveRepository } from "@/lib/archive/repository";
import type { HumanArtifactType } from "@/lib/archive/types";

const artifactTypes = new Set<HumanArtifactType>(["portrait", "story", "note", "video", "audio", "object", "place", "quote"]);

export async function GET(request: NextRequest) {
  // Every distinct argument is its own cache entry, so normalize them first:
  // an invalid cursor is dropped, the limit is clamped and types are sorted.
  const rawCursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const cursor = decodeHumanCursor(rawCursor) ? rawCursor : undefined;
  const limitValue = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "12", 10);
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 40) : 12;
  const requestedTypes = [...new Set(request.nextUrl.searchParams.getAll("type").filter((type): type is HumanArtifactType => artifactTypes.has(type as HumanArtifactType)))].sort();
  const batch = await humanArchiveRepository.listPublished({ cursor, limit, types: requestedTypes.length ? requestedTypes : undefined });
  return Response.json(batch, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
