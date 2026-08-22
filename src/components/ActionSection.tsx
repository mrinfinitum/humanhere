const actions = [
  { label: "Give", detail: "Make room for hope.", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20give" },
  { label: "Volunteer", detail: "Give your time.", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20volunteer" },
  { label: "Partner", detail: "Bring what you have.", href: "mailto:hello@humanhere.co?subject=I%20want%20to%20partner" },
  { label: "Pray", detail: "Hold someone close.", href: "mailto:hello@humanhere.co?subject=How%20can%20I%20pray%3F" },
];

export function ActionSection() {
  return (
    <section className="action-section" id="involved" aria-labelledby="action-heading">
      <div className="page-shell">
        <p className="eyebrow">08 / Your move</p>
        <h2 id="action-heading">Show up<span className="headline-period">.</span></h2>
        <div className="action-grid" id="give">
          {actions.map((action, index) => (
            <a href={action.href} key={action.label}>
              <span className="action-grid__number">0{index + 1}</span>
              <span className="action-grid__label">{action.label}</span>
              <span className="action-grid__detail">{action.detail}</span>
              <span className="action-grid__arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
