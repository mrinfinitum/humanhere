import type { Metadata } from "next";
import { PeopleField } from "@/components/PeopleField";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "People", description: "Explore the people and stories in the HUMAN:HERE archive." };

export default function PeoplePage() {
  return <><SiteHeader overlay /><main><PeopleField /></main></>;
}
