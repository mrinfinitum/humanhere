import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

const asset = (name: string) => readFile(join(process.cwd(), "assets/og", name));

export async function ogFonts() {
  const [display, light, body] = await Promise.all([asset("archivo-125-700.ttf"), asset("archivo-125-300.ttf"), asset("archivo-100-400.ttf")]);
  return [
    { name: "Archivo Wide", data: display, weight: 700 as const, style: "normal" as const },
    { name: "Archivo Wide", data: light, weight: 300 as const, style: "normal" as const },
    { name: "Archivo", data: body, weight: 400 as const, style: "normal" as const },
  ];
}

export async function globeBackground() {
  return `data:image/jpeg;base64,${(await asset("globe.jpg")).toString("base64")}`;
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: "flex", fontFamily: "Archivo Wide", fontWeight: 300, fontSize: size, letterSpacing: "0.31em", color: "rgba(250,250,250,.94)" }}>
      HUMAN<span style={{ color: "#5074ff" }}>:</span>HERE
    </div>
  );
}

export function Kicker({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Archivo", fontSize: 17, letterSpacing: "0.32em", color: "rgba(250,250,250,.62)", textTransform: "uppercase" }}>
      <div style={{ width: 9, height: 9, borderRadius: 9, background: "#315dff", boxShadow: "0 0 14px #315dff" }} />
      {children}
    </div>
  );
}
