import { ImageResponse } from "next/og";
import { globeBackground, Kicker, OG_SIZE, ogFonts, Wordmark } from "@/lib/og/card";

export const alt = "HUMAN:HERE. People need people. Every light on the globe is a real human story.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [fonts, background] = await Promise.all([ogFonts(), globeBackground()]);
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: "#05070b" }}>
        { }
        <img src={background} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(5,7,11,.96) 0%, rgba(5,7,11,.78) 38%, rgba(5,7,11,0) 70%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: "100%" }}>
          <Wordmark />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Kicker>Every light is a human</Kicker>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Archivo Wide", fontWeight: 700, fontSize: 92, lineHeight: 0.98, color: "#fafafa", letterSpacing: "0.01em" }}>
              <span>PEOPLE</span><span>NEED</span><span style={{ color: "#9fb2ff" }}>PEOPLE.</span>
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 24, color: "rgba(226,232,245,.78)" }}>Real stories. Real needs. No ads, no algorithm.</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
