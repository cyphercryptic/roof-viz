import type { MasterProduct } from './types';
import type { EntryDoorAttributes } from '@/types';

// ============================================================================
// Renewal by Andersen — Ensemble™ Entry Doors
// Reinforced fiberglass composite with foam-filled panels
// High-definition embossed wood texture
// 5 panel families: Solid, Full/Partial Light, Oval Light, Craftsman, Specialty Light
// Colors verified on renewalbyandersen.com — 2026-04-16.
// "Sandtone" (not "Sandstone"). Driftwood, Prairie Grass, Sage, Boysenberry,
// and Red Rock are not confirmed on the current Ensemble palette — removed.
// ============================================================================

const ENSEMBLE_COLORS = [
  'White',
  'Black',
  'Sandtone',
  'Canvas',
  'Navy',
  'Brick Red',
  'Dark Green',
  'Wheat',
  'Mahogany',
  'Oak',
  'Dark Bronze',
  'Terratone',
] as const;

// Reference photos for Gemini (per-family style cues)
const RBA_ENTRY_CDN = 'https://www.renewalbyandersen.com';
const EREF = (path: string) => `${RBA_ENTRY_CDN}${path}`;

const ENTRY_REF_SOLID = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/doors/entry-doors/pdp-gallery/product-gallery_entry_single_black_1x1.jpg'
);
const ENTRY_REF_FULL_LIGHT = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/doors/entry-doors/pdp-gallery/product-gallery_entry-single_black-full-light_1x1.jpg'
);
const ENTRY_REF_HALF_LIGHT = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/doors/entry-doors/pdp-gallery/product-gallery_entry-single-sidelight_red-mid-century_1x1.jpg'
);
const ENTRY_REF_CRAFTSMAN = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/doors/entry-doors/pdp-gallery/product-gallery_entry-single-sidelight_black-craftsman_1x1.jpg'
);
const ENTRY_REF_OVAL = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_entry_single-sidelight_modern_tb_1x1.png'
);
const ENTRY_REF_MODERN = EREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/doors/entry-doors/pdp-gallery/product-gallery_entry-dual-sidelight_black-modern_1x1.jpg'
);

interface EntryDoorStyleConfig {
  family: string;
  style: EntryDoorAttributes['doorStyle'];
  styleLabel: string;
  glassType: EntryDoorAttributes['glassType'];
  glassPattern?: EntryDoorAttributes['glassPattern'];
  panelCount: number;
  description: string;
  addSidelightVariants: boolean;
  referenceImageUrl: string;
}

