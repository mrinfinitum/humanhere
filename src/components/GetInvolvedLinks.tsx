import Link from "next/link";

const actions = [
  { label: "Give", href: "/give", detail: "Support the work." },
  { label: "Volunteer", href: "/contact?interest=volunteer", detail: "Offer your time." },
  { label: "Partner", href: "/contact?interest=partner", detail: "Work together." },
  { label: "Pray", href: "/contact?interest=pray", detail: "Stand with people." },
];

export function GetInvolvedLinks({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`involvement-directory ${compact ? "is-compact" : ""}`} aria-labelledby="involvement-heading">
      <header><p>People need people.</p><h2 id="involvement-heading">Show up<span>.</span></h2></header>
      <nav aria-label="Ways to get involved">
        {actions.map((action) => (
          <Link href={action.href} key={action.label}><span>{action.label}</span><small>{action.detail}</small><b aria-hidden="true">↗</b></Link>
        ))}
      </nav>
    </section>
  );
}
