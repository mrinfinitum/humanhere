import Image from "next/image";
import { ActionSection } from "@/components/ActionSection";
import { AnalogArtifact } from "@/components/AnalogArtifact";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ImpactStats } from "@/components/ImpactStats";
import { PortraitGrid } from "@/components/PortraitGrid";
import { SocialCard } from "@/components/SocialCard";
import { StatementSection } from "@/components/StatementSection";

const work = [
  { title: "See", description: "Raise awareness." },
  { title: "Connect", description: "Bring people and organizations together." },
  { title: "Serve", description: "Meet practical needs." },
  { title: "Multiply", description: "Strengthen work already happening." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />

        <StatementSection
          id="about"
          eyebrow="01 / The idea"
          headline={<>People need<br />people<span className="headline-period">.</span></>}
          className="brand-idea"
        >
          <p>Technology can connect us.<br />Systems can support us.<br />But people still have to show up.</p>
          <p>HUMAN:HERE brings people, churches, businesses, volunteers, and community organizations together to meet real needs with compassion, dignity, and presence.</p>
        </StatementSection>

        <aside className="street-ribbon" aria-label="HUMAN:HERE movement statements">
          <div>
            <span>See people.</span>
            <span aria-hidden="true">:</span>
            <span>Love requires presence.</span>
            <span aria-hidden="true">:</span>
            <span>Show up for someone.</span>
          </div>
        </aside>

        <PortraitGrid />

        <section className="story-statement" aria-labelledby="story-heading">
          <Image
            src="/images/portrait-james.jpg"
            alt="Close black-and-white portrait of James looking directly at the camera"
            fill
            sizes="100vw"
            style={{ objectPosition: "center 31%" }}
          />
          <div className="story-statement__shade" aria-hidden="true" />
          <div className="page-shell story-statement__content">
            <p className="eyebrow">03 / Stories</p>
            <h2 id="story-heading">Every number<br />has a name<span className="headline-period">.</span></h2>
            <div>
              <p>Statistics tell us how big the problem is.<br />Stories remind us why one person matters.</p>
              <a className="text-link text-link--inverse" href="#stories">Meet the people <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <section className="work-section" id="partners" aria-labelledby="work-heading">
          <div className="page-shell">
            <div className="work-section__heading">
              <p className="eyebrow">04 / What we do</p>
              <h2 id="work-heading">Presence into practice.</h2>
              <p className="work-section__note">Built with people.<br />Never just for them.</p>
            </div>
            <div className="work-grid">
              {work.map((item, index) => (
                <article key={item.title}>
                  <span>0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ImpactStats />

        <section className="faith-section" aria-labelledby="faith-heading">
          <div className="page-shell faith-section__grid">
            <p className="eyebrow">06 / Our why</p>
            <div className="faith-section__colon" aria-hidden="true"><span>•</span><span>•</span></div>
            <div>
              <h2 id="faith-heading">Why we show up</h2>
              <p>Jesus taught us to see people others pass by, love our neighbors, and serve with humility.</p>
              <p>Our faith is why we act.<br />Our help is offered with dignity and without condition.</p>
              <p className="faith-section__note">Love looks like showing up.</p>
              <a className="text-link" href="mailto:hello@humanhere.co?subject=Tell%20me%20more%20about%20your%20why">Our why <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <ActionSection />
        <AnalogArtifact />

        <section className="social-section" id="social" aria-labelledby="social-heading">
          <div className="page-shell social-section__heading">
            <p className="eyebrow">Made to move</p>
            <h2 id="social-heading">A message bigger than a feed.</h2>
            <p>Screenshot it. Print it. Pass it on.</p>
          </div>
          <div className="social-track page-shell">
            <SocialCard variant="portrait" image="/images/portrait-james.jpg" imageAlt="Portrait of James" headline={<>Don&apos;t<br />scroll<br />past me<span className="headline-period">.</span></>} />
            <SocialCard variant="type" headline={<>People<br />need<br />people<span className="headline-period">.</span></>} />
            <SocialCard variant="movement" headline={<>Show up<span className="headline-period">.</span></>} />
            <SocialCard variant="brand" headline={<span className="sr-only">HUMAN:HERE. People need people.</span>} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
