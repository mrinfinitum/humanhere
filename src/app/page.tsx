import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { GLOBE_PREVIEW_BEAMS } from "@/components/globe/previewBeams";
import { toGlobeHumans } from "@/lib/archive/globe-dto";
import { GLOBE_MOCK_ENTRIES, globeMocksEnabled } from "@/lib/archive/globe-mocks";
import { getGlobeDiscoveryCandidates } from "@/lib/archive/repository";
import { getWorldDemoEntries, worldDemoEnabled } from "@/lib/archive/world-demo";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

// The homepage lights are real published stories, the same ones /world shows,
// so each one opens its story; the globe just shows fewer at a time here.
// Until stories are published it keeps the decorative preview lights.
export default async function Home() {
  const demoMode = worldDemoEnabled();
  const candidates = demoMode
    ? getWorldDemoEntries()
    : globeMocksEnabled()
      ? GLOBE_MOCK_ENTRIES
      : await getGlobeDiscoveryCandidates(48);
  const humans = toGlobeHumans(candidates, 48);
  return <HumanGlobe humans={humans.length ? humans : GLOBE_PREVIEW_BEAMS} mode="home" />;
}
