export function Manifesto() {
  return (
    <section className="manifesto" id="about" aria-labelledby="manifesto-title">
      <div className="manifesto__statement">
        <h2 id="manifesto-title"><span>People</span><em>need</em><span>people.</span></h2>
      </div>
      <div className="manifesto__copy">
        <p className="manifesto__lead">Technology can connect us.<br />Systems can support us.<br />But people still have to show up.</p>
      </div>
      <p className="manifesto__margin">Human connection<br />cannot be automated.</p>
    </section>
  );
}
