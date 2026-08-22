import Image from "next/image";

export function StoryFeature() {
  return (
    <section className="story-feature" aria-labelledby="story-feature-title">
      <div className="story-feature__image">
        <Image
          src="/images/portrait-james.jpg"
          alt="James looking directly into the camera"
          fill
          sizes="(max-width: 767px) 100vw, 48vw"
          style={{ objectPosition: "center 29%" }}
        />
      </div>
      <div className="story-feature__quote">
        <p className="story-feature__meta">James / Tulsa</p>
        <h2 id="story-feature-title">“People stopped <em>asking my name.</em>”</h2>
        <a href="mailto:hello@humanhere.co?subject=Tell%20me%20James%27%20story">Meet James <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
