import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "About",
  description: "Why HUMAN:HERE exists: people still have to show up for people.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="text-page">
        <header className="page-intro">
          <p>About HUMAN:HERE</p>
          <h1>People need people<span>.</span></h1>
        </header>
        <div className="editorial-copy">
          <section><h2>Why we exist</h2><p>Technology can connect us. Systems can support us. But people still have to show up.</p><p>HUMAN:HERE brings people and organizations together to meet real needs with dignity, compassion, and presence.</p></section>
          <section><h2>Why we show up</h2><p>Jesus taught us to see people others pass by, love our neighbors, and serve with humility.</p><p>Our faith is why we act. Our help is offered with dignity and without condition.</p></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
