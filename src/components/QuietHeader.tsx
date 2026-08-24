import Link from "next/link";

export function QuietHeader() {
  return <header className="quiet-header"><Link className="quiet-mark" href="/">HUMAN<span>:</span>HERE</Link><nav aria-label="Main navigation"><Link href="/humans">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Share</Link><Link href="/support">Support</Link></nav></header>;
}
