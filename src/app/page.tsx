import type { Metadata } from "next";
import { ArchiveField } from "@/components/archive/ArchiveField";
import { getHomepageHumans } from "@/lib/archive/repository";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default async function Home() {
  const initialBatch = await getHomepageHumans(40);
  return <ArchiveField initialBatch={initialBatch} />;
}
