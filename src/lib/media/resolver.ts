import type { MediaAsset } from "@/lib/archive/types";

export type MediaVariant = "thumbnail" | "display" | "original" | "poster";

/**
 * The only place public UI turns a provider-neutral asset into a delivery URL.
 * Private assets must use a separately authorized signed-URL operation and must
 * never be passed through this public resolver.
 */
export function resolveMediaUrl(asset: MediaAsset, variant: MediaVariant = "display") {
  if (asset.provider === "local") return asset.path;

  if (asset.provider === "supabase") {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) throw new Error("Supabase media delivery is not configured.");
    const normalizedPath = asset.path.replace(/^\/+/, "");
    return `${base}/storage/v1/object/public/published-media/${normalizedPath}`;
  }

  // Provider records may store a ready playback/delivery identifier during the
  // future adapter transition. UI code still remains provider-agnostic.
  if (asset.provider === "mux" && variant === "poster") {
    return `https://image.mux.com/${asset.path}/thumbnail.webp`;
  }
  if (asset.provider === "mux") return `https://stream.mux.com/${asset.path}.m3u8`;

  return asset.path;
}
