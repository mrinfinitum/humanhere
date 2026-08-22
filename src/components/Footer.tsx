import { BrandMark } from "./BrandMark";

const primaryLinks = [
  { label: "About", href: "#about" },
  { label: "Stories", href: "#stories" },
  { label: "Get involved", href: "#involved" },
  { label: "Give", href: "#give" },
  { label: "Contact", href: "mailto:hello@humanhere.co" },
];
const socialLinks = ["Instagram", "TikTok", "YouTube"];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__top">
        <BrandMark inverse />
        <p>Be human.<br />Be here<span className="headline-period">.</span></p>
      </div>
      <div className="page-shell site-footer__links">
        <nav aria-label="Footer navigation">
          {primaryLinks.map((link) => (
            <a href={link.href} key={link.label}>{link.label}</a>
          ))}
        </nav>
        <nav aria-label="Social media">
          {socialLinks.map((link) => <a href="#social" key={link}>{link}</a>)}
        </nav>
      </div>
      <div className="page-shell site-footer__bottom">
        <span>humanhere.co</span>
        <span>© {new Date().getFullYear()} HUMAN:HERE</span>
        <span><a href="mailto:hello@humanhere.co?subject=Privacy">Privacy</a> / <a href="mailto:hello@humanhere.co?subject=Legal">Legal</a></span>
        <BrandMark compact inverse showTagline={false} />
      </div>
    </footer>
  );
}
