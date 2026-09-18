import type {
  Product,
  Perspective,
  WindowAttributes,
  SlidingDoorAttributes,
  EntryDoorAttributes,
} from '@/types';
import { FRAME_COLORS } from '@/lib/frame-colors';

export interface PromptOptions extends RoofPromptOptions {
  perspective: Perspective;
}

// ---------------------------------------------------------------------------
// Color resolution — translate brand color names to physical descriptions
// the AI can understand (e.g. "Terratone" → "warm earthy brown")
// ---------------------------------------------------------------------------

function resolveColor(colorName: string): string {
  const key = colorName.toLowerCase().trim();

  // Direct match in our frame colors database
  if (FRAME_COLORS[key]) {
    return describeHexColor(key);
  }

  // Partial match
  for (const k of Object.keys(FRAME_COLORS)) {
    if (key.includes(k) || k.includes(key)) {
      return describeHexColor(k);
    }
  }

  // Common brand color names the AI might not know
  const brandColorMap: Record<string, string> = {
    'terratone': 'warm earthy brown (similar to terra cotta brown, a medium brown with warm reddish-brown undertones)',
    'sandtone': 'medium warm tan-beige, VISIBLY different from white (a distinct golden-tan color like wet beach sand or manila-folder tan — NOT white, NOT off-white, NOT cream)',
    'sandstone': 'medium warm tan-beige, VISIBLY different from white (a distinct tan-beige like natural sandstone rock — NOT white, NOT off-white)',
    'canvas': 'warm creamy off-white with obvious beige/tan undertones, VISIBLY warmer than pure white (like unbleached canvas fabric — noticeably yellow-tinted against white trim)',
    'cocoa bean': 'deep dark chocolate brown',
    'hartford green': 'deep forest green (a dark, rich hunter green)',
    'forest green': 'deep forest green (a rich, dark green like evergreen trees)',
    'red rock': 'warm reddish-brown (like Arizona red rock / desert clay, a rich burnt sienna)',
    'driftwood': 'weathered gray-brown (a soft, muted grayish-tan like sun-bleached wood)',
    'prairie grass': 'warm golden-tan (a soft earthy khaki-gold, like dried prairie grass)',
    'sage': 'muted sage green (a soft, dusty grayish-green)',
    'boysenberry': 'deep plum purple-red (a rich, dark berry color)',
    'ebony': 'very dark near-black (a rich, deep charcoal-black)',
    'iron ore': 'dark charcoal gray (almost black but with a metallic gray tone)',
    'silver cloud': 'light silver gray',
    'desert sand': 'warm tan (a medium beige with golden undertones)',
    'putty': 'warm grayish-beige (a muted khaki tone)',
    'wicker': 'warm medium tan (like woven wicker furniture)',
    'sierra': 'medium warm brown (a rich tawny brown like desert clay)',
    'dark walnut': 'very dark brown (rich espresso brown, almost black)',
    'cranberry': 'deep rich red (a dark, sophisticated burgundy-red)',
    'midnight blue': 'very dark navy blue (almost black with blue undertones)',
  };

  if (brandColorMap[key]) {
    return brandColorMap[key];
  }

  // If it's already a common color word the AI will understand, use it directly
  const commonColors = ['white', 'black', 'brown', 'tan', 'beige', 'gray', 'grey', 'red', 'blue', 'green', 'bronze', 'almond', 'ivory', 'cream', 'mahogany', 'natural wood'];
  for (const cc of commonColors) {
    if (key.includes(cc)) return colorName;
  }

  // Fallback: just use the name and hope for the best
  return colorName;
}

