import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { toGlobeHumans } from "@/lib/archive/globe-dto";
import { GLOBE_MOCK_ENTRIES, globeMocksEnabled } from "@/lib/archive/globe-mocks";
import { getGlobeDiscoveryCandidates } from "@/lib/archive/repository";

export const metadata: Metadata = {
  title: "Explore the World",
  description: "Explore a living globe of published HUMAN:HERE stories.",
};

export default async function WorldPage() {
  const candidates = await getGlobeDiscoveryCandidates(96);
  const humans = globeMocksEnabled()
    ? toGlobeHumans(GLOBE_MOCK_ENTRIES, GLOBE_MOCK_ENTRIES.length)
    : toGlobeHumans(candidates, 96);

  return <HumanGlobe humans={humans} mode="world" />;
}
