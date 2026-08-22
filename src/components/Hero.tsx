import Image from "next/image";
import { portraits } from "@/data/portraits";

export function Hero() {
  const [maya, james, lena, miguel] = portraits;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__faces" aria-label="Four close portraits of community members">
        <div className="hero__face hero__face--main">
          <Image
            src={maya.image}
            alt={maya.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 78vw"
            style={{ objectPosition: maya.position }}
          />
        </div>
        {[james, lena, miguel].map((portrait, index) => (
          <div className={`hero__face hero__face--${index + 1}`} key={portrait.id}>
            <Image
              src={portrait.image}
              alt={portrait.alt}
              fill
              priority
              sizes="(max-width: 768px) 33vw, 22vw"
              style={{ objectPosition: portrait.position }}
            />
          </div>
        ))}
      </div>
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__copy page-shell">
        <p className="eyebrow hero__eyebrow"><span>01</span> / 09</p>
        <h1 id="hero-title">
          Don&apos;t<br />look<br />away<span className="headline-period">.</span>
        </h1>
        <p className="hero__support">Human connection cannot be automated.</p>
        <a className="text-link text-link--inverse" href="#stories">Meet someone <span aria-hidden="true">→</span></a>
      </div>
      <p className="hero__hand-note">You matter here.</p>
      <div className="hero__caption" aria-hidden="true">People need people.</div>
    </section>
  );
}
