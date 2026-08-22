import Link from "next/link";
import { BrandMark } from "./BrandMark";

const groups = [
  {
    label: "Explore",
    links: [
      { label: "People", href: "/people" },
      { label: "About", href: "/about" },
    ],
  },
  {
    label: "Participate",
    links: [
      { label: "Get involved", href: "/get-involved" },
      { label: "Give", href: "/give" },
    ],
  },
  {
    label: "Connect",
    links: [{ label: "Contact", href: "/contact" }],
  },
];

export function SiteMenu({ current }: { current: string }) {
  return (
    <details className="site-menu">
      <summary>
        <span className="site-menu__brand"><BrandMark showTagline={false} /></span>
        <span className="site-menu__current">Menu <em>{current}</em></span>
        <span className="site-menu__toggle" aria-hidden="true" />
      </summary>
      <div className="site-menu__groups">
        {groups.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            <nav aria-label={group.label}>
              {group.links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
            </nav>
          </section>
        ))}
      </div>
    </details>
  );
}
