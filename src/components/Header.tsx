"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

const navigation = [
  { label: "About", href: "#about" },
  { label: "Stories", href: "#stories" },
  { label: "Get involved", href: "#involved" },
  { label: "Partners", href: "#partners" },
  { label: "Give", href: "#give" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <a className="header-brand" href="#top" aria-label="HUMAN:HERE home">
        <BrandMark showTagline={false} />
        <BrandMark compact showTagline={false} />
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
        <a className="button button--small" href="#involved">Show up</a>
      </nav>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <div
        id="mobile-menu"
        className={`mobile-menu ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>{item.label}
            </a>
          ))}
        </nav>
        <p>Human connection cannot be automated.</p>
      </div>
    </header>
  );
}
