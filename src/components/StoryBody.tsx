import type { Person } from "@/data/people";
import { StoryImage } from "./StoryImage";

export function StoryBody({ person }: { person: Person }) {
  return (
    <div className="story-body">
      <aside className="fixture-notice">Development fixture. Final text and photography require the featured person&apos;s consent and approval.</aside>
      {person.storySections?.map((section, index) => (
        <section key={`${person.slug}-${section.heading}`} className="story-section">
          <p className="story-section__index">{String(index + 1).padStart(2, "0")}</p>
          <div><h2>{section.heading}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          {section.image && section.imageAlt && <StoryImage src={section.image} alt={section.imageAlt} position={section.imagePosition} />}
        </section>
      ))}
    </div>
  );
}
