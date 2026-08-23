import Image from "next/image";
import { SiteHeader } from "./SiteHeader";

type PageHeroProps = { eyebrow: string; title: string; image: string; imageAlt: string; imagePosition?: string };

export function PageHero({ eyebrow, title, image, imageAlt, imagePosition = "center" }: PageHeroProps) {
  return (
    <>
      <SiteHeader overlay />
      <section className="page-hero">
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" style={{ objectPosition: imagePosition }} />
        <div className="page-hero__shade" />
        <div className="shell page-hero__content"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>
        <span className="hero-rule" aria-hidden="true" />
      </section>
    </>
  );
}