const ENSEMBLE_STYLES: EntryDoorStyleConfig[] = [
  // --- Solid Panel Family ---
  {
    family: 'Solid Panel',
    style: 'panel',
    styleLabel: 'Solid 6-Panel',
    glassType: 'none',
    panelCount: 6,
    description: 'Ensemble solid 6-panel fiberglass entry door with high-definition embossed panels and detailed molding profiles. No glass — maximum privacy and security. Foam-filled core for energy efficiency.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_SOLID,
  },
  {
    family: 'Solid Panel',
    style: 'craftsman',
    styleLabel: 'Solid Craftsman',
    glassType: 'none',
    panelCount: 3,
    description: 'Ensemble solid Craftsman-style fiberglass entry door with flat recessed panels and clean horizontal lines. Artisan design with a large bottom panel and two smaller upper panels. Foam-filled core.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_CRAFTSMAN,
  },
  {
    family: 'Solid Panel',
    style: 'modern',
    styleLabel: 'Solid Flush Modern',
    glassType: 'none',
    panelCount: 0,
    description: 'Ensemble solid flush modern fiberglass entry door with a clean, flat surface and no embossed panels. Minimalist contemporary design. Foam-filled core for energy efficiency.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_MODERN,
  },

  // --- Full & Partial Light Family ---
  {
    family: 'Full Light',
    style: 'traditional',
    styleLabel: 'Full Light',
    glassType: 'full-light',
    glassPattern: 'clear',
    panelCount: 0,
    description: 'Ensemble full-light fiberglass entry door with a floor-to-ceiling glass insert spanning the full length and width of the door. Maximum natural light with clear tempered glass. Decorative glass options available.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_FULL_LIGHT,
  },
  {
    family: 'Half Light',
    style: 'traditional',
    styleLabel: 'Half Light',
    glassType: 'half-light',
    glassPattern: 'clear',
    panelCount: 3,
    description: 'Ensemble half-light fiberglass entry door with a glass insert in the upper half and solid embossed panels in the lower half. Balanced blend of light and privacy.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_HALF_LIGHT,
  },
  {
    family: 'Half Light',
    style: 'craftsman',
    styleLabel: 'Craftsman Half Light',
    glassType: 'half-light',
    glassPattern: 'clear',
    panelCount: 2,
    description: 'Ensemble Craftsman-style half-light fiberglass entry door with a rectangular glass insert at the top and Craftsman flat panels below. Clean lines with artisan character.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_CRAFTSMAN,
  },
  {
    family: 'Three-Quarter Light',
    style: 'traditional',
    styleLabel: 'Three-Quarter Light',
    glassType: 'full-light',
    glassPattern: 'clear',
    panelCount: 1,
    description: 'Ensemble three-quarter light fiberglass entry door with glass spanning most of the door height and a solid panel at the bottom. Floods the entryway with light.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_FULL_LIGHT,
  },

  // --- Oval Light Family ---
  {
    family: 'Oval Light',
    style: 'traditional',
    styleLabel: 'Oval Light Traditional',
    glassType: 'decorative',
    glassPattern: 'beveled',
    panelCount: 4,
    description: 'Ensemble traditional fiberglass entry door with a large oval-shaped decorative glass insert centered in the door. Elegant beveled glass with intricate patterns surrounded by raised panels.',
    addSidelightVariants: true,
    referenceImageUrl: ENTRY_REF_OVAL,
  },

  // --- Craftsman Light Family ---
  {
    family: 'Craftsman Light',
    style: 'craftsman',
    styleLabel: 'Craftsman Arch Light',
    glassType: 'quarter-light',
    glassPattern: 'clear',
    panelCount: 3,
    description: 'Ensemble Craftsman-style fiberglass entry door with an arched glass insert at the top and distinctive flat Craftsman panels below. The arched glass adds a soft, elegant touch to the clean Craftsman lines.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_CRAFTSMAN,
  },
  {
    family: 'Craftsman Light',
    style: 'craftsman',
    styleLabel: 'Craftsman Rectangle Light',
    glassType: 'quarter-light',
    glassPattern: 'clear',
    panelCount: 3,
    description: 'Ensemble Craftsman-style fiberglass entry door with a small rectangular glass window at the top and flat recessed Craftsman panels below. Clean, simple, and handcrafted aesthetic.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_CRAFTSMAN,
  },

  // --- Specialty Light Family ---
  {
    family: 'Specialty Light',
    style: 'modern',
    styleLabel: 'Modern 3-Lite',
    glassType: 'decorative',
    glassPattern: 'frosted',
    panelCount: 0,
    description: 'Ensemble modern fiberglass entry door with three narrow vertical glass lite inserts. Contemporary design with frosted glass for privacy while letting in light. Clean, bold aesthetic.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_MODERN,
  },
  {
    family: 'Specialty Light',
    style: 'traditional',
    styleLabel: 'Traditional 1-Lite',
    glassType: 'quarter-light',
    glassPattern: 'clear',
    panelCount: 4,
    description: 'Ensemble traditional fiberglass entry door with a single small rectangular glass lite near the top. Mostly solid for privacy with just a touch of light. Raised panel detailing.',
    addSidelightVariants: false,
    referenceImageUrl: ENTRY_REF_SOLID,
  },
];

// Sidelight configurations to offer
const SIDELIGHT_VARIANTS: Array<{
  config: NonNullable<EntryDoorAttributes['sidelightConfig']>;
  suffix: string;
  desc: string;
}> = [
  { config: 'right', suffix: ' with Right Sidelight', desc: 'Accompanied by a tall, narrow glass sidelight panel on the right side' },
  { config: 'both', suffix: ' with Dual Sidelights', desc: 'Flanked by tall, narrow glass sidelight panels on both sides' },
];

