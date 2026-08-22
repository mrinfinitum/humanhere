import { BrandMark } from "./BrandMark";

const primaryLinks = [
  { label: "Stories", href: "#stories" },
  { label: "About", href: "#about" },
  { label: "Get involved", href: "#involved" },
  { label: "Give", href: "#give" },
  { label: "Contact", href: "mailto:hello@humanhere.co" },
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
          {primaryLinks.map((link) => <a href={link.href} key={link.label}>{link.label}</a>)}
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
