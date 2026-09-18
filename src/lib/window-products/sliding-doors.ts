import type { MasterProduct } from './types';
import type { SlidingDoorAttributes } from '@/types';

// ============================================================================
// Renewal by Andersen — Patio Doors
// RbA sells Andersen-branded patio doors (200 Series, 400 Series, A-Series)
// Colors match the RbA Acclaim window palette (verified on renewalbyandersen.com).
// Note "Sandtone" (not "Sandstone"); Red Rock and Cocoa Bean are not offered.
// ============================================================================

const RBA_PATIO_DOOR_COLORS = [
  'White',
  'Sandtone',
  'Canvas',
  'Terratone',
  'Forest Green',
  'Dark Bronze',
  'Black',
] as const;

// Reference photos for Gemini (product-intro images — clean cutouts)
const RBA_PATIO_CDN = 'https://www.renewalbyandersen.com';
const PREF = (path: string) => `${RBA_PATIO_CDN}${path}`;

const PATIO_REF_200_SLIDING = PREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_patio_200-series_1x1.png'
);
const PATIO_REF_400_SLIDING = PREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_patio_400-series_sliding_terratone_1x1/product-intro-image_patio_400-series_sliding_1x1.PNG'
);
const PATIO_REF_400_HINGED = PREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_patio_400-series_hinged_black_1x1.png'
);
const PATIO_REF_ASERIES_SLIDING = PREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_patio_a-series_sliding_1x1.png'
);
const PATIO_REF_ASERIES_HINGED = PREF(
  '/-/media/Project/AndersenCorporation/RenewalByAndersen/RenewalByAndersen/images/components/products/product-intro-images_gpd/product-intro-image_patio_a-series_hinged_1x1.png'
);

interface PatioDoorConfig {
  line: string;
  style: string;
  styleLabel: string;
  panels: SlidingDoorAttributes['configuration'];
  panelLayout: SlidingDoorAttributes['panelLayout'];
  handleStyle: SlidingDoorAttributes['handleStyle'];
  description: string;
  referenceImageUrl: string;
}