function describeHexColor(name: string): string {
  // Convert known frame color keys to natural language descriptions
  const descriptions: Record<string, string> = {
    'white': 'clean bright white',
    'canvas': 'soft warm off-white (creamy, like an artist\'s canvas)',
    'almond': 'soft almond/ivory (a warm off-white with a slight yellowish-cream tone)',
    'putty': 'warm putty beige (a muted grayish-tan)',
    'tan': 'warm tan',
    'sandstone': 'medium warm tan-beige, VISIBLY different from white (like natural sandstone rock — NOT white, NOT off-white)',
    'desert sand': 'warm sandy tan',
    'sandtone': 'medium warm tan-beige, VISIBLY different from white (a distinct golden-tan color like wet beach sand — NOT white)',
    'wicker': 'warm medium tan-brown',
    'silver cloud': 'light silver gray',
    'iron ore': 'dark charcoal gray',
    'sierra': 'medium warm brown (tawny, clay-like)',
    'terratone': 'warm earthy brown (medium brown with reddish-brown undertones, like terra cotta)',
    'bronze': 'rich dark bronze brown',
    'dark bronze': 'deep dark bronze (very dark brown with metallic undertones)',
    'cocoa bean': 'deep dark chocolate brown',
    'dark walnut': 'very dark espresso brown',
    'mahogany': 'rich dark reddish-brown mahogany',
    'natural wood': 'natural warm wood tone (honey-amber)',
    'black': 'matte black',
    'hartford green': 'deep forest green',
    'forest green': 'deep forest green (rich dark green like evergreen trees)',
    'cranberry': 'deep rich cranberry red',
    'red rock': 'warm reddish-brown (like Arizona red rock, burnt sienna)',
    'midnight blue': 'very dark navy blue',
  };

  return descriptions[name] || name;
}

/** Describe the visible glass finish without overriding a frosted/tinted selection. */
function describeGlass(glassType?: string): string {
  const descriptions: Record<string, string> = {
    clear: 'clear transparent glass',
    'low-e': 'Low-E glass with a subtle natural reflection and a transparent view',
    tinted: 'tinted glass with visibly reduced light transmission',
    frosted: 'frosted translucent privacy glass that obscures the view through it',
    decorative: 'decorative patterned glass matching the selected product',
    tempered: 'clear tempered safety glass',
    'impact-resistant': 'clear impact-resistant laminated glass',
  };
  return descriptions[glassType || 'clear'] || 'glass matching the selected product';
}

function productDescription(product: Product): string {
  return product.description
    ? `• Product appearance details: ${product.description.slice(0, 2000)}. These describe the product only; the unchanged-source rules below still apply.`
    : '';
}

