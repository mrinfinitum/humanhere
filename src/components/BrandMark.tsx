import Link from "next/link";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand-mark ${light ? "brand-mark--light" : ""}`} aria-label="HUMAN:HERE home">
      <span className="brand-mark__icon" aria-hidden="true"><i>H</i><b /><i>H</i></span>
      <span className="brand-mark__name">HUMAN<span>:</span>HERE</span>
    </Link>
  );
}
