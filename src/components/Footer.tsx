import Link from "next/link";
import { BrandMark } from "./BrandMark";

const primaryLinks = [
  { label: "People", href: "/people" },
  { label: "About", href: "/about" },
  { label: "Get involved", href: "/get-involved" },
  { label: "Give", href: "/give" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__identity">
        <BrandMark inverse showTagline={false} />
        <p>People need people<span>.</span></p>
      </div>
      <div className="site-footer__navigation">
        <nav aria-label="Footer navigation">
          {primaryLinks.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
        </nav>
        <nav aria-label="Social media">
          <a href="mailto:hello@humanhere.co?subject=Instagram">Instagram</a>
          <a href="mailto:hello@humanhere.co?subject=TikTok">TikTok</a>
          <a href="mailto:hello@humanhere.co?subject=YouTube">YouTube</a>
        </nav>
      </div>
      <div className="site-footer__legal">
        <span>humanhere.co</span>
        <span>© {new Date().getFullYear()} HUMAN:HERE</span>
        <a href="mailto:hello@humanhere.co?subject=Privacy">Privacy</a>
      </div>
    </footer>
  );
}
