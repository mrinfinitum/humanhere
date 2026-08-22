import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { GetInvolvedLinks } from "@/components/GetInvolvedLinks";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Get Involved", description: "Give, volunteer, partner, or pray with HUMAN:HERE." };

export default function GetInvolvedPage() {
  return <><Header /><main id="main-content" className="involved-page"><GetInvolvedLinks /></main><Footer /></>;
}
