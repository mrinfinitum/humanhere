import Image from "next/image";

export function LoveLooks() {
  return (
    <section className="love-looks" aria-labelledby="love-looks-title">
      <div className="love-looks__image">
        <Image
          src="/images/community-table.jpg"
          alt="Neighbors sharing a meal and laughing together around a community table"
          fill
          sizes="100vw"
        />
        <div className="love-looks__veil" aria-hidden="true" />
        <h2 id="love-looks-title"><span>Love looks like</span><em>showing up.</em></h2>
      </div>

      <div className="love-looks__faith">
        <p className="love-looks__faith-lead">Jesus taught us to see people others pass by, love our neighbors, and serve with humility.</p>
        <p>Our faith is why we act.<br />Our help is offered with dignity and without condition.</p>
      </div>
    </section>
  );
}
