"use client";

import type { RefObject } from "react";
import type { GlobeHuman } from "./types";
import { useHumanLove } from "./useHumanLove";

type Props = {
  human: GlobeHuman;
  anchorRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  connectorRef: RefObject<SVGPathElement | null>;
  onClose: () => void;
  onViewHuman: () => void;
};

/** The sole DOM representation of a selected Human. */
export function HumanCalloutOverlay({ human, anchorRef, panelRef, connectorRef, onClose, onViewHuman }: Props) {
  const love = useHumanLove({
    humanId: human.id,
    slug: human.slug,
    initialCount: human.loveCount,
    fixture: human.fixture,
  });

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
            <button
              className={`human-globe-love${love.loved ? " is-loved" : ""}`}
              type="button"
              aria-pressed={love.loved}
              disabled={love.pending || love.authenticated === null}
              onClick={() => void love.toggle()}
            >
              <span aria-hidden="true">{love.loved ? "♥" : "♡"}</span>
              {love.loved ? "Love sent" : "Send love"}
              <small>{love.loveCount.toLocaleString()}</small>
            </button>
            <button className="human-globe-view" type="button" onClick={onViewHuman}>View human <b aria-hidden="true">→</b></button>
          </div>
          {love.error && <small className="human-globe-love-error" role="alert">{love.error}</small>}
          {human.fixture && <small className="human-globe-love-demo">Demo count · this browser session only</small>}
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
