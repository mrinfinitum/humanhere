import Link from "next/link";
import { BrandMark } from "./BrandMark";

const links = [
  ["About", "/about"],
  ["People", "/people"],
  ["Get involved", "/get-involved"],
  ["Contact", "/contact"],
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`site-header ${overlay ? "site-header--overlay" : ""}`}>
      <div className="announcement">People need people. <Link href="/get-involved">Show up today <span>→</span></Link></div>
      <div className="site-header__bar shell">
        <BrandMark light={overlay} />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          <Link href="/give" className="pill-link">Give</Link>
        </nav>
        <details className="mobile-menu">
          <summary>Menu <span aria-hidden="true" /></summary>
          <nav aria-label="Mobile navigation">
            {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            <Link href="/give">Give</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
