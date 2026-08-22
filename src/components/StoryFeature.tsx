import Image from "next/image";

export function StoryFeature() {
  return (
    <section className="story-feature" aria-labelledby="story-feature-title">
      <Image
        src="/images/portrait-james.jpg"
        alt="James looking directly into the camera"
        fill
        sizes="100vw"
        style={{ objectPosition: "center 29%" }}
      />
      <div className="story-feature__veil" aria-hidden="true" />
      <div className="story-feature__meta">
        <p>James / Tulsa</p>
        <p>Father. Veteran. Neighbor.</p>
      </div>
      <div className="story-feature__quote">
        <h2 id="story-feature-title">“People stopped<br />asking my name.”</h2>
        <a href="mailto:hello@humanhere.co?subject=Tell%20me%20James%27%20story">Read James&apos; story <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
