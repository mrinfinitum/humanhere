import { NextRequest } from "next/server";
import { humanArchiveRepository } from "@/lib/archive/repository";
import type { HumanArtifactType } from "@/lib/archive/types";

const artifactTypes = new Set<HumanArtifactType>(["portrait", "story", "note", "video", "audio", "object", "place", "quote"]);

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const limitValue = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "12", 10);
  const requestedTypes = request.nextUrl.searchParams.getAll("type").filter((type): type is HumanArtifactType => artifactTypes.has(type as HumanArtifactType));
  const batch = await humanArchiveRepository.list({ cursor, limit: Number.isFinite(limitValue) ? limitValue : 12, types: requestedTypes.length ? requestedTypes : undefined });
  return Response.json(batch, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
