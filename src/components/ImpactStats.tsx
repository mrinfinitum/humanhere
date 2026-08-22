import { impactStats } from "@/data/stats";

export function ImpactStats() {
  return (
    <section className="impact-section" aria-labelledby="impact-heading">
      <div className="page-shell">
        <div className="impact-section__heading">
          <p className="eyebrow">05 / Impact</p>
          <h2 id="impact-heading">People, not metrics.</h2>
          <p>Numbers help us measure reach. They never replace the people.</p>
        </div>
        <dl className="stats-grid">
          {impactStats.map((stat) => (
            <div key={stat.label} className={`stat stat--${stat.accent}`}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
