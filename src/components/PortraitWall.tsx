import Image from "next/image";
import { portraits } from "@/data/portraits";

export function PortraitWall() {
  return (
    <section className="portrait-wall" id="stories" aria-labelledby="portrait-wall-title">
      <div className="portrait-wall__question">
        <h2 id="portrait-wall-title">Who needs <em>help?</em></h2>
        <p>You can&apos;t always tell.<br />That&apos;s the point.</p>
      </div>

      <div className="portrait-wall__composition" role="list" aria-label="People in the HUMAN:HERE community">
        {portraits.map((portrait, index) => (
          <figure className={`portrait-wall__portrait portrait-wall__portrait--${index + 1}`} key={portrait.id} role="listitem" tabIndex={0}>
            <Image
              src={portrait.image}
              alt={portrait.alt}
              fill
              sizes="(max-width: 767px) 82vw, (max-width: 1100px) 45vw, 34vw"
              style={{ objectPosition: portrait.position }}
            />
            <figcaption><strong>{portrait.name}</strong><span>{portrait.descriptor}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
