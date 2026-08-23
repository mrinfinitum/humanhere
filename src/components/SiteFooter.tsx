import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-callout">
        <p className="eyebrow">Stay close</p>
        <div>
          <h2>People are worth showing up for.</h2>
          <Link className="round-link round-link--light" href="/contact" aria-label="Contact HUMAN:HERE">↗</Link>
        </div>
      </div>
      <div className="shell footer-grid">
        <BrandMark light />
        <nav aria-label="Footer navigation">
          <Link href="/about">About</Link><Link href="/people">People</Link><Link href="/get-involved">Get involved</Link><Link href="/give">Give</Link><Link href="/contact">Contact</Link>
        </nav>
        <div className="footer-contact"><a href="mailto:hello@humanhere.co">hello@humanhere.co</a><span>Tulsa, Oklahoma</span></div>
      </div>
      <div className="shell footer-bottom"><span>© HUMAN:HERE 2026</span><span>Faith in action. Help without condition.</span></div>
    </footer>
  );
}
