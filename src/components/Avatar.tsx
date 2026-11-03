import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media/resolver";

/** A member's profile photo, or the first letter of their name when they have none. */
export function Avatar({ name, path, size = 48, className = "" }: { name: string; path?: string | null; size?: number; className?: string }) {
  const initial = name.replace(/^@/, "").charAt(0).toUpperCase() || "·";
  return (
    <span className={`avatar ${className}`.trim()} style={{ width: size, height: size, fontSize: Math.round(size * .42) }} aria-hidden="true">
      {path ? <Image src={resolveMediaUrl({ id: path, provider: "neon", path, kind: "image", alt: "", mimeType: "image/jpeg" })} alt="" fill sizes={`${size * 2}px`} /> : initial}
    </span>
  );
}
