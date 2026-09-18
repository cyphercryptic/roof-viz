// Common window and door frame colors used by major brands
// (Andersen, Pella, Marvin, Milgard, etc.)
// Each color uses hex values with an optional secondary hex for gradient rendering

export const FRAME_COLORS: Record<string, { name: string; hex: string; hex2?: string }> = {
  // === WHITES / NEUTRALS ===
  'white': { name: 'White', hex: '#FFFFFF', hex2: '#F5F5F5' },
  'canvas': { name: 'Canvas', hex: '#E8E0D0', hex2: '#DDD5C5' },
  'almond': { name: 'Almond / Ivory', hex: '#F0E8D8', hex2: '#E8DFCC' },
  'putty': { name: 'Putty', hex: '#C4B69C', hex2: '#B8A88E' },
  'tan': { name: 'Tan', hex: '#C9B99A', hex2: '#BDAD8E' },
  'sandstone': { name: 'Sandstone', hex: '#D4C4A8', hex2: '#C8B89C' },
  'desert sand': { name: 'Desert Sand', hex: '#D2B48C', hex2: '#C6A87E' },
  'sandtone': { name: 'Sandtone', hex: '#C4A97D', hex2: '#B89D71' },
  'wicker': { name: 'Wicker', hex: '#B8A080', hex2: '#AC9474' },

  // === SILVERS / GRAYS ===
  'silver cloud': { name: 'Silver Cloud', hex: '#B8B8B8', hex2: '#ACACAC' },
  'iron ore': { name: 'Iron Ore', hex: '#434343', hex2: '#383838' },

  // === BROWNS / EARTH TONES ===
  'sierra': { name: 'Sierra', hex: '#9E7B5E', hex2: '#926F52' },
  'terratone': { name: 'Terratone', hex: '#8B6E4E', hex2: '#7F6242' },
  'bronze': { name: 'Bronze', hex: '#5D4037', hex2: '#51342B' },
  'dark bronze': { name: 'Dark Bronze', hex: '#4A3728', hex2: '#3E2B1C' },
  'cocoa bean': { name: 'Brown / Cocoa Bean', hex: '#3E2723', hex2: '#321B17' },
  'dark walnut': { name: 'Dark Walnut', hex: '#3B2F2F', hex2: '#2F2323' },
  'mahogany': { name: 'Mahogany', hex: '#4C1E13', hex2: '#401207' },
  'natural wood': { name: 'Natural Wood', hex: '#B87333', hex2: '#AC6727' },

  // === PURPLES / BERRIES ===
  'boysenberry': { name: 'Boysenberry', hex: '#6B2D5B', hex2: '#5F214F' },

  // === BLACKS ===
  'black': { name: 'Black', hex: '#1A1A1A', hex2: '#111111' },
  'ebony': { name: 'Ebony', hex: '#1C1C1C', hex2: '#121212' },

  // === GREENS ===
  'hartford green': { name: 'Hartford Green', hex: '#2C4A2C', hex2: '#203E20' },
  'forest green': { name: 'Forest Green', hex: '#2D4F2D', hex2: '#1E3E1E' },

  // === REDS ===
  'cranberry': { name: 'Red / Cranberry', hex: '#8B1A1A', hex2: '#7F0E0E' },
  'red rock': { name: 'Red Rock', hex: '#8B4513', hex2: '#7F3907' },

  // === EARTH TONES (Ensemble Entry Door specific) ===
  'driftwood': { name: 'Driftwood', hex: '#A89B8C', hex2: '#9C8F80' },
  'prairie grass': { name: 'Prairie Grass', hex: '#B5A67A', hex2: '#A99A6E' },
  'sage': { name: 'Sage', hex: '#87907B', hex2: '#7B846F' },

  // === BLUES ===
  'midnight blue': { name: 'Midnight Blue', hex: '#1C2841', hex2: '#101C35' },
};

/**
 * Get frame color data by key.
 * Falls back to a neutral gray if the color is not found.
 */
export function getFrameColor(colorKey: string): { name: string; hex: string; hex2?: string } {
  const key = colorKey.toLowerCase().trim();

  if (FRAME_COLORS[key]) return FRAME_COLORS[key];

  // Partial match
  for (const [k, v] of Object.entries(FRAME_COLORS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  // Fallback
  return { name: colorKey, hex: '#7A7A7A', hex2: '#6E6E6E' };
}

/**
 * Generate a CSS background for a frame color swatch.
 */
export function getFrameGradient(colorKey: string): string {
  const c = getFrameColor(colorKey);
  if (!c.hex2) return c.hex;
  return `linear-gradient(135deg, ${c.hex} 0%, ${c.hex2} 100%)`;
}
