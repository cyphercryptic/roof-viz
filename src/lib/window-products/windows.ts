import type { MasterProduct } from './types';
import type { WindowAttributes } from '@/types';

// ============================================================================
// Renewal by Andersen — Acclaim Replacement Windows
// All windows use proprietary Fibrex® composite material
// 7 exterior colors × 5 operable window types = 35 core products
// (bay/bow parked — see ACCLAIM_WINDOW_TYPES note below)
// Colors per renewalbyandersen.com — verified 2026-04-16. Note "Sandtone"
// (not "Sandstone"); Red Rock and Cocoa Bean are not offered.
// ============================================================================

const RBA_EXTERIOR_COLORS = [
  'White',
  'Sandtone',
  'Canvas',
  'Terratone',
  'Forest Green',
  'Dark Bronze',
  'Black',
] as const;

interface WindowTypeConfig {
  type: WindowAttributes['windowType'];
  label: string;
  description: string;
  gridDefault: WindowAttributes['gridPattern'];
  /** Reference photo shown to Gemini as a few-shot visual target for this style */
  referenceImageUrl: string;
}

// RbA public product gallery images, used as few-shot visual style references.
// Each URL points to a representative Acclaim installation of that window type.
const RBA_CDN = 'https://www.renewalbyandersen.com';
const REF = (path: string) => `${RBA_CDN}${path}`;

// Bay and bow are intentionally omitted — current Gemini pipeline doesn't
// change their architectural projection reliably, so we park those SKUs until
// the prompt can be proven on them. Reintroduce by adding back to this list.
const ACCLAIM_WINDOW_TYPES: WindowTypeConfig[] = [
  {
    type: 'double-hung',
    label: 'Double-Hung',
    description: 'Both upper and lower sashes tilt in for easy cleaning. The most popular replacement window style.',
    gridDefault: 'none',
    referenceImageUrl: REF(
      '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/double-hung/pdp-gallery/product-gallery_double-hung_exterior-row-home_1x1.jpg'
    ),
  },
  {
    type: 'casement',
    label: 'Casement',
    description: 'Hinged on the side and cranks open outward for maximum ventilation and unobstructed views.',
    gridDefault: 'none',
    referenceImageUrl: REF(
      '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/casement/pdp-gallery/product-gallery_casement_stairwell_white-open-windows_1x1.jpg'
    ),
  },
  {
    type: 'awning',
    label: 'Awning',
    description: 'Hinged at the top and opens outward from the bottom. Ideal above sinks, counters, or in hard-to-reach areas. Can stay open during light rain.',
    gridDefault: 'none',
    referenceImageUrl: REF(
      '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/awning-windows/pdp-gallery/product-gallery_awning_exterior-of-home-with-an-awning-window_1x1.jpg'
    ),
  },
  {
    type: 'sliding',
    label: 'Sliding / Gliding',
    description: 'Panels slide horizontally on a smooth track. Great for wide openings where you don\'t want a sash swinging out.',
    gridDefault: 'none',
    referenceImageUrl: REF(
      '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/sliding-windows/pdp-gallery/product-gallery_sliding_family-room.jpg'
    ),
  },
  {
    type: 'picture',
    label: 'Picture',
    description: 'Fixed, non-operable single pane for maximum natural light and unobstructed views. No moving parts — clean, minimal frame.',
    gridDefault: 'none',
    referenceImageUrl: REF(
      '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/picture-windows/pdp-gallery/product-gallery_picture_tall-ceilings-and-patio-door_1x1.jpg'
    ),
  },
];

// Specialty shapes (circle top, trapezoid) — single exterior reference shot
const SPECIALTY_REFERENCE_URL = REF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/windows/specialty-windows/pdp-gallery/product-gallery_specialty_black-exterior-arch-tops_1x1.jpg'
);

// Generate all Renewal by Andersen Acclaim window products
function generateRBAWindows(): MasterProduct[] {
  const products: MasterProduct[] = [];

  for (const windowType of ACCLAIM_WINDOW_TYPES) {
    for (const color of RBA_EXTERIOR_COLORS) {
      products.push({
        category: 'window',
        brand: 'Renewal by Andersen',
        line: 'Acclaim',
        name: `RbA Acclaim ${windowType.label} - ${color}`,
        color,
        material: 'fibrex',
        description: `Renewal by Andersen Acclaim ${windowType.label.toLowerCase()} replacement window in ${color} Fibrex® composite. ${windowType.description} Features High-Performance Low-E4® insulating glass with argon fill for superior energy efficiency. Fibrex material is 2x stronger than vinyl and won't peel, flake, blister, or corrode.`,
        reference_image_url: windowType.referenceImageUrl,
        attributes: {
          windowType: windowType.type,
          glassType: 'low-e',
          gridPattern: windowType.gridDefault,
          hardwareColor: getDefaultHardware(color),
        },
      });
    }
  }

  return products;
}

