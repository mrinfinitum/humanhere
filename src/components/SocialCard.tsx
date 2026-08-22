import Image from "next/image";
import { BrandMark } from "./BrandMark";

type SocialCardProps = {
  variant: "type" | "portrait" | "movement" | "brand";
  headline: React.ReactNode;
  image?: string;
  imageAlt?: string;
  className?: string;
};

export function SocialCard({ variant, headline, image, imageAlt = "", className = "" }: SocialCardProps) {
  return (
    <article className={`social-card social-card--${variant} ${className}`}>
      {image && <Image src={image} alt={imageAlt} fill sizes="(max-width: 768px) 72vw, 24vw" />}
      <div className="social-card__content">
        <p>{headline}</p>
        {variant === "movement" && <span>For someone.</span>}
        {variant === "portrait" && <span>People need people.</span>}
        {variant === "brand" && <BrandMark inverse showTagline />}
      </div>
    </article>
  );
}
