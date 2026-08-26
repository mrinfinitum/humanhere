import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { toGlobeHumans } from "@/lib/archive/globe-dto";
import { GLOBE_MOCK_ENTRIES, globeMocksEnabled } from "@/lib/archive/globe-mocks";
import { getGlobeDiscoveryCandidates } from "@/lib/archive/repository";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default async function Home() {
  const candidates = await getGlobeDiscoveryCandidates(96);
  const humans = globeMocksEnabled()
    ? toGlobeHumans(GLOBE_MOCK_ENTRIES, GLOBE_MOCK_ENTRIES.length)
    : toGlobeHumans(candidates, 96);
  return <HumanGlobe humans={humans} />;
}
