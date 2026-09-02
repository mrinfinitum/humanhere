import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { toGlobeHumans } from "@/lib/archive/globe-dto";
import { GLOBE_MOCK_ENTRIES, globeMocksEnabled } from "@/lib/archive/globe-mocks";
import { getGlobeDiscoveryCandidates } from "@/lib/archive/repository";
import { getWorldDemoEntries, worldDemoEnabled } from "@/lib/archive/world-demo";

export const metadata: Metadata = {
  title: "Explore the World",
  description: "Explore a living globe of published HUMAN:HERE stories.",
};

export default async function WorldPage() {
  const demoMode = worldDemoEnabled();
  const developmentMocks = !demoMode && globeMocksEnabled();
  const candidates = demoMode
    ? getWorldDemoEntries()
    : developmentMocks
      ? GLOBE_MOCK_ENTRIES
      : await getGlobeDiscoveryCandidates(96);
  const humans = toGlobeHumans(candidates, demoMode || developmentMocks ? candidates.length : 96);

  return <HumanGlobe humans={humans} mode="world" demoMode={demoMode} />;
}
