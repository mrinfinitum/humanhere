import type { Metadata } from "next";
import { ArchiveField } from "@/components/archive/ArchiveField";
import { humanArchiveRepository } from "@/lib/archive/repository";

export const metadata: Metadata = {
  title: "HUMAN:HERE — People Need People",
  description: "Enter a living archive of human faces, voices, notes, places, and stories.",
};

export default async function Home() {
  const initialBatch = await humanArchiveRepository.list({ limit: 20 });
  return <ArchiveField initialBatch={initialBatch} />;
}
