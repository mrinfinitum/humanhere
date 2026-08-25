export type GlobeHuman = {
  id: string;
  slug: string;
  firstName: string;
  city?: string;
  lat: number;
  lng: number;
  loveCount: number;
  quote?: string;
  featured: boolean;
  fixture: boolean;
};

export type GlobeHover = { index: number; x: number; y: number } | null;

export type GlobeControls = {
  targetX: number;
  targetY: number;
  distance: number;
  engaged: boolean;
  dragging: boolean;
  lastInteraction: number;
};
