export const ROOF_STYLES = [
  'Architectural Shingle',
  '3-Tab Shingle',
  'Metal Standing Seam',
  'Metal Corrugated',
  'Clay Tile',
  'Concrete Tile',
  'Slate',
  'Cedar Shake',
  'Flat/Membrane',
] as const;

export const COMMON_BRANDS = [
  'GAF',
  'Owens Corning',
  'CertainTeed',
  'TAMKO',
  'Atlas',
  'IKO',
  'DECRA',
  'Boral',
  'Renewal by Andersen',
  'Pella',
  'Marvin',
  'Milgard',
  'Therma-Tru',
  'Masonite',
  'Provia',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export { CATEGORY_LABELS, PERSPECTIVE_LABELS, MATERIAL_OPTIONS } from '@/types';

export const WINDOW_TYPES = [
  'Double-Hung',
  'Casement',
  'Bay',
  'Bow',
  'Picture',
  'Awning',
  'Sliding',
  'Hopper',
  'Garden',
  'Egress',
] as const;

export const SLIDING_DOOR_CONFIGS = [
  '2-Panel',
  '3-Panel',
  '4-Panel',
  'Pocket',
  'Stacking',
] as const;

export const ENTRY_DOOR_STYLES = [
  'Panel',
  'Craftsman',
  'Modern',
  'Traditional',
  'Rustic',
  'Farmhouse',
  'Contemporary',
] as const;

export const FRAME_MATERIALS = [
  'Vinyl',
  'Wood',
  'Fiberglass',
  'Aluminum',
  'Composite',
  'Steel',
  'Clad-Wood',
] as const;
