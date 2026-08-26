"use client";

import Link from "next/link";
import type { RefObject } from "react";
import type { GlobeHuman } from "./types";

type Props = {
  human: GlobeHuman;
  anchorRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  connectorRef: RefObject<SVGPathElement | null>;
  onClose: () => void;
};

/** The sole DOM representation of a selected Human. */
export function HumanCalloutOverlay({ human, anchorRef, panelRef, connectorRef, onClose }: Props) {
  return (
    <>
      <svg className="human-globe-connector" aria-hidden="true">
        <path ref={connectorRef} pathLength="1" />
      </svg>
      <div ref={anchorRef} className="human-globe-callout-anchor">
        <aside ref={panelRef} className="human-globe-preview" aria-live="polite">
          <button type="button" onClick={onClose} aria-label="Close human preview">×</button>
          <p>{human.firstName}</p>
          {human.city && <span>{human.city}</span>}
          {human.quote && <blockquote>{human.quote}</blockquote>}
          <div>
            <small>{human.loveCount > 0 ? `♡ ${human.loveCount.toLocaleString()}` : "♡ LOVE"}</small>
            <Link href={`/humans/${human.slug}`} prefetch={false}>View human <b aria-hidden="true">→</b></Link>
          </div>
        </aside>
      </div>
      <p className="human-globe-coordinate-hud" aria-hidden="true">
        <span>{formatCoordinate(human.lat, "N", "S")}</span>
        <span>{formatCoordinate(human.lng, "E", "W")}</span>
      </p>
    </>
  );
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;
}
