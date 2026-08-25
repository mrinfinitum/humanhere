import type { Metadata } from "next";
import { ArchiveField } from "@/components/archive/ArchiveField";
import { getPublishedHumanBatch } from "@/lib/archive/repository";

export const metadata: Metadata = { title: "Humans", description: "Faces, voices, notes, places, and stories in the HUMAN:HERE archive." };

export default async function HumansPage() {
  const initialBatch = await getPublishedHumanBatch({ limit: 30 });
  return <ArchiveField initialBatch={initialBatch} />;
}
