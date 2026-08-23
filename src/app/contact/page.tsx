import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";
export default function ContactPage() { return <main className="editorial-page"><QuietHeader /><article><p className="eyebrow">Contact</p><h1>Start with<br />hello.</h1><section><p>Volunteer. Partner. Pray. Ask a question. Tell us what your community is carrying.</p><a className="contact-email" href="mailto:hello@humanhere.co">hello@humanhere.co</a></section><nav><Link href="/get-involved">Ways to show up →</Link><Link href="/humans">Meet a human →</Link></nav></article></main>; }
