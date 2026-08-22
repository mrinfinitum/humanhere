import Image from "next/image";

export function HeroPortrait() {
  return (
    <section className="hero-portrait" id="top" aria-labelledby="hero-title">
      <div className="hero-portrait__image">
        <Image
          src="/images/hero-maya.jpg"
          alt="Maya looking directly into the camera"
          fill
          priority
          sizes="(max-width: 767px) 100vw, 61vw"
        />
      </div>
      <div className="hero-portrait__copy">
        <p className="hero-portrait__kicker">Human connection cannot be automated.</p>
        <h1 id="hero-title"><span>Don&apos;t</span><span>look</span><em>away.</em></h1>
        <div className="hero-portrait__footer">
          <p>People need people.</p>
          <a href="#stories">Meet someone <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