// RbA also offers specialty/geometric shapes as fixed windows
const RBA_SPECIALTY_SHAPES: MasterProduct[] = [
  // Specialty shapes only in the most common colors
  ...(['White', 'Black', 'Dark Bronze', 'Terratone', 'Sandtone'] as const).flatMap((color) => [
    {
      category: 'window' as const,
      brand: 'Renewal by Andersen',
      line: 'Acclaim Specialty',
      name: `RbA Acclaim Circle Top - ${color}`,
      color,
      material: 'fibrex',
      description: `Renewal by Andersen Acclaim circle top (half-round arch) specialty window in ${color} Fibrex® composite. Fixed decorative window typically installed above a standard window or door to add architectural elegance. High-Performance Low-E4® glass.`,
      reference_image_url: SPECIALTY_REFERENCE_URL,
      attributes: {
        windowType: 'picture' as const, // Rendered as fixed
        glassType: 'low-e' as const,
        gridPattern: 'none' as const,
      },
    },
    {
      category: 'window' as const,
      brand: 'Renewal by Andersen',
      line: 'Acclaim Specialty',
      name: `RbA Acclaim Geometric Trapezoid - ${color}`,
      color,
      material: 'fibrex',
      description: `Renewal by Andersen Acclaim trapezoid specialty window in ${color} Fibrex® composite. Fixed geometric window for cathedral ceilings, gable ends, and architectural accents. High-Performance Low-E4® glass.`,
      reference_image_url: SPECIALTY_REFERENCE_URL,
      attributes: {
        windowType: 'picture' as const,
        glassType: 'low-e' as const,
        gridPattern: 'none' as const,
      },
    },
  ]),
];

function getDefaultHardware(color: string): WindowAttributes['hardwareColor'] {
  switch (color) {
    case 'Black':
    case 'Dark Bronze':
      return 'oil-rubbed-bronze';
    case 'White':
    case 'Canvas':
      return 'white';
    default:
      return 'brushed-nickel';
  }
}

// ============================================================================
// Other Brands (condensed — key products only)
// ============================================================================

const OTHER_BRAND_WINDOWS: MasterProduct[] = [
  // --- Pella ---
  {
    category: 'window',
    brand: 'Pella',
    line: 'Impervia',
    name: 'Pella Impervia Double-Hung - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Pella Impervia fiberglass double-hung window in White. Duracast fiberglass frame for maximum strength and durability. InsulShield Low-E glass.',
    attributes: { windowType: 'double-hung', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'white' },
  },
  {
    category: 'window',
    brand: 'Pella',
    line: 'Impervia',
    name: 'Pella Impervia Casement - Black',
    color: 'Black',
    material: 'fiberglass',
    description: 'Pella Impervia fiberglass casement window in Black. Duracast fiberglass frame with fold-away crank handle. InsulShield Low-E glass.',
    attributes: { windowType: 'casement', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'matte-black' },
  },
  {
    category: 'window',
    brand: 'Pella',
    line: '250 Series',
    name: 'Pella 250 Series Double-Hung - White',
    color: 'White',
    material: 'vinyl',
    description: 'Pella 250 Series vinyl double-hung window in White. Dual-pane insulating glass with optional between-the-glass blinds.',
    attributes: { windowType: 'double-hung', glassType: 'low-e', gridPattern: 'colonial', hardwareColor: 'white' },
  },

  // --- Marvin ---
  {
    category: 'window',
    brand: 'Marvin',
    line: 'Essential',
    name: 'Marvin Essential Double-Hung - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Marvin Essential double-hung window in White. Ultrex fiberglass interior and exterior for exceptional strength. Low-E2 glass.',
    attributes: { windowType: 'double-hung', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'white' },
  },
  {
    category: 'window',
    brand: 'Marvin',
    line: 'Signature',
    name: 'Marvin Signature Casement - Ebony',
    color: 'Ebony',
    material: 'clad-wood',
    description: 'Marvin Signature Ultimate casement window in Ebony. Premium wood interior with extruded aluminum cladding. Narrow sightlines for maximum glass area.',
    attributes: { windowType: 'casement', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'matte-black' },
  },

  // --- Milgard ---
  {
    category: 'window',
    brand: 'Milgard',
    line: 'Tuscany',
    name: 'Milgard Tuscany Double-Hung - White',
    color: 'White',
    material: 'vinyl',
    description: 'Milgard Tuscany Series vinyl double-hung window in White. SunCoat Low-E glass and a Full Lifetime Warranty including glass breakage.',
    attributes: { windowType: 'double-hung', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'white' },
  },
  {
    category: 'window',
    brand: 'Milgard',
    line: 'Trinsic',
    name: 'Milgard Trinsic Casement - Black',
    color: 'Black',
    material: 'vinyl',
    description: 'Milgard Trinsic Series vinyl casement window in Black. Contemporary narrow profile with maximum glass area. SunCoat Low-E glass.',
    attributes: { windowType: 'casement', glassType: 'low-e', gridPattern: 'none', hardwareColor: 'matte-black' },
  },
];

export const WINDOW_PRODUCTS: MasterProduct[] = [
  ...generateRBAWindows(),
  ...RBA_SPECIALTY_SHAPES,
  ...OTHER_BRAND_WINDOWS,
];
