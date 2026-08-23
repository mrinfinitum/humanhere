import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() { return <><SiteHeader /><main className="not-found shell"><p className="eyebrow">404</p><h1>This page isn&apos;t here.</h1><Link className="text-link" href="/">Return home <span>→</span></Link></main><SiteFooter /></>; }
