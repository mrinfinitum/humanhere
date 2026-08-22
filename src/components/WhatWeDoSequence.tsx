import Image from "next/image";
import { impactStats } from "@/data/stats";

const work = [
  { word: "See.", copy: "Raise awareness of people and needs our communities overlook." },
  { word: "Connect.", copy: "Bring people, churches, businesses, and organizations together." },
  { word: "Serve.", copy: "Meet practical needs with dignity." },
  { word: "Multiply.", copy: "Strengthen organizations already doing meaningful work." },
];

export function WhatWeDoSequence() {
  return (
    <section className="purpose" aria-label="What HUMAN:HERE does">
      <div className="purpose__sequence">
        <div className="purpose__rail">
          <p>What we do</p>
          <span>Love requires presence.</span>
        </div>
        <div className="purpose__statements">
          {work.map((item) => (
            <article key={item.word}>
              <h2>{item.word}</h2>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="hope" aria-labelledby="hope-title">
        <Image src="/images/community-table.jpg" alt="Neighbors sharing a meal and laughing around a community table" fill sizes="100vw" />
        <div className="hope__veil" aria-hidden="true" />
        <h2 id="hope-title">This is what<br />showing up<br />looks like<span>.</span></h2>
        <p>See → know → hope → act</p>
      </div>

      <div className="impact" aria-labelledby="impact-title">
        <div className="impact__intro">
          <h2 id="impact-title">People,<br />not metrics.</h2>
          <p>Numbers help us measure reach.<br />They never replace the people.</p>
        </div>
        <dl className="impact__numbers">
          {impactStats.map((stat) => (
            <div key={stat.label}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="faith" aria-labelledby="faith-title">
        <p className="faith__kicker">Why we show up</p>
        <h2 id="faith-title">Jesus taught us to see people others pass by, love our neighbors, and serve with humility.</h2>
        <div className="faith__close">
          <p>Our faith is why we act.<br />Our help is offered with dignity and without condition.</p>
          <p>Love looks like showing up.</p>
        </div>
      </div>
    </section>
  );
}
