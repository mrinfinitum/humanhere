export function AnalogArtifact() {
  return (
    <section className="artifact-section" aria-labelledby="artifact-heading">
      <div className="page-shell artifact-section__grid">
        <div>
          <p className="eyebrow">09 / A human artifact</p>
          <h2 id="artifact-heading">Proof that someone was here.</h2>
          <p className="artifact-section__copy">Sometimes impact looks like a report. Sometimes it looks like a note folded into a coat pocket.</p>
        </div>
        <figure className="artifact-note">
          <span className="artifact-note__tape" aria-hidden="true" />
          <blockquote>
            “Thank you for<br />remembering my name.”
          </blockquote>
          <figcaption>— A note from Tuesday</figcaption>
          <span className="artifact-note__mark" aria-hidden="true">:</span>
        </figure>
      </div>
    </section>
  );
}
