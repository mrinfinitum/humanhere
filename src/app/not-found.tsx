import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return <><Header /><main id="main-content" className="single-action-page"><p>404</p><h1>Not here<span>.</span></h1><Link className="text-link" href="/people">Meet someone <span aria-hidden="true">→</span></Link></main><Footer /></>;
}
