/**
 * Product swatch image URL generator.
 * Images are stored in Supabase Storage (product-swatches bucket).
 * Falls back to null if no image is available (UI will show gradient swatch).
 *
 * ===================================================================
 * IMAGE COVERAGE (updated 2026-03-31)
 * ===================================================================
 *
 * GAF Timberline HDZ: 16/17 ❌ Midnight Mesa (coming soon, 2026 launch)
 * GAF Timberline AS II: ✅ 9/9
 * GAF Timberline UHDZ: ✅ 7/7
 * GAF Camelot II: ✅ 6/6
 * GAF Grand Sequoia: ✅ 5/5
 * GAF Royal Sovereign: removed from catalog
 *
 * OC TruDefinition Duration: ✅ 16/16
 * OC Duration STORM: 8/9 ❌ Quarry Gray (discontinued)
 * OC Oakridge: ✅ 10/10
 *
 * CertainTeed Landmark: ✅ 15/15
 * CertainTeed Landmark PRO: ✅ 12/12
 * CertainTeed Presidential Shake: ✅ 5/5
 *
 * TAMKO Heritage: ✅ 8/8
 * Atlas StormMaster Shake: ✅ 7/7
 * IKO Dynasty: 9/11 ❌ Sedona, Castle Grey (possibly discontinued)
 *
 * Metal Roofing: CSS gradient fallback (solid colors, no photos needed)
 *
 * IKO Dynasty (9 of 11):
 *   ❌ Sedona, Castle Grey, Pacific Rim (discontinued colors, not on IKO site)
 *
 * Metal Roofing — all missing (18 colors)
 * ===================================================================
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = 'product-swatches';

function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================================
// GAF
// ============================================================

const GAF_HDZ_AVAILABLE: Set<string> = new Set([
  'barkwood', 'birchwood', 'biscayne-blue', 'charcoal', 'fox-hollow-gray',
  'hickory', 'hunter-green', 'mission-brown', 'oyster-gray',
  'patriot-red', 'pewter-gray', 'shakewood', 'slate',
  'weathered-wood', 'williamsburg-slate',
  'golden-harvest', 'appalachian-sky',
]);

// HDZ RS removed from catalog

const GAF_AS2_AVAILABLE: Set<string> = new Set([
  'charcoal', 'pewter-gray', 'weathered-wood', 'hickory',
  'shakewood', 'barkwood', 'slate', 'fox-hollow-gray',
  'williamsburg-slate',
]);

const GAF_UHDZ_AVAILABLE: Set<string> = new Set([
  'barkwood', 'charcoal', 'pewter-gray', 'shakewood',
  'slate', 'weathered-wood', 'hickory',
]);

const GAF_CAMELOT_II_AVAILABLE: Set<string> = new Set([
  'charcoal', 'barkwood', 'antique-slate', 'royal-slate',
  'weathered-timber', 'shakewood',
]);

// Camelot II file names differ from color slugs in some cases
const GAF_CAMELOT_II_FILE_MAP: Record<string, string> = {
  'weathered-timber': 'weathered-wood', // file was stored as weathered-wood
};

const GAF_GRAND_SEQUOIA_AVAILABLE: Set<string> = new Set([
  'charcoal', 'cedar', 'autumn-brown', 'mesa-brown', 'weathered-wood',
]);

function getGafImage(line: string, color: string): string | null {
  const slug = slugify(color);

  if (line === 'Timberline HDZ' && GAF_HDZ_AVAILABLE.has(slug)) {
    return storageUrl(`gaf/timberline-hdz/${slug}.jpg`);
  }
  // HDZ RS removed from catalog
  if (line === 'Timberline AS II' && GAF_AS2_AVAILABLE.has(slug)) {
    return storageUrl(`gaf/timberline-as-ii/${slug}.jpg`);
  }
  if ((line === 'Timberline UHDZ with UltraMat' || line === 'Timberline UHDZ') && GAF_UHDZ_AVAILABLE.has(slug)) {
    return storageUrl(`gaf/timberline-uhdz/${slug}.jpg`);
  }

  // Designer lines
  if (line === 'Camelot II' && GAF_CAMELOT_II_AVAILABLE.has(slug)) {
    const file = GAF_CAMELOT_II_FILE_MAP[slug] || slug;
    return storageUrl(`gaf/camelot-ii/${file}.jpg`);
  }
  if (line === 'Grand Sequoia' && GAF_GRAND_SEQUOIA_AVAILABLE.has(slug)) {
    return storageUrl(`gaf/grand-sequoia/${slug}.jpg`);
  }

  return null;
}

// ============================================================
// Owens Corning
// ============================================================

const OC_DURATION_AVAILABLE: Set<string> = new Set([
  'brownwood', 'chateau-green', 'colonial-slate', 'driftwood',
  'estate-gray', 'onyx-black', 'sand-castle', 'sedona-canyon',
  'sierra-gray', 'storm-cloud', 'summer-harvest', 'teak',
  'terra-cotta', 'desert-tan', 'quarry-gray', 'shasta-white',
]);

const OC_DURATION_STORM_AVAILABLE: Set<string> = new Set([
  'brownwood', 'colonial-slate', 'driftwood', 'estate-gray',
  'onyx-black', 'sierra-gray', 'teak', 'desert-tan',
]);

const OC_OAKRIDGE_AVAILABLE: Set<string> = new Set([
  'brownwood', 'chateau-green', 'colonial-slate', 'driftwood',
  'estate-gray', 'onyx-black', 'sierra-gray', 'teak',
  'desert-tan', 'flagstone', 'amber',
]);

function getOwensCorningImage(line: string, color: string): string | null {
  const slug = slugify(color);

  if (line === 'TruDefinition Duration' && OC_DURATION_AVAILABLE.has(slug)) {
    return storageUrl(`owens-corning/duration/${slug}.jpg`);
  }
  if (line === 'Duration STORM' && OC_DURATION_STORM_AVAILABLE.has(slug)) {
    return storageUrl(`owens-corning/duration-storm/${slug}.jpg`);
  }
  if (line === 'Oakridge' && OC_OAKRIDGE_AVAILABLE.has(slug)) {
    return storageUrl(`owens-corning/oakridge/${slug}.jpg`);
  }

  return null;
}

// ============================================================
// CertainTeed
// ============================================================

const CT_LANDMARK_AVAILABLE: Set<string> = new Set([
  'burnt-sienna', 'cobblestone-gray', 'colonial-slate', 'driftwood',
  'georgetown-gray', 'heather-blend', 'hunter-green', 'moire-black',
  'pewter', 'resawn-shake', 'silver-birch', 'weathered-wood',
  'sunrise-cedar', 'charcoal-black', 'cinder',
]);

const CT_LANDMARK_PRO_AVAILABLE: Set<string> = new Set([
  'burnt-sienna', 'cobblestone-gray', 'colonial-slate', 'driftwood',
  'georgetown-gray', 'max-def-cobblestone-gray', 'max-def-georgetown-gray',
  'max-def-moire-black', 'max-def-weathered-wood', 'moire-black',
  'pewter', 'resawn-shake', 'weathered-wood',
]);

const CT_PRESIDENTIAL_AVAILABLE: Set<string> = new Set([
  'weathered-wood', 'charcoal-black', 'shadow-gray',
  'autumn-blend', 'country-gray',
]);

function getCertainTeedImage(line: string, color: string): string | null {
  const slug = slugify(color);

  if (line === 'Landmark' && CT_LANDMARK_AVAILABLE.has(slug)) {
    return storageUrl(`certainteed/landmark/${slug}.jpg`);
  }
  if (line === 'Landmark PRO' && CT_LANDMARK_PRO_AVAILABLE.has(slug)) {
    return storageUrl(`certainteed/landmark-pro/${slug}.jpg`);
  }
  if (line === 'Presidential Shake' && CT_PRESIDENTIAL_AVAILABLE.has(slug)) {
    return storageUrl(`certainteed/presidential-shake/${slug}.jpg`);
  }

  return null;
}

// ============================================================
// TAMKO
// ============================================================

const TAMKO_HERITAGE_AVAILABLE: Set<string> = new Set([
  'black-walnut', 'rustic-cedar', 'weathered-wood', 'natural-timber',
  'oxford-grey', 'thunderstorm-grey', 'slate', 'rustic-redwood',
]);

function getTamkoImage(line: string, color: string): string | null {
  const slug = slugify(color);
  if (line === 'Heritage' && TAMKO_HERITAGE_AVAILABLE.has(slug)) {
    return storageUrl(`tamko/heritage/${slug}.jpg`);
  }
  return null;
}

// ============================================================
// Atlas
// ============================================================

const ATLAS_STORMMASTER_AVAILABLE: Set<string> = new Set([
  'charcoal', 'weathered-wood', 'driftwood', 'pewter',
  'hearthstone', 'coastal-granite', 'pinnacle-gray',
]);

function getAtlasImage(line: string, color: string): string | null {
  const slug = slugify(color);
  if (line === 'StormMaster Shake' && ATLAS_STORMMASTER_AVAILABLE.has(slug)) {
    return storageUrl(`atlas/stormmaster-shake/${slug}.jpg`);
  }
  return null;
}

// ============================================================
// IKO
// ============================================================

const IKO_DYNASTY_AVAILABLE: Set<string> = new Set([
  'glacier', 'granite-black', 'shadow-brown', 'biscayne',
  'cornerstone', 'frostone-grey', 'monaco-red', 'brownstone',
  'driftshake',
]);

function getIkoImage(line: string, color: string): string | null {
  const slug = slugify(color);
  if (line === 'Dynasty' && IKO_DYNASTY_AVAILABLE.has(slug)) {
    return storageUrl(`iko/dynasty/${slug}.jpg`);
  }
  return null;
}

// ============================================================
// Public API
// ============================================================

/**
 * Get the product swatch image URL for a given product.
 * Returns null if no image exists (falls back to gradient swatch in UI).
 */
export function getProductImageUrl(brand: string, line: string, color: string): string | null {
  switch (brand) {
    case 'GAF':
      return getGafImage(line, color);
    case 'Owens Corning':
      return getOwensCorningImage(line, color);
    case 'CertainTeed':
      return getCertainTeedImage(line, color);
    case 'TAMKO':
      return getTamkoImage(line, color);
    case 'Atlas':
      return getAtlasImage(line, color);
    case 'IKO':
      return getIkoImage(line, color);
    default:
      return null;
  }
}
