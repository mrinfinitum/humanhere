import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { GLOBE_PREVIEW_BEAMS } from "@/components/globe/previewBeams";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default function Home() {
  return <HumanGlobe humans={GLOBE_PREVIEW_BEAMS} mode="home" />;
}
