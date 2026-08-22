type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function BrandMark({
  compact = false,
  inverse = false,
  showTagline = true,
  className = "",
}: BrandMarkProps) {
  if (compact) {
    return (
      <span className={`compact-mark ${inverse ? "is-inverse" : ""} ${className}`} aria-label="HUMAN:HERE">
        H<span className="brand-colon" aria-hidden="true">:</span>H
      </span>
    );
  }

  return (
    <span className={`brand-lockup ${inverse ? "is-inverse" : ""} ${className}`}>
      <span className="brand-wordmark" aria-label="HUMAN:HERE">
        HUMAN<span className="brand-colon" aria-hidden="true">:</span>HERE
      </span>
      {showTagline && <span className="brand-tagline">People need people.</span>}
    </span>
  );
}
