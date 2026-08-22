import Image from "next/image";

export function StoryImage({ src, alt, position }: { src: string; alt: string; position?: string }) {
  return <figure className="story-image"><Image src={src} alt={alt} fill sizes="(max-width: 767px) 100vw, 80vw" style={{ objectPosition: position }} /></figure>;
}
