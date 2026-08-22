import Link from "next/link";

export function PanelFooter() {
  return (
    <footer className="panel-footer">
      <p>HUMAN<span>:</span>HERE</p>
      <nav aria-label="Footer navigation">
        <Link href="/people">People</Link>
        <Link href="/about">About</Link>
        <Link href="/get-involved">Get involved</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <small>People need people. © {new Date().getFullYear()}</small>
    </footer>
  );
}
