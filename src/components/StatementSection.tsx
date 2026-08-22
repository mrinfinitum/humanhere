type StatementSectionProps = {
  eyebrow?: string;
  headline: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
};

export function StatementSection({ eyebrow, headline, children, id, className = "" }: StatementSectionProps) {
  return (
    <section className={`statement-section ${className}`} id={id}>
      <div className="page-shell statement-section__grid">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{headline}</h2>
        <div className="statement-section__body">{children}</div>
      </div>
    </section>
  );
}
