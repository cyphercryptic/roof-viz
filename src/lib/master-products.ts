// Master product catalog — pre-built database of roofing products
// Admins select which ones to enable for their company

export interface MasterProduct {
  brand: string;
  line: string;
  style: string;
  color: string;
  description: string;
  comingSoon?: boolean;
}

export const MASTER_PRODUCTS: MasterProduct[] = [
  // ============================================================
  // GAF — Timberline HDZ (Architectural Shingle, most popular)
  // ============================================================
  ...([
    'Charcoal',
    'Pewter Gray',
    'Weathered Wood',
    'Hickory',
    'Shakewood',
    'Barkwood',
    'Birchwood',
    'Hunter Green',
    'Patriot Red',
    'Slate',
    'Mission Brown',
    'Fox Hollow Gray',
    'Oyster Gray',
    'Williamsburg Slate',
    'Golden Harvest',
    'Appalachian Sky',
  ] as const).map((color) => ({
    brand: 'GAF',
    line: 'Timberline HDZ',
    style: 'Architectural Shingle',
    color,
    description: `GAF Timberline HDZ architectural shingle in ${color}. Dimensional wood-shake look with LayerLock technology, StainGuard Plus algae protection, and WindProven limited wind warranty when installed with qualifying accessories.`,
  })),
  {
    brand: 'GAF',
    line: 'Timberline HDZ',
    style: 'Architectural Shingle',
    color: 'Midnight Mesa',
    description: 'GAF Timberline HDZ architectural shingle in Midnight Mesa. New Bold Definition color launching 2026. Dimensional wood-shake look with LayerLock technology.',
    comingSoon: true,
  },

  // ============================================================
  // GAF — Timberline UHDZ with UltraMat
  // ============================================================
  ...([
    'Charcoal',
    'Pewter Gray',
    'Weathered Wood',
    'Hickory',
    'Barkwood',
    'Shakewood',
    'Slate',
  ] as const).map((color) => ({
    brand: 'GAF',
    line: 'Timberline UHDZ with UltraMat',
    style: 'Architectural Shingle',
    color,
    description: `GAF Timberline UHDZ with UltraMat technology in ${color}. Ultra-premium dimensional shingle with a matte, non-reflective finish that mimics natural roofing materials. Highest-end Timberline product with enhanced curb appeal.`,
  })),

  // ============================================================
  // GAF — Timberline AS II (Impact Resistant)
  // ============================================================
  ...([
    'Charcoal',
    'Pewter Gray',
    'Weathered Wood',
    'Hickory',
    'Shakewood',
    'Barkwood',
    'Slate',
    'Fox Hollow Gray',
    'Williamsburg Slate',
  ] as const).map((color) => ({
    brand: 'GAF',
    line: 'Timberline AS II',
    style: 'Impact Resistant Shingle',
    color,
    description: `GAF Timberline AS II impact-resistant shingle in ${color}. UL 2218 Class 4 impact resistance rating with SBS-modified asphalt for maximum durability against hail and severe weather. Architectural dimensional profile.`,
  })),

  // ============================================================
  // GAF — Camelot II (Designer Shingle)
  // ============================================================
  ...([
    'Charcoal',
    'Antique Slate',
    'Barkwood',
    'Royal Slate',
    'Shakewood',
    'Weathered Timber',
  ] as const).map((color) => ({
    brand: 'GAF',
    line: 'Camelot II',
    style: 'Designer Shingle',
    color,
    description: `GAF Camelot II designer shingle in ${color}. Premium artisan-crafted appearance that replicates the look of old-world slate roofing. Extra-large, extra-thick shingle with dramatic shadow lines and bold definition.`,
  })),

  // ============================================================
  // GAF — Grand Sequoia (Designer Shingle)
  // ============================================================
  ...([
    'Autumn Brown',
    'Charcoal',
    'Mesa Brown',
    'Cedar',
    'Weathered Wood',
  ] as const).map((color) => ({
    brand: 'GAF',
    line: 'Grand Sequoia',
    style: 'Designer Shingle',
    color,
    description: `GAF Grand Sequoia designer shingle in ${color}. Ultra-premium wood-shake look with rugged, oversized tabs that create deep shadow lines. Thick, substantial profile for maximum curb appeal.`,
  })),

  // ============================================================
  // Owens Corning — TruDefinition Duration
  // ============================================================
  ...([
    'Onyx Black',
    'Estate Gray',
    'Desert Tan',
    'Driftwood',
    'Brownwood',
    'Teak',
    'Chateau Green',
    'Sierra Gray',
    'Colonial Slate',
    'Sedona Canyon',
    'Storm Cloud',
    'Quarry Gray',
    'Summer Harvest',
    'Flagstone',
    'Sand Castle',
    'Shasta White',
  ] as const).map((color) => ({
    brand: 'Owens Corning',
    line: 'TruDefinition Duration',
    style: 'Architectural Shingle',
    color,
    description: `Owens Corning TruDefinition Duration architectural shingle in ${color}. Features SureNail technology for superior nail zone strength, 130 MPH wind warranty, and patented TruDefinition color for bold, lively contrast and dimension.`,
  })),

  // ============================================================
  // Owens Corning — Duration STORM
  // ============================================================
  ...([
    'Onyx Black',
    'Estate Gray',
    'Driftwood',
    'Brownwood',
    'Teak',
    'Colonial Slate',
    'Quarry Gray',
    'Sierra Gray',
    'Desert Tan',
  ] as const).map((color) => ({
    brand: 'Owens Corning',
    line: 'Duration STORM',
    style: 'Impact Resistant Shingle',
    color,
    description: `Owens Corning Duration STORM impact-resistant shingle in ${color}. UL 2218 Class 4 rated for maximum hail protection. SBS-modified polymer for exceptional flexibility and durability with SureNail technology.`,
  })),

  // ============================================================
  // Owens Corning — Oakridge
  // ============================================================
  ...([
    'Onyx Black',
    'Estate Gray',
    'Desert Tan',
    'Driftwood',
    'Brownwood',
    'Teak',
    'Chateau Green',
    'Sierra Gray',
    'Colonial Slate',
    'Amber',
  ] as const).map((color) => ({
    brand: 'Owens Corning',
    line: 'Oakridge',
    style: 'Architectural Shingle',
    color,
    description: `Owens Corning Oakridge architectural shingle in ${color}. Artisan colors with a warm, inviting look. Affordable dimensional shingle with a strong limited lifetime warranty and 110 MPH wind resistance.`,
  })),

  // ============================================================
  // CertainTeed — Landmark
  // ============================================================
  ...([
    'Moire Black',
    'Georgetown Gray',
    'Weathered Wood',
    'Burnt Sienna',
    'Heather Blend',
    'Pewter',
    'Driftwood',
    'Hunter Green',
    'Resawn Shake',
    'Cobblestone Gray',
    'Silver Birch',
    'Colonial Slate',
    'Sunrise Cedar',
    'Charcoal Black',
    'Cinder',
  ] as const).map((color) => ({
    brand: 'CertainTeed',
    line: 'Landmark',
    style: 'Architectural Shingle',
    color,
    description: `CertainTeed Landmark architectural shingle in ${color}. Max Def color technology provides vivid contrast and dimension. Dual-layered construction with NailTrak nailing guide and 110 MPH wind warranty.`,
  })),

  // ============================================================
  // CertainTeed — Landmark PRO
  // ============================================================
  ...([
    'Moire Black',
    'Georgetown Gray',
    'Weathered Wood',
    'Burnt Sienna',
    'Pewter',
    'Driftwood',
    'Resawn Shake',
    'Colonial Slate',
    'Max Def Cobblestone Gray',
    'Max Def Georgetown Gray',
    'Max Def Weathered Wood',
    'Max Def Moire Black',
  ] as const).map((color) => ({
    brand: 'CertainTeed',
    line: 'Landmark PRO',
    style: 'Architectural Shingle',
    color,
    description: `CertainTeed Landmark PRO premium architectural shingle in ${color}. Thicker and wider than standard Landmark with greater exposure for enhanced shadow lines. Features algae resistance and a limited lifetime warranty.`,
  })),

  // ============================================================
  // CertainTeed — Presidential Shake
  // ============================================================
  ...([
    'Charcoal Black',
    'Weathered Wood',
    'Shadow Gray',
    'Autumn Blend',
    'Country Gray',
  ] as const).map((color) => ({
    brand: 'CertainTeed',
    line: 'Presidential Shake',
    style: 'Designer Shingle',
    color,
    description: `CertainTeed Presidential Shake luxury designer shingle in ${color}. Triple-laminated construction replicates the rugged look of hand-split cedar shakes. Maximum thickness for dramatic shadow lines and unmatched curb appeal.`,
  })),

  // ============================================================
  // TAMKO — Heritage
  // ============================================================
  ...([
    'Black Walnut',
    'Rustic Cedar',
    'Weathered Wood',
    'Natural Timber',
    'Oxford Grey',
    'Thunderstorm Grey',
    'Slate',
    'Rustic Redwood',
  ] as const).map((color) => ({
    brand: 'TAMKO',
    line: 'Heritage',
    style: 'Architectural Shingle',
    color,
    description: `TAMKO Heritage architectural shingle in ${color}. Affordable laminated shingle with a traditional dimensional look. Algae-resistant granules and a limited lifetime warranty.`,
  })),

  // ============================================================
  // Atlas — StormMaster Shake
  // ============================================================
  ...([
    'Charcoal',
    'Weathered Wood',
    'Driftwood',
    'Pewter',
    'Hearthstone',
    'Coastal Granite',
    'Pinnacle Gray',
  ] as const).map((color) => ({
    brand: 'Atlas',
    line: 'StormMaster Shake',
    style: 'Impact Resistant Shingle',
    color,
    description: `Atlas StormMaster Shake impact-resistant shingle in ${color}. Core4 technology with SBS-modified asphalt for UL 2218 Class 4 impact resistance. Scotchgard protector from 3M prevents algae stains.`,
  })),

  // ============================================================
  // IKO — Dynasty
  // ============================================================
  ...([
    'Glacier',
    'Granite Black',
    'Sedona',
    'Shadow Brown',
    'Biscayne',
    'Cornerstone',
    'Castle Grey',
    'Frostone Grey',
    'Monaco Red',
    'Pacific Rim',
    'Brownstone',
  ] as const).map((color) => ({
    brand: 'IKO',
    line: 'Dynasty',
    style: 'Architectural Shingle',
    color,
    description: `IKO Dynasty performance architectural shingle in ${color}. ArmourZone reinforced nailing area with wider common bond for superior wind resistance up to 130 MPH. Dynamic color blends with high-definition granule application.`,
  })),

  // ============================================================
  // Metal Roofing — Standing Seam (Generic)
  // ============================================================
  ...([
    'Charcoal Gray',
    'Matte Black',
    'Dark Bronze',
    'Forest Green',
    'Barn Red',
    'Galvalume Silver',
    'Slate Blue',
    'Copper Penny',
    'Clay',
    'White',
  ] as const).map((color) => ({
    brand: 'Metal Roofing',
    line: 'Standing Seam',
    style: 'Metal Standing Seam',
    color,
    description: `Standing seam metal roof panel in ${color}. Vertical ribbed panels with concealed fasteners creating clean, modern lines. Extremely durable with 40-60 year lifespan, fire resistant, and energy efficient with high solar reflectance.`,
  })),

  // ============================================================
  // Metal Roofing — Corrugated (Generic)
  // ============================================================
  ...([
    'Charcoal Gray',
    'Matte Black',
    'Barn Red',
    'Galvalume Silver',
    'Forest Green',
    'White',
    'Copper',
    'Tan',
  ] as const).map((color) => ({
    brand: 'Metal Roofing',
    line: 'Corrugated Panel',
    style: 'Metal Corrugated',
    color,
    description: `Corrugated metal roof panel in ${color}. Classic wavy ribbed profile, lightweight and durable. Cost-effective metal option with excellent water shedding capability and rustic or industrial aesthetic.`,
  })),
];

// Get unique brands
export const MASTER_BRANDS = [...new Set(MASTER_PRODUCTS.map((p) => p.brand))].sort();

// Get product lines grouped by brand
export function getProductLinesByBrand(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const p of MASTER_PRODUCTS) {
    if (!result[p.brand]) result[p.brand] = [];
    if (!result[p.brand].includes(p.line)) result[p.brand].push(p.line);
  }
  return result;
}

// Get colors for a specific product line
export function getColorsForLine(brand: string, line: string): string[] {
  return MASTER_PRODUCTS
    .filter((p) => p.brand === brand && p.line === line)
    .map((p) => p.color);
}
