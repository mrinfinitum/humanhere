export type GlobeHuman = {
  id: string;
  slug: string;
  firstName: string;
  /** Author's @username; never set for anonymous stories. */
  username?: string;
  city?: string;
  lat: number;
  lng: number;
  loveCount: number;
  quote?: string;
  featured: boolean;
  fixture: boolean;
};

export type GlobeHover = { humanId: string; x: number; y: number } | null;

export type GlobeControls = {
  targetX: number;
  targetY: number;
  distance: number;
  engaged: boolean;
  dragging: boolean;
  lastInteraction: number;
};
