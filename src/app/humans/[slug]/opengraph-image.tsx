import { ImageResponse } from "next/og";
import { getPublishedHumanBySlug } from "@/lib/archive/repository";
import { resolveMediaUrl } from "@/lib/media/resolver";
import { globeBackground, Kicker, OG_SIZE, ogFonts, Wordmark } from "@/lib/og/card";

export const alt = "A human story on HUMAN:HERE";
export const size = OG_SIZE;
export const contentType = "image/png";

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/[\s,.;:]+\S*$/, "")}…` : clean;
}

// Only a photo the member allowed for social sharing appears on the card.
async function sharedPhoto(url?: string) {
  if (!url) return undefined;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/^image\/(jpeg|png)$/.test(type)) return undefined;
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
  } catch {
    return undefined;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublishedHumanBySlug(slug);
  const anonymous = entry?.person?.anonymous;
  const name = !entry ? "A human story" : anonymous ? "Anonymous" : entry.person?.displayName ?? "A human";
  const words = clip(entry?.quote ?? entry?.headline ?? entry?.story ?? "Every light is a human.", 150);
  const place = entry?.person?.location;
  const photoUrl = entry?.socialImageAllowed && entry.thumbnail?.kind === "image" ? resolveMediaUrl(entry.thumbnail, "display") : undefined;
  const [fonts, background, photo] = await Promise.all([ogFonts(), globeBackground(), sharedPhoto(photoUrl)]);
  const quoteSize = words.length > 100 ? 40 : words.length > 60 ? 48 : 58;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: "#05070b" }}>
        { }
        <img src={background} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0, opacity: photo ? 0.35 : 0.55 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(5,7,11,.97) 0%, rgba(5,7,11,.86) 55%, rgba(5,7,11,.5) 100%)" }} />
        <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: photo ? 760 : 1200 }}>
            <Wordmark size={24} />
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <Kicker>A human story</Kicker>
              <div style={{ display: "flex", fontFamily: "Archivo", fontSize: quoteSize, lineHeight: 1.18, color: "#fafafa" }}>“{words}”</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Archivo", fontSize: 24, color: "rgba(226,232,245,.78)" }}>
              {name.toLowerCase() !== entry?.authorUsername?.toLowerCase() && <span style={{ color: "#fafafa" }}>{name}</span>}
              {place && !anonymous && <span>· {place}</span>}
              {entry?.authorUsername && <span style={{ color: "#9fb2ff" }}>@{entry.authorUsername}</span>}
            </div>
          </div>
          {photo && (
            <div style={{ display: "flex", width: 440, height: 630, borderLeft: "1px solid rgba(128,151,235,.25)" }}>
              { }
              <img src={photo} width={440} height={630} alt="" style={{ objectFit: "cover", filter: "grayscale(1) contrast(1.05) brightness(.9)" }} />
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
