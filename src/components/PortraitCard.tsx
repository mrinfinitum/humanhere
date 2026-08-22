import Image from "next/image";
import type { Portrait } from "@/data/portraits";

type PortraitCardProps = {
  portrait: Portrait;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export function PortraitCard({ portrait, priority = false, className = "", sizes = "(max-width: 768px) 80vw, 25vw" }: PortraitCardProps) {
  return (
    <article className={`portrait-card ${className}`}>
      <Image
        src={portrait.image}
        alt={portrait.alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectPosition: portrait.position }}
      />
      <div className="portrait-card__reveal">
        <span>{portrait.name}</span>
        <p>{portrait.descriptor}</p>
      </div>
    </article>
  );
}
