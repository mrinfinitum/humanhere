import Link from "next/link";

export function Manifesto() {
  return (
    <section className="manifesto" aria-labelledby="manifesto-heading">
      <p className="manifesto__eyebrow">HUMAN:HERE</p>
      <h2 id="manifesto-heading">People need people<span>.</span></h2>
      <div className="manifesto__copy">
        <p>Technology can connect us.<br />Systems can support us.<br />But people still have to show up.</p>
        <Link className="text-link" href="/about">Why we are here <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