function generateEnsembleEntryDoors(): MasterProduct[] {
  const products: MasterProduct[] = [];

  for (const style of ENSEMBLE_STYLES) {
    // Base door in all colors
    for (const color of ENSEMBLE_COLORS) {
      products.push({
        category: 'entry_door',
        brand: 'Renewal by Andersen',
        line: `Ensemble ${style.family}`,
        name: `RbA Ensemble ${style.styleLabel} - ${color}`,
        color,
        material: 'fiberglass',
        description: `${style.description} Exterior color: ${color}. Patented Andersen® rain management sill system and adjustable hinges.`,
        reference_image_url: style.referenceImageUrl,
        attributes: {
          doorStyle: style.style,
          panelCount: style.panelCount,
          glassType: style.glassType,
          glassPattern: style.glassPattern,
          sidelightConfig: 'none',
          handleSet: 'handleset',
          handleFinish: getHandleFinish(color),
        },
      });
    }

    // Sidelight variants for select styles in key colors
    if (style.addSidelightVariants) {
      for (const sidelight of SIDELIGHT_VARIANTS) {
        for (const color of ['White', 'Black', 'Sandtone', 'Navy', 'Mahogany'] as const) {
          products.push({
            category: 'entry_door',
            brand: 'Renewal by Andersen',
            line: `Ensemble ${style.family}`,
            name: `RbA Ensemble ${style.styleLabel}${sidelight.suffix} - ${color}`,
            color,
            material: 'fiberglass',
            description: `${style.description} ${sidelight.desc} for added elegance and light. Exterior color: ${color}. Patented Andersen® rain management sill system.`,
            reference_image_url: style.referenceImageUrl,
            attributes: {
              doorStyle: style.style,
              panelCount: style.panelCount,
              glassType: style.glassType,
              glassPattern: style.glassPattern,
              sidelightConfig: sidelight.config,
              handleSet: 'handleset',
              handleFinish: getHandleFinish(color),
            },
          });
        }
      }
    }
  }

  return products;
}

function getHandleFinish(color: string): EntryDoorAttributes['handleFinish'] {
  switch (color) {
    case 'Black':
      return 'matte-black';
    case 'Dark Bronze':
    case 'Terratone':
    case 'Mahogany':
    case 'Oak':
    case 'Brick Red':
      return 'oil-rubbed-bronze';
    case 'White':
    case 'Sandtone':
    case 'Wheat':
    case 'Canvas':
      return 'satin-chrome';
    case 'Navy':
    case 'Dark Green':
      return 'brass';
    default:
      return 'brushed-nickel';
  }
}

// ============================================================================
// Other Brands (condensed — key products only)
// ============================================================================

const OTHER_BRAND_DOORS: MasterProduct[] = [
  // --- Therma-Tru ---
  {
    category: 'entry_door',
    brand: 'Therma-Tru',
    line: 'Benchmark',
    name: 'Therma-Tru Benchmark 6-Panel - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Therma-Tru Benchmark fiberglass 6-panel entry door in White. Durable fiberglass skin with foam core. Ready to paint or stain.',
    attributes: { doorStyle: 'panel', panelCount: 6, glassType: 'none', sidelightConfig: 'none', handleSet: 'handleset', handleFinish: 'satin-chrome' },
  },
  {
    category: 'entry_door',
    brand: 'Therma-Tru',
    line: 'Classic Craft',
    name: 'Therma-Tru Classic Craft Craftsman - Knotty Alder',
    color: 'Natural Wood',
    material: 'fiberglass',
    description: 'Therma-Tru Classic Craft Craftsman fiberglass entry door with authentic knotty alder woodgrain texture. AccuGrain technology for realistic wood appearance.',
    attributes: { doorStyle: 'craftsman', panelCount: 3, glassType: 'half-light', glassPattern: 'clear', sidelightConfig: 'none', handleSet: 'handleset', handleFinish: 'oil-rubbed-bronze' },
  },

  // --- Masonite ---
  {
    category: 'entry_door',
    brand: 'Masonite',
    line: 'Performance Door System',
    name: 'Masonite Performance 6-Panel - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Masonite Performance Door System fiberglass 6-panel entry door in White. EdgeGuard technology protects against water intrusion. AquaSeal glass framing system.',
    attributes: { doorStyle: 'panel', panelCount: 6, glassType: 'none', sidelightConfig: 'none', handleSet: 'handleset', handleFinish: 'satin-chrome' },
  },

  // --- Provia ---
  {
    category: 'entry_door',
    brand: 'Provia',
    line: 'Embarq',
    name: 'Provia Embarq Modern - Black',
    color: 'Black',
    material: 'fiberglass',
    description: 'Provia Embarq fiberglass modern entry door in Black. Clean contemporary design with ComforTech warm-edge glazing system. SuperSeal compression weatherstripping.',
    attributes: { doorStyle: 'modern', panelCount: 0, glassType: 'half-light', glassPattern: 'frosted', sidelightConfig: 'none', handleSet: 'pull-bar', handleFinish: 'matte-black' },
  },
];

export const ENTRY_DOOR_PRODUCTS: MasterProduct[] = [
  ...generateEnsembleEntryDoors(),
  ...OTHER_BRAND_DOORS,
];
