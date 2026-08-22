import Image from "next/image";

export function HeroPortrait() {
  return (
    <section className="hero-portrait" id="top" aria-labelledby="hero-title">
      <Image
        className="hero-portrait__image"
        src="/images/hero-maya.jpg"
        alt="Maya looking directly into the camera"
        fill
        priority
        sizes="100vw"
      />
      <div className="hero-portrait__veil" aria-hidden="true" />
      <div className="hero-portrait__copy">
        <h1 id="hero-title">Don&apos;t<br />look<br />away<span>.</span></h1>
        <div className="hero-portrait__footer">
          <p>People need people.</p>
          <a href="#stories">Meet someone <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
