import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { getHomepageHumans } from "@/lib/archive/repository";
import { toGlobeHumans } from "@/lib/archive/globe-dto";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default async function Home() {
  const initialBatch = await getHomepageHumans(96);
  return <HumanGlobe humans={toGlobeHumans(initialBatch.entries)} fixtureMode={initialBatch.entries.every(entry => entry.fixture)} />;
}
