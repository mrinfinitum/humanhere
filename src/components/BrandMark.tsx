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
      <span
        className={`compact-mark ${inverse ? "compact-mark--inverse" : ""} ${className}`}
        aria-label="HUMAN:HERE"
      >
        <span>H</span>
        <span className="brand-colon" aria-hidden="true">:</span>
        <span>H</span>
      </span>
    );
  }

  return (
    <span className={`brand-lockup ${inverse ? "brand-lockup--inverse" : ""} ${className}`}>
      <span className="brand-frame" aria-label="HUMAN:HERE">
        <span>HUMAN</span>
        <span>
          <span className="brand-colon" aria-hidden="true">:</span>
          <span>HERE</span>
        </span>
      </span>
      {showTagline && <span className="brand-tagline">People need people.</span>}
    </span>
  );
}