const RBA_PATIO_CONFIGS: PatioDoorConfig[] = [
  // --- 200 Series (Perma-Shield) ---
  {
    line: '200 Series',
    style: 'Contemporary',
    styleLabel: 'Contemporary 2-Panel Sliding',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'contemporary',
    description: 'Andersen 200 Series Perma-Shield contemporary-style 2-panel sliding patio door. Low-maintenance vinyl exterior and interior with clean, narrow sightlines that maximize the glass area. Smooth-rolling tandem stainless steel rollers and Low-E4® insulating glass.',
    referenceImageUrl: PATIO_REF_200_SLIDING,
  },
  {
    line: '200 Series',
    style: 'Narroline',
    styleLabel: 'Narroline 2-Panel Sliding',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'contemporary',
    description: 'Andersen 200 Series Narroline 2-panel sliding patio door. Features a stainable and paintable real wood interior with vinyl exterior cladding. Narrow contemporary profile with Low-E4® insulating glass.',
    referenceImageUrl: PATIO_REF_200_SLIDING,
  },

  // --- 400 Series (Frenchwood) ---
  {
    line: '400 Series Frenchwood',
    style: 'Frenchwood Gliding',
    styleLabel: 'Frenchwood 2-Panel Gliding',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'traditional',
    description: 'Andersen 400 Series Frenchwood 2-panel gliding patio door. Authentic French door styling with wide stile-and-rail profiles, Perma-Shield® exterior cladding, and rich pine wood interior. Mortise-and-tenon construction. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_400_SLIDING,
  },
  {
    line: '400 Series Frenchwood',
    style: 'Frenchwood Gliding',
    styleLabel: 'Frenchwood 3-Panel Gliding',
    panels: '3-panel',
    panelLayout: 'OXO',
    handleStyle: 'traditional',
    description: 'Andersen 400 Series Frenchwood 3-panel gliding patio door. Extra-wide opening with center operating panel and traditional French door styling. Perma-Shield® cladding with pine wood interior. Low-E4® glass with argon fill.',
    referenceImageUrl: PATIO_REF_400_SLIDING,
  },
  {
    line: '400 Series Frenchwood',
    style: 'Frenchwood Gliding',
    styleLabel: 'Frenchwood 4-Panel Gliding',
    panels: '4-panel',
    panelLayout: 'OXXO',
    handleStyle: 'traditional',
    description: 'Andersen 400 Series Frenchwood 4-panel gliding patio door. Grand, extra-wide opening with two center operating panels. Traditional French door styling with Perma-Shield® cladding and pine interior. Low-E4® glass.',
    referenceImageUrl: PATIO_REF_400_SLIDING,
  },
  {
    line: '400 Series Frenchwood',
    style: 'Frenchwood Hinged Inswing',
    styleLabel: 'Frenchwood Hinged Inswing',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'traditional',
    description: 'Andersen 400 Series Frenchwood hinged inswing French patio door. Traditional swing-open French doors that open inward. Wide stile-and-rail construction with mortise-and-tenon joinery, Perma-Shield® exterior cladding, and pine interior. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_400_HINGED,
  },
  {
    line: '400 Series Frenchwood',
    style: 'Frenchwood Hinged Outswing',
    styleLabel: 'Frenchwood Hinged Outswing',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'traditional',
    description: 'Andersen 400 Series Frenchwood hinged outswing French patio door. Traditional French doors that swing outward to save interior floor space. Perma-Shield® exterior cladding with pine interior. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_400_HINGED,
  },

  // --- A-Series (Premium) ---
  {
    line: 'A-Series',
    style: 'Contemporary Sliding',
    styleLabel: 'A-Series Contemporary 2-Panel Sliding',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'contemporary',
    description: 'Andersen A-Series premium contemporary 2-panel sliding patio door. Ultra-narrow Fibrex® and fiberglass frame with maximum glass area. Premium wood interior in multiple species and finishes. Architectural-grade hardware and Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_ASERIES_SLIDING,
  },
  {
    line: 'A-Series',
    style: 'Contemporary Sliding',
    styleLabel: 'A-Series Contemporary 3-Panel Sliding',
    panels: '3-panel',
    panelLayout: 'OXO',
    handleStyle: 'contemporary',
    description: 'Andersen A-Series premium contemporary 3-panel sliding patio door. Extra-wide opening with ultra-narrow profiles for a wall-of-glass effect. Premium wood interior. Architectural-grade hardware and Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_ASERIES_SLIDING,
  },
  {
    line: 'A-Series',
    style: 'Contemporary Sliding',
    styleLabel: 'A-Series Contemporary 4-Panel Sliding',
    panels: '4-panel',
    panelLayout: 'OXXO',
    handleStyle: 'contemporary',
    description: 'Andersen A-Series premium contemporary 4-panel sliding patio door. Grand wall-of-glass opening with ultra-narrow profiles. Two center operating panels. Premium wood interior and architectural-grade hardware. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_ASERIES_SLIDING,
  },
  {
    line: 'A-Series',
    style: 'Hinged French Inswing',
    styleLabel: 'A-Series Hinged French Inswing',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'traditional',
    description: 'Andersen A-Series premium hinged inswing French patio door. Elegant swing-open French doors with premium wood interior, fiberglass exterior cladding, and architectural-grade estate hardware. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_ASERIES_HINGED,
  },
  {
    line: 'A-Series',
    style: 'Hinged French Outswing',
    styleLabel: 'A-Series Hinged French Outswing',
    panels: '2-panel',
    panelLayout: 'OX',
    handleStyle: 'traditional',
    description: 'Andersen A-Series premium hinged outswing French patio door. Elegant French doors that swing outward. Premium wood interior with fiberglass exterior cladding and estate hardware. Low-E4® SmartSun™ glass.',
    referenceImageUrl: PATIO_REF_ASERIES_HINGED,
  },
];

