export const FIELD_COLOR: Record<string, string> = {
  Mind: 'retro-gold',
  Heart: 'retro-pink',
  Body: 'retro-green',
  Will: 'retro-amber',
  Shadow: 'retro-red',
  Child: 'retro-purple',
  Synthesis: 'retro-purple',
};

export const FIELD_HEX: Record<string, string> = {
  Mind: '#f5c518',
  Heart: '#ff5959',
  Body: '#10d474',
  Will: '#e8921a',
  Shadow: '#ff5959',
  Child: '#c084fc',
  Synthesis: '#c084fc',
};

export const PATTERN_ICON: Record<string, string> = {
  CRYSTALLINE: 'fa-gem',
  SPIRAL: 'fa-rotate',
  HARMONIC: 'fa-wave-square',
  ASCENDING: 'fa-arrow-trend-up',
  CHAOTIC: 'fa-bolt',
};

// Mirrors resonance.py's COUPLING table -- which fields amplify (positive)
// or dampen (negative) each other. Kept identical to the backend so the
// interference visualization matches what the server actually modeled.
export const COUPLING: [string, string, number][] = [
  ['Heart', 'Body', 0.8],
  ['Mind', 'Heart', -0.6],
  ['Shadow', 'Will', -0.7],
  ['Child', 'Shadow', -0.5],
];
