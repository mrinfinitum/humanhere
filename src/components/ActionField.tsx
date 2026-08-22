const actions = [
  { label: "Give", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20give" },
  { label: "Volunteer", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20volunteer" },
  { label: "Partner", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20partner" },
  { label: "Pray", href: "mailto:hello@humanhere.co?subject=How%20can%20I%20pray%3F" },
];

export function ActionField() {
  return (
    <section className="action-field" id="involved" aria-labelledby="action-title">
      <p>People need people.</p>
      <h2 id="action-title">Show up<span>.</span></h2>
      <nav id="give" aria-label="Ways to get involved">
        {actions.map((action) => <a key={action.label} href={action.href}>{action.label}<span aria-hidden="true">↗</span></a>)}
      </nav>
    </section>
  );
}