function generateRBAPatioDoors(): MasterProduct[] {
  const products: MasterProduct[] = [];

  for (const config of RBA_PATIO_CONFIGS) {
    for (const color of RBA_PATIO_DOOR_COLORS) {
      const handleColor = getHandleColor(color);
      products.push({
        category: 'sliding_glass_door',
        brand: 'Renewal by Andersen',
        line: config.line,
        name: `RbA ${config.styleLabel} - ${color}`,
        color,
        material: config.line === 'A-Series' ? 'clad-wood' : 'clad-wood',
        description: `${config.description} Exterior color: ${color}.`,
        reference_image_url: config.referenceImageUrl,
        attributes: {
          operation: config.styleLabel.includes('Hinged')
            ? (config.styleLabel.includes('Outswing') ? 'hinged-outswing' : 'hinged-inswing')
            : 'sliding',
          configuration: config.panels,
          panelLayout: config.panelLayout,
          glassType: 'low-e',
          handleStyle: config.handleStyle,
          handleColor,
          gridPattern: 'none',
        },
      });
    }
  }

  return products;
}

function getHandleColor(color: string): SlidingDoorAttributes['handleColor'] {
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

const OTHER_BRAND_DOORS: MasterProduct[] = [
  // --- Pella ---
  {
    category: 'sliding_glass_door',
    brand: 'Pella',
    line: 'Impervia',
    name: 'Pella Impervia 2-Panel Sliding Door - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Pella Impervia fiberglass 2-panel sliding patio door in White. Duracast fiberglass frame for maximum durability. Stainless steel tandem rollers and InsulShield Low-E glass.',
    attributes: { configuration: '2-panel', panelLayout: 'OX', glassType: 'low-e', handleStyle: 'contemporary', handleColor: 'white' },
  },
  {
    category: 'sliding_glass_door',
    brand: 'Pella',
    line: 'Lifestyle Series',
    name: 'Pella Lifestyle 2-Panel Sliding Door - Brown',
    color: 'Brown',
    material: 'wood',
    description: 'Pella Lifestyle Series wood 2-panel sliding patio door in Brown. Genuine wood interior with aluminum-clad exterior. Available with between-the-glass blinds and shades.',
    attributes: { configuration: '2-panel', panelLayout: 'XO', glassType: 'low-e', handleStyle: 'traditional', handleColor: 'oil-rubbed-bronze' },
  },

  // --- Marvin ---
  {
    category: 'sliding_glass_door',
    brand: 'Marvin',
    line: 'Essential',
    name: 'Marvin Essential 2-Panel Sliding Door - White',
    color: 'White',
    material: 'fiberglass',
    description: 'Marvin Essential 2-panel sliding patio door in White. Ultrex fiberglass interior and exterior. Smooth-gliding operation with narrow sightlines and Low-E2 glass.',
    attributes: { configuration: '2-panel', panelLayout: 'OX', glassType: 'low-e', handleStyle: 'contemporary', handleColor: 'white' },
  },

  // --- Milgard ---
  {
    category: 'sliding_glass_door',
    brand: 'Milgard',
    line: 'Tuscany',
    name: 'Milgard Tuscany 2-Panel Sliding Door - White',
    color: 'White',
    material: 'vinyl',
    description: 'Milgard Tuscany Series vinyl 2-panel sliding patio door in White. PureView screen, SunCoat Low-E glass, and Full Lifetime Warranty.',
    attributes: { configuration: '2-panel', panelLayout: 'OX', glassType: 'low-e', handleStyle: 'flush', handleColor: 'white' },
  },
];

export const SLIDING_DOOR_PRODUCTS: MasterProduct[] = [
  ...generateRBAPatioDoors(),
  ...OTHER_BRAND_DOORS,
];
