export type UserRole = 'owner' | 'admin' | 'rep' | 'demo';
export type VisualizationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ProductCategory = 'roofing' | 'window' | 'sliding_glass_door' | 'entry_door';
export type Perspective = 'exterior' | 'interior';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  custom_domain: string | null;
  hide_powered_by: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

// Category-specific attribute interfaces
export interface WindowAttributes {
  windowType?: 'double-hung' | 'casement' | 'bay' | 'bow' | 'picture' | 'awning' | 'sliding' | 'hopper' | 'garden' | 'egress';
  glassType?: 'clear' | 'low-e' | 'tinted' | 'frosted' | 'decorative' | 'tempered' | 'impact-resistant';
  gridPattern?: 'none' | 'colonial' | 'prairie' | 'diamond' | 'custom';
  interiorColor?: string;
  blindsPosition?: 'none' | 'between-panes' | 'interior';
  blindsColor?: string;
  hardwareColor?: 'white' | 'brass' | 'brushed-nickel' | 'oil-rubbed-bronze' | 'matte-black' | 'chrome';
  screenType?: 'full' | 'half' | 'retractable' | 'none';
}

export interface SlidingDoorAttributes {
  operation?: 'sliding' | 'hinged-inswing' | 'hinged-outswing';
  configuration?: '2-panel' | '3-panel' | '4-panel' | 'pocket' | 'stacking';
  panelLayout?: 'OX' | 'XO' | 'OXO' | 'OXXO';
  glassType?: 'clear' | 'low-e' | 'tinted' | 'frosted' | 'tempered' | 'impact-resistant';
  gridPattern?: 'none' | 'colonial' | 'prairie' | 'diamond' | 'custom';
  interiorColor?: string;
  handleStyle?: 'contemporary' | 'traditional' | 'flush' | 'pull';
  handleColor?: 'white' | 'brass' | 'brushed-nickel' | 'oil-rubbed-bronze' | 'matte-black' | 'chrome';
  screenType?: 'sliding' | 'retractable' | 'none';
  trackType?: 'standard' | 'flush' | 'multi-slide';
}

export interface EntryDoorAttributes {
  doorStyle?: 'panel' | 'craftsman' | 'modern' | 'traditional' | 'rustic' | 'farmhouse' | 'contemporary';
  panelCount?: number;
  glassType?: 'none' | 'full-light' | 'half-light' | 'quarter-light' | 'sidelight' | 'transom' | 'decorative';
  glassPattern?: 'clear' | 'frosted' | 'textured' | 'beveled' | 'stained' | 'rain';
  sidelightConfig?: 'none' | 'left' | 'right' | 'both';
  transomType?: 'none' | 'rectangular' | 'arched' | 'elliptical';
  handleSet?: 'lever' | 'knob' | 'handleset' | 'pull-bar';
  handleFinish?: 'brass' | 'brushed-nickel' | 'oil-rubbed-bronze' | 'matte-black' | 'chrome' | 'satin-chrome';
  hingeFinish?: 'brass' | 'brushed-nickel' | 'oil-rubbed-bronze' | 'matte-black' | 'chrome';
  kickplate?: boolean;
  peephole?: boolean;
}

export type ProductAttributes = WindowAttributes | SlidingDoorAttributes | EntryDoorAttributes;

export interface Product {
  id: string;
  tenant_id: string;
  category: ProductCategory;
  name: string;
  brand: string;
  line: string | null;
  color: string;
  material: string | null;
  style: string | null;
  swatch_url: string | null;
  reference_image_url: string | null;
  description: string | null;
  attributes: ProductAttributes;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visualization {
  id: string;
  tenant_id: string;
  created_by: string;
  product_id: string;
  customer_name: string | null;
  customer_address: string | null;
  original_image_path: string;
  result_image_path: string | null;
  prompt_used: string | null;
  status: VisualizationStatus;
  error_message: string | null;
  processing_time_ms: number | null;
  perspective: Perspective;
  category: ProductCategory | null;
  created_at: string;
  // Joined fields
  product?: Product;
  creator?: Profile;
}

export interface SharedLink {
  id: string;
  tenant_id: string;
  visualization_id: string;
  created_by: string;
  token: string;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

export interface Invite {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  token: string;
  accepted_at: string | null;
  created_at: string;
}

// Category display helpers
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  roofing: 'Roofing',
  window: 'Windows',
  sliding_glass_door: 'Patio Doors',
  entry_door: 'Entry Doors',
};

export const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  exterior: 'Exterior',
  interior: 'Interior',
};

export const MATERIAL_OPTIONS = [
  'fibrex',
  'vinyl',
  'wood',
  'fiberglass',
  'aluminum',
  'composite',
  'steel',
  'clad-wood',
] as const;

/** Normalize rows created before the unified catalog migration. */
export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    category: product.category || 'roofing',
    style: product.style ?? null,
    material: product.material ?? null,
    line: product.line ?? null,
    reference_image_url: product.reference_image_url ?? null,
    attributes: product.attributes && typeof product.attributes === 'object' ? product.attributes : {},
  };
}
