import type { Metadata } from "next";
import { HumanGlobe } from "@/components/archive/HumanGlobe";
import { toGlobeHumans } from "@/lib/archive/globe-dto";
import { getHomepageHumans } from "@/lib/archive/repository";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default async function Home() {
  const initialBatch = await getHomepageHumans(96);
  const humans = toGlobeHumans(initialBatch.entries, 24);
  return <HumanGlobe humans={humans} />;
}
