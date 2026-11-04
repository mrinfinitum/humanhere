import Link from "next/link";
import { AccountLink } from "./AccountLink";
import "./quiet-header.css";

export function QuietHeader() {
  return <header className="quiet-header"><Link className="quiet-mark" href="/">HUMAN<span>:</span>HERE</Link><nav aria-label="Main navigation"><Link href="/world">Humans</Link><Link href="/mission">Mission</Link><Link href="/share">Tell your story</Link><Link href="/give">Give</Link><AccountLink /></nav></header>;
}
