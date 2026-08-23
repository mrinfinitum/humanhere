import Link from "next/link";
import { QuietHeader } from "@/components/QuietHeader";
export default function NotFound() { return <main className="editorial-page"><QuietHeader /><article><p className="eyebrow">404</p><h1>No one<br />is here.</h1><nav><Link href="/humans">Return to the humans →</Link></nav></article></main>; }
