// Accurate shingle color representations
// Each color uses a CSS gradient to simulate the multi-toned look of real shingles
// rather than a single flat color

export interface ShingleColor {
  /** Primary background color */
  bg: string;
  /** Optional secondary color for gradient */
  bg2?: string;
  /** Optional tertiary accent fleck color */
  fleck?: string;
}

const SHINGLE_COLORS: Record<string, ShingleColor> = {
  // === BLACKS ===
  'charcoal': { bg: '#2D3436', bg2: '#3D4446', fleck: '#4A5456' },
  'charcoal black': { bg: '#1C1C1E', bg2: '#2A2A2E', fleck: '#383840' },
  'onyx black': { bg: '#111111', bg2: '#1E1E22', fleck: '#2D2D32' },
  'black': { bg: '#131313', bg2: '#222222', fleck: '#333333' },
  'moire black': { bg: '#18181B', bg2: '#252528', fleck: '#35353A' },
  'granite black': { bg: '#1E1E20', bg2: '#2D2D30', fleck: '#3E3E42' },
  'matte black': { bg: '#141414', bg2: '#222222', fleck: '#303030' },
  'black walnut': { bg: '#2A1D12', bg2: '#3D2E1F', fleck: '#4A3828' },

  // === GRAYS ===
  'pewter gray': { bg: '#6B6F73', bg2: '#7D8185', fleck: '#8E9296' },
  'pewter': { bg: '#6B6F73', bg2: '#7D8185', fleck: '#8E9296' },
  'slate': { bg: '#536270', bg2: '#647380', fleck: '#75848F' },
  'gray': { bg: '#707478', bg2: '#82868A', fleck: '#93979B' },
  'grey': { bg: '#707478', bg2: '#82868A', fleck: '#93979B' },
  'colonial slate': { bg: '#4A5A6A', bg2: '#5A6A7A', fleck: '#6B7A8A' },
  'coastal slate': { bg: '#4E6068', bg2: '#5E7078', fleck: '#6E8088' },
  'georgetown gray': { bg: '#565C62', bg2: '#666C72', fleck: '#767C82' },
  'estate gray': { bg: '#555B60', bg2: '#656B70', fleck: '#757B80' },
  'sierra gray': { bg: '#7A7D6E', bg2: '#8A8D7E', fleck: '#9A9D8E' },
  'fox hollow gray': { bg: '#5E5E52', bg2: '#6E6E62', fleck: '#7E7E72' },
  'storm cloud': { bg: '#484A52', bg2: '#585A62', fleck: '#686A72' },
  'quarry gray': { bg: '#646468', bg2: '#747478', fleck: '#848488' },
  'stone gray': { bg: '#78786E', bg2: '#88887E', fleck: '#98988E' },
  'williamsburg slate': { bg: '#485058', bg2: '#586068', fleck: '#687078' },
  'oyster gray': { bg: '#908880', bg2: '#A09890', fleck: '#B0A8A0' },
  'silver lining': { bg: '#989CA0', bg2: '#A8ACB0', fleck: '#B8BCC0' },
  'silver birch': { bg: '#90887E', bg2: '#A0988E', fleck: '#B0A89E' },
  'cobblestone gray': { bg: '#5C5C52', bg2: '#6C6C62', fleck: '#7C7C72' },
  'weathered gray': { bg: '#747472', bg2: '#848482', fleck: '#949492' },
  'castle grey': { bg: '#5E6068', bg2: '#6E7078', fleck: '#7E8088' },
  'frostone grey': { bg: '#80828A', bg2: '#90929A', fleck: '#A0A2AA' },
  'charcoal gray': { bg: '#3A3C3E', bg2: '#4A4C4E', fleck: '#5A5C5E' },
  'pinnacle gray': { bg: '#585A5E', bg2: '#686A6E', fleck: '#787A7E' },
  'shadow gray': { bg: '#404244', bg2: '#505254', fleck: '#606264' },
  'country gray': { bg: '#6A6860', bg2: '#7A7870', fleck: '#8A8880' },
  'oxford grey': { bg: '#3E4048', bg2: '#4E5058', fleck: '#5E6068' },
  'thunderstorm grey': { bg: '#353538', bg2: '#454548', fleck: '#555558' },
  'cinder': { bg: '#3E3E42', bg2: '#4E4E52', fleck: '#5E5E62' },

  // === BROWNS / WOOD TONES ===
  'weathered wood': { bg: '#6B5D50', bg2: '#7B6D60', fleck: '#8B7D70' },
  'barkwood': { bg: '#5A4838', bg2: '#6A5848', fleck: '#7A6858' },
  'shakewood': { bg: '#7A6C58', bg2: '#8A7C68', fleck: '#9A8C78' },
  'hickory': { bg: '#5E5040', bg2: '#6E6050', fleck: '#7E7060' },
  'mission brown': { bg: '#453828', bg2: '#554838', fleck: '#655848' },
  'driftwood': { bg: '#9A8A78', bg2: '#AA9A88', fleck: '#BAAA98' },
  'burnt sienna': { bg: '#7A4830', bg2: '#8A5840', fleck: '#9A6850' },
  'resawn shake': { bg: '#6A5A48', bg2: '#7A6A58', fleck: '#8A7A68' },
  'brownwood': { bg: '#5A4A38', bg2: '#6A5A48', fleck: '#7A6A58' },
  'teak': { bg: '#584030', bg2: '#685040', fleck: '#786050' },
  'mesa brown': { bg: '#6A5038', bg2: '#7A6048', fleck: '#8A7058' },
  'autumn brown': { bg: '#5A4028', bg2: '#6A5038', fleck: '#7A6048' },
  'sedona canyon': { bg: '#7A5A42', bg2: '#8A6A52', fleck: '#9A7A62' },
  'shadow brown': { bg: '#3E3028', bg2: '#4E4038', fleck: '#5E5048' },
  'sedona': { bg: '#7A5A42', bg2: '#8A6A52', fleck: '#9A7A62' },
  'rustic cedar': { bg: '#6A4830', bg2: '#7A5840', fleck: '#8A6850' },
  'natural timber': { bg: '#6A6048', bg2: '#7A7058', fleck: '#8A8068' },
  'hearthstone': { bg: '#5E5240', bg2: '#6E6250', fleck: '#7E7260' },
  'sunrise cedar': { bg: '#7A5838', bg2: '#8A6848', fleck: '#9A7858' },
  'brown': { bg: '#5A4830', bg2: '#6A5840', fleck: '#7A6850' },
  'autumn blend': { bg: '#6A4830', bg2: '#7A5840', fleck: '#8A6850' },

  // === TANS / BEIGES ===
  'desert tan': { bg: '#B09A7A', bg2: '#C0AA8A', fleck: '#D0BA9A' },
  'sand castle': { bg: '#B8A888', bg2: '#C8B898', fleck: '#D8C8A8' },
  'sandalwood': { bg: '#9A8A70', bg2: '#AA9A80', fleck: '#BAAA90' },
  'golden harvest': { bg: '#A89060', bg2: '#B8A070', fleck: '#C8B080' },
  'golden cedar': { bg: '#A88850', bg2: '#B89860', fleck: '#C8A870' },
  'summer harvest': { bg: '#AA9060', bg2: '#BAA070', fleck: '#CAB080' },
  'amber': { bg: '#B08850', bg2: '#C09860', fleck: '#D0A870' },
  'tan': { bg: '#B8A080', bg2: '#C8B090', fleck: '#D8C0A0' },
  'flagstone': { bg: '#8A8068', bg2: '#9A9078', fleck: '#AAA088' },
  'clay': { bg: '#A08060', bg2: '#B09070', fleck: '#C0A080' },
  'copper penny': { bg: '#9A6040', bg2: '#AA7050', fleck: '#BA8060' },

  // === GREENS ===
  'hunter green': { bg: '#2A4A30', bg2: '#3A5A40', fleck: '#4A6A50' },
  'chateau green': { bg: '#3A5A40', bg2: '#4A6A50', fleck: '#5A7A60' },
  'forest green': { bg: '#1E3A1E', bg2: '#2E4A2E', fleck: '#3E5A3E' },
  'green': { bg: '#2A4A30', bg2: '#3A5A40', fleck: '#4A6A50' },
  'sagewood': { bg: '#5A6A4A', bg2: '#6A7A5A', fleck: '#7A8A6A' },

  // === REDS ===
  'patriot red': { bg: '#6A2020', bg2: '#7A3030', fleck: '#8A4040' },
  'barn red': { bg: '#6A1818', bg2: '#7A2828', fleck: '#8A3838' },
  'red': { bg: '#6A2020', bg2: '#7A3030', fleck: '#8A4040' },
  'monaco red': { bg: '#7A2828', bg2: '#8A3838', fleck: '#9A4848' },
  'rustic redwood': { bg: '#5A2018', bg2: '#6A3028', fleck: '#7A4038' },

  // === BLUES ===
  'appalachian sky': { bg: '#4A6A80', bg2: '#5A7A90', fleck: '#6A8AA0' },
  'slate blue': { bg: '#3A5A70', bg2: '#4A6A80', fleck: '#5A7A90' },
  'coastal granite': { bg: '#5A6A6A', bg2: '#6A7A7A', fleck: '#7A8A8A' },
  'biscayne': { bg: '#4A7A7A', bg2: '#5A8A8A', fleck: '#6A9A9A' },
  'pacific rim': { bg: '#3A5A5A', bg2: '#4A6A6A', fleck: '#5A7A7A' },
  'blue': { bg: '#2C3E6B', bg2: '#3C4E7B', fleck: '#4C5E8B' },

  // === WHITES ===
  'white': { bg: '#E8E4DE', bg2: '#F0ECE6', fleck: '#F5F2ED' },
  'shasta white': { bg: '#E0DCD4', bg2: '#ECE8E0', fleck: '#F0ECE6' },
  'glacier': { bg: '#A8B0B8', bg2: '#B8C0C8', fleck: '#C8D0D8' },

  // === SPECIALS ===
  'midnight mesa': { bg: '#1E2030', bg2: '#2E3040', fleck: '#3E4050' },
  'galvalume silver': { bg: '#A8ACB0', bg2: '#B8BCC0', fleck: '#C8CCD0' },
  'copper': { bg: '#8A5A30', bg2: '#9A6A40', fleck: '#AA7A50' },
  'dark bronze': { bg: '#3A2818', bg2: '#4A3828', fleck: '#5A4838' },
  'antique slate': { bg: '#505058', bg2: '#606068', fleck: '#707078' },
  'royal slate': { bg: '#3A4050', bg2: '#4A5060', fleck: '#5A6070' },
  'heather blend': { bg: '#5A5248', bg2: '#6A6258', fleck: '#7A7268' },
  'cornerstone': { bg: '#5A5A48', bg2: '#6A6A58', fleck: '#7A7A68' },
  'american copper': { bg: '#8A5A30', bg2: '#9A6A40', fleck: '#AA7A50' },

  // === DUAL COLORS ===
  'dual charcoal': { bg: '#2D3436', bg2: '#3D4446', fleck: '#4A5456' },
  'dual pewter gray': { bg: '#6B6F73', bg2: '#7D8185', fleck: '#8E9296' },
  'dual weathered wood': { bg: '#6B5D50', bg2: '#7B6D60', fleck: '#8B7D70' },
  'dual hickory': { bg: '#5E5040', bg2: '#6E6050', fleck: '#7E7060' },

  // === MAX DEF VARIANTS ===
  'max def cobblestone gray': { bg: '#5C5C52', bg2: '#6C6C62', fleck: '#7C7C72' },
  'max def georgetown gray': { bg: '#565C62', bg2: '#666C72', fleck: '#767C82' },
  'max def weathered wood': { bg: '#6B5D50', bg2: '#7B6D60', fleck: '#8B7D70' },
  'max def moire black': { bg: '#18181B', bg2: '#252528', fleck: '#35353A' },
};

/**
 * Get the shingle color data for a given color name.
 * Returns a multi-tone representation for realistic swatch rendering.
 */
export function getShingleColor(colorName: string): ShingleColor {
  const key = colorName.toLowerCase().trim();

  // Exact match
  if (SHINGLE_COLORS[key]) return SHINGLE_COLORS[key];

  // Partial match — try to find a key that contains the color name
  for (const [k, v] of Object.entries(SHINGLE_COLORS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  // Fallback — neutral gray
  return { bg: '#7A7A7A', bg2: '#8A8A8A', fleck: '#9A9A9A' };
}

/**
 * Generate a CSS background that simulates the multi-toned look of a shingle.
 */
export function getShingleGradient(colorName: string): string {
  const c = getShingleColor(colorName);
  if (!c.bg2) return c.bg;
  return `linear-gradient(135deg, ${c.bg} 0%, ${c.bg2} 50%, ${c.fleck || c.bg} 80%, ${c.bg} 100%)`;
}
