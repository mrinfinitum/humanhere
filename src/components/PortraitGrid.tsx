import { portraits } from "@/data/portraits";
import { PortraitCard } from "./PortraitCard";

export function PortraitGrid() {
  return (
    <section className="faces-section" id="stories" aria-labelledby="faces-heading">
      <div className="page-shell faces-section__intro">
        <p className="eyebrow">02 / People</p>
        <h2 id="faces-heading">Who needs help?</h2>
        <p>You can&apos;t always tell.<br />That&apos;s the point.</p>
      </div>
      <div className="portrait-track page-shell" role="list" aria-label="Community portraits">
        {portraits.map((portrait, index) => (
          <div role="listitem" key={portrait.id}>
            <PortraitCard portrait={portrait} priority={index === 0} />
          </div>
        ))}
      </div>
      <p className="portrait-hint page-shell">Hover, focus, or tap to meet someone.</p>
    </section>
  );
}
