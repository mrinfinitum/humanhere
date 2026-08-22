"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

const navigation = [
  { label: "Stories", href: "#stories" },
  { label: "About", href: "#about" },
  { label: "Get involved", href: "#involved" },
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
    document.body.classList.add("menu-is-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("menu-is-open");
    };
  }, [open]);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <a className="header-brand" href="#top" aria-label="HUMAN:HERE home">
        <BrandMark showTagline={false} />
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
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

      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open} inert={!open ? true : undefined}>
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}<span aria-hidden="true">↗</span></a>
          ))}
        </nav>
        <p>Human connection cannot be automated.</p>
      </div>
    </header>
  );
}