export function buildWindowPrompt(product: Product, options: PromptOptions): string {
  const attrs = (product.attributes || {}) as WindowAttributes;
  const isExterior = options.perspective === 'exterior';

  const windowTypeName = (attrs.windowType || 'double-hung').replace(/-/g, ' ');
  const resolvedColor = resolveColor(product.color);
  const hasGrids = Boolean(attrs.gridPattern && attrs.gridPattern !== 'none');

  const styleDetails: Record<string, string> = {
    'double-hung': 'Double-hung: two stacked vertical sashes, a horizontal meeting rail dividing upper and lower panes of equal size.',
    'casement': 'Casement: a single tall sash with one unbroken glass pane, hinges on one vertical side, visible crank handle.',
    'picture': 'Picture: one single fixed pane, no sashes, no dividers.',
    'awning': 'Awning: a single sash wider than tall, hinged at the top.',
    'sliding': 'Sliding: two sashes side by side with a vertical meeting rail, slides horizontally.',
    'bay': 'Bay window: a flat center window flanked by two angled side windows projecting outward.',
    'bow': 'Bow window: 4–5 equal panels curving outward in a smooth arc.',
    'hopper': 'Hopper: single compact sash hinged at the bottom, tilts inward.',
  };
  const styleDetail = styleDetails[attrs.windowType || 'double-hung'] || `A ${windowTypeName} window.`;

  let gridLine = '';
  if (hasGrids) {
    const gridDescriptions: Record<string, string> = {
      'colonial': 'Colonial-style grid pattern — small rectangular panes arranged in a classic grid across the glass.',
      'prairie': 'Prairie-style grilles framing just the outer edges of the glass.',
      'diamond': 'Diamond-pattern grilles creating an elegant lattice.',
    };
    gridLine = gridDescriptions[attrs.gridPattern!] || `${attrs.gridPattern} grille pattern on the glass.`;
  }

  // Strip the parenthetical "(like X)" clutter from the color description — one clean color phrase
  const cleanColor = resolvedColor.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const colorLabel = product.color; // e.g. "Red Rock"

  return [
    `Generate a photorealistic version of this ${isExterior ? 'exterior' : 'interior'} house photo showing brand-new ${windowTypeName.toUpperCase()} replacement windows installed in place of the existing ones.`,
    ``,
    `THE NEW WINDOWS (what changes):`,
    `• Material: ${product.material || "match the selected product"}.`,
    productDescription(product),
    `• Style: ${styleDetail}`,
    `• Color: ${cleanColor} (${colorLabel}). ONLY the window unit itself gets this color — specifically the sashes, the frame members directly touching the glass, and any mullions/meeting rails between glass panes. The new window color must be VISUALLY OBVIOUS at a glance — if someone glanced at the house, they would immediately see the window units are ${colorLabel}, with the original surrounding trim preserved. Match ${colorLabel} faithfully, including white or light finishes when selected; do not substitute white for a darker selected color.`,
    hasGrids
      ? `• Glass: ${describeGlass(attrs.glassType)}. ${gridLine} This EXACT SAME grid pattern applies UNIFORMLY to EVERY window in the photo — if there are three windows, all three get identical grids in identical positions; if one is a picture window and another is a double-hung, both still get the same grid pattern on their glass. No window in the photo should have a different grid pattern from the others.`
      : `• Glass: ${describeGlass(attrs.glassType)}, single pane per sash. No grids, no muntins, no dividers. This applies UNIFORMLY to EVERY window in the photo — no window should have grids, even if the original photo showed grids on some windows.`,
    ``,
    `WHAT MUST NOT CHANGE COLOR (critical — do not paint ${cleanColor}):`,
    isExterior
      ? `• The exterior TRIM, CASING, and BRICKMOULD around the window opening — the flat boards framing the outside of the window unit — stay their ORIGINAL color (almost always white or matching the house). The trim and the window unit are TWO SEPARATE ELEMENTS; only the window unit gets the new color.`
      : `• The interior JAMB, CASING, STOOL, and APRON around the window — all the painted wood trim framing the window opening from the inside — stay their ORIGINAL color (almost always white). The trim and the window unit are TWO SEPARATE ELEMENTS; only the window unit itself (sash + frame members directly against the glass) gets the new color.`,
    isExterior
      ? `• Siding, brick, stucco, or any wall material touching the trim stays original.`
      : `• The room's walls, drywall, paint, and wallpaper stay original.`,
    ``,
    `UNCHANGED FROM SOURCE:`,
    `• The ${isExterior ? 'house exterior (siding, roof, doors, landscaping)' : 'room itself (walls, floor, ceiling, furniture, view out the window)'} stays unchanged.`,
    `• Same number of windows in the same positions and sizes.`,
    ``,
    `FINAL IMAGE: Photorealistic. Preserve source exposure, sky, shadows, furniture, framing, and landscaping. Do not relight or alter anything outside the selected product.`,
  ].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Sliding Glass Doors
// ---------------------------------------------------------------------------

export function buildSlidingDoorPrompt(product: Product, options: PromptOptions): string {
  const attrs = (product.attributes || {}) as SlidingDoorAttributes;
  const isExterior = options.perspective === 'exterior';

  const config = attrs.configuration || '2-panel';
  const layout = attrs.panelLayout || 'OX';
  const resolvedColor = resolveColor(product.color);
  const cleanColor = resolvedColor.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const colorLabel = product.color;

  const configDetails: Record<string, string> = {
    '2-panel': `${config} sliding glass patio door — one fixed glass panel and one operable sliding panel on a horizontal track (panel layout: ${layout}).`,
    '3-panel': `${config} sliding glass patio door — three full-height glass panels side by side, at least one sliding on a track (panel layout: ${layout}).`,
    '4-panel': `${config} sliding glass patio door — four full-height glass panels spanning a wide opening, two center panels slide on tracks (panel layout: ${layout}).`,
    'pocket': `pocket sliding glass door — panels slide entirely into the wall cavity for a frameless opening.`,
    'stacking': `multi-slide stacking glass door — multiple panels slide and stack to one side.`,
  };
  const operation = attrs.operation || (product.name.toLowerCase().includes('hinged')
    ? (product.name.toLowerCase().includes('outswing') ? 'hinged-outswing' : 'hinged-inswing')
    : 'sliding');
  const hinged = operation !== 'sliding';
  const configDetail = hinged
    ? `French hinged patio doors with ${config}, swinging ${operation === 'hinged-outswing' ? 'outward' : 'inward'} on side hinges. These are hinged doors, with no sliding operation or sliding tracks.`
    : configDetails[config] || `${config} sliding glass patio door.`;

  const hasGrids = Boolean(attrs.gridPattern && attrs.gridPattern !== 'none');
  const handleLine = (attrs.handleStyle || attrs.handleColor)
    ? `${attrs.handleStyle || 'modern'} handle${attrs.handleColor ? ` in ${attrs.handleColor}` : ''}.`
    : '';

  return [
    `Generate a photorealistic version of this ${isExterior ? 'exterior' : 'interior'} photo showing a brand-new ${hinged ? 'FRENCH HINGED PATIO DOOR' : 'SLIDING GLASS PATIO DOOR'} installed in place of the existing patio door.`,
    ``,
    `THE NEW DOOR (what changes):`,
    `• Material: ${product.material || "match the selected product"}.`,
    productDescription(product),
    `• Style: ${configDetail}`,
    `• Color: ${cleanColor} (${colorLabel}). ONLY the door unit itself gets this color — specifically the vertical stiles, horizontal rails, and any mullions between glass panels. The new door color must be VISUALLY OBVIOUS at a glance — someone glancing at the ${isExterior ? 'house' : 'room'} must immediately see the door frame is ${colorLabel}, clearly distinct from the surrounding trim or wall. Do not leave the door frame looking white or near-white unless ${colorLabel} is white — it must look visibly and unmistakably ${colorLabel}.`,
    `• Glass: Full-height panels of ${describeGlass(attrs.glassType)}.${hasGrids ? ` Glass has ${attrs.gridPattern} grilles.` : ' No grilles.'}`,
    handleLine ? `• Hardware: ${handleLine}` : '',
    ``,
    `WHAT MUST NOT CHANGE COLOR (critical — do not paint ${cleanColor}):`,
    `• The exterior TRIM, CASING, and BRICKMOULD around the door opening — the flat boards framing the outside of the door unit — stay their ORIGINAL color (almost always white or matching the house). The trim and the door unit are TWO SEPARATE ELEMENTS; only the door unit gets the new color.`,
    `• Siding, brick, stucco, or any wall material touching the trim stays original.`,
    ``,
    `UNCHANGED FROM SOURCE:`,
    `• The ${isExterior ? 'house exterior (siding, roof, ALL other windows and doors, landscaping)' : 'room itself (walls, floor, ceiling, furniture, ALL other windows)'} stays unchanged.`,
    `• The opening size and position stays the same — the new door fits the existing opening.`,
    `• Do not add any new windows or doors that don't already exist.`,
    ``,
    `FINAL IMAGE: Photorealistic. Preserve source exposure, sky, shadows, furniture, framing, and landscaping. Do not relight or alter anything outside the selected product.`,
  ].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Entry Doors
// ---------------------------------------------------------------------------

export function buildEntryDoorPrompt(product: Product, options: PromptOptions): string {
  const attrs = (product.attributes || {}) as EntryDoorAttributes;
  const isExterior = options.perspective === 'exterior';

  const style = attrs.doorStyle || 'panel';
  const panels = attrs.panelCount ?? 6;
  const resolvedColor = resolveColor(product.color);
  const cleanColor = resolvedColor.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const colorLabel = product.color;

  const styleDetails: Record<string, string> = {
    'panel': `${panels}-panel ${style === 'panel' ? 'traditional' : style} entry door with raised rectangular panels and detailed molding profiles creating depth and shadow lines.`,
    'craftsman': `Craftsman-style entry door with flat recessed panels, clean horizontal lines, and an artisan handcrafted feel (typically one large bottom panel and smaller upper panels).`,
    'modern': `modern flush entry door with a clean flat surface, no embossed panels, and minimalist contemporary lines.`,
    'traditional': `traditional entry door with elegant raised panels and classic decorative molding profiles.`,
    'rustic': `rustic entry door with rich woodgrain texture and handcrafted appearance.`,
    'farmhouse': `farmhouse-style entry door with charming cross-buck panels or upper window, warm and inviting.`,
    'contemporary': `contemporary entry door with bold architectural lines, asymmetric panels, or geometric cutouts.`,
  };
  const styleDetail = styleDetails[style] || `${style}-style entry door.`;

  // Glass inserts
  const glassLines: string[] = [];
  if (attrs.glassType && attrs.glassType !== 'none') {
    const glassDescriptions: Record<string, string> = {
      'full-light': 'full-length glass insert spanning top to bottom of the door',
      'half-light': 'glass insert in the upper half of the door with solid panels below',
      'quarter-light': 'small glass window in the upper quarter of the door',
      'sidelight': 'narrow glass sidelight panels flanking the door',
      'transom': 'horizontal transom window above the door',
      'decorative': 'decorative glass inserts with ornamental patterns',
    };
    const glassDesc = glassDescriptions[attrs.glassType] || `${attrs.glassType} glass insert`;
    const pattern = attrs.glassPattern && attrs.glassPattern !== 'clear' ? ` (${attrs.glassPattern} pattern)` : '';
    glassLines.push(`${glassDesc}${pattern}.`);
  }
  if (attrs.sidelightConfig && attrs.sidelightConfig !== 'none') {
    glassLines.push(
      attrs.sidelightConfig === 'both'
        ? 'Tall narrow glass sidelight panels flank the door on BOTH sides.'
        : `A tall narrow glass sidelight panel flanks the door on the ${attrs.sidelightConfig} side.`
    );
  }
  if (attrs.transomType && attrs.transomType !== 'none') {
    glassLines.push(`A ${attrs.transomType} transom window sits above the door.`);
  }
  const glassLine = glassLines.length ? glassLines.join(' ') : 'No glass — solid door for privacy.';

  // Hardware
  const hardwareBits: string[] = [];
  if (attrs.handleSet) {
    const handleDescriptions: Record<string, string> = {
      'lever': 'sleek lever handle',
      'knob': 'round door knob',
      'handleset': 'full handleset with thumb latch and deadbolt',
      'pull-bar': 'long modern pull-bar handle',
    };
    hardwareBits.push(handleDescriptions[attrs.handleSet] || `${attrs.handleSet} handle`);
  }
  if (attrs.handleFinish) hardwareBits.push(`in ${attrs.handleFinish} finish`);
  const hardwareLine = hardwareBits.length ? `${hardwareBits.join(' ')}.` : '';

  return [
    `Generate a photorealistic version of this ${isExterior ? 'exterior' : 'interior'} photo showing a brand-new ENTRY DOOR installed in place of the existing front door.`,
    ``,
    `THE NEW DOOR (what changes):`,
    `• Material: ${product.material || "match the selected product"}.`,
    productDescription(product),
    `• Style: ${styleDetail}`,
    `• Color: ${cleanColor} (${colorLabel}). ONLY the door slab itself gets this color — not the door frame jamb/trim around it. The new door color must be VISUALLY OBVIOUS at a glance — someone approaching the entry must immediately see the door is ${colorLabel}, clearly distinct from the surrounding trim. Do not leave the door looking white or near-white unless ${colorLabel} is white — it must look visibly and unmistakably ${colorLabel}.`,
    `• Glass: ${glassLine}`,
    hardwareLine ? `• Hardware: ${hardwareLine}` : '',
    ``,
    `WHAT MUST NOT CHANGE COLOR (critical — do not paint ${cleanColor}):`,
    `• The door FRAME JAMB, CASING, and BRICKMOULD around the door opening — the flat boards framing the outside of the door slab — stay their ORIGINAL color (almost always white or matching the house). The trim and the door slab are TWO SEPARATE ELEMENTS; only the door slab gets the new color.`,
    `• Siding, brick, stucco, porch ceiling, or any surface touching the trim stays original.`,
    `• Any sidelight or transom GLASS stays clear/decorative — do not paint ${cleanColor} onto the glass.`,
    ``,
    `UNCHANGED FROM SOURCE:`,
    `• The ${isExterior ? 'house exterior (siding, roof, ALL windows, porch, landscaping)' : 'entryway interior (walls, floors, ceiling, furniture, ALL other windows)'} stays unchanged.`,
    `• The door opening size and position stays the same — the new door fits the existing opening.`,
    `• Do not add any new windows or doors that don't already exist.`,
    ``,
    `FINAL IMAGE: Photorealistic. Preserve source exposure, sky, shadows, furniture, framing, and landscaping. Do not relight or alter anything outside the selected product.`,
  ].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function buildPrompt(product: Product, options: PromptOptions): string {
  switch (product.category) {
    case 'roofing':
      return buildRoofPrompt(product, options);
    case 'window':
      return buildWindowPrompt(product, options);
    case 'sliding_glass_door':
      return buildSlidingDoorPrompt(product, options);
    case 'entry_door':
      return buildEntryDoorPrompt(product, options);
    default:
      throw new Error(`Unknown product category: ${product.category}`);
  }
}

interface ProductInfo {
  brand: string;
  color: string;
  style: string | null;
  description: string | null;
}

export interface RoofPromptOptions {
  /** A close-up swatch photo of the product is attached as the second image. */
  hasSwatchReference?: boolean;
  /** Opt-in presentation polish (lighting, sky, lawn). Off = strict like-for-like edit. */
  enhance?: boolean;
}

export function buildRoofPrompt(product: ProductInfo, options: RoofPromptOptions = {}): string {
  const { hasSwatchReference = false, enhance = false } = options;

  const lines = [
    `The first image is a photo of a customer's house. Edit it to replace only the roof covering with new ${product.brand} ${product.style || 'roofing'} in the color "${product.color}".`,
    ``,
  ];

  if (hasSwatchReference) {
    lines.push(
      `The second image is a close-up product swatch of the exact shingle being installed. Match its color palette, granule texture, tone variation, and shadow depth precisely when rendering the new roof.`,
      ``,
    );
  }

  if (product.description) {
    lines.push(`Product details: ${product.description}`, ``);
  }

  lines.push(
    `THE NEW ROOF:`,
    `- Follow the original roof geometry exactly: same pitch, ridgelines, hips, valleys, dormers, and overhangs.`,
    `- Keep chimneys, vents, pipes, skylights, and flashing in their original positions.`,
    `- Render realistic shingle coursing at the correct perspective and scale for each roof plane, with visible texture, depth, and shadow lines.`,
    `- Light the new roof consistently with the lighting already in the photo.`,
    ``,
  );

  if (enhance) {
    lines.push(
      `PHOTO POLISH (subtle, outside the roof):`,
      `- Balance the exposure so the photo reads like a bright, pleasant day; gently brighten if the original is dark.`,
      `- The sky may be cleaned up to a clear blue with soft clouds, and the lawn may look healthy and green.`,
      `- Keep colors natural, never oversaturated.`,
      ``,
      `STRICT LIMITS: even while polishing, never alter the house itself — its structure, siding color and material, windows, doors, trim, gutters, masonry, driveway, walkways, or fences — and never move, add, or remove any object. The camera angle, framing, and perspective must not change. The house must remain instantly recognizable as the same house.`,
    );
  } else {
    lines.push(
      `EVERYTHING ELSE MUST STAY IDENTICAL to the original photo: siding, brick, windows, doors, trim, gutters, chimneys, landscaping, lawn, driveway, vehicles, sky, background, lighting, shadows, framing, and camera angle. Do not brighten, relight, recolor, sharpen, or "improve" anything outside the roof surfaces.`,
    );
  }

  lines.push(
    ``,
    `The result must be photorealistic — the same photograph of the same house with only the roof replaced${enhance ? ', plus the light presentation polish described above' : ''}. It must not look like a rendering, painting, or AI-generated image.`,
  );

  return lines.join('\n');
}
