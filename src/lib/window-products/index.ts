import { WINDOW_PRODUCTS } from './windows';
import { SLIDING_DOOR_PRODUCTS } from './sliding-doors';
import { ENTRY_DOOR_PRODUCTS } from './entry-doors';
export type { MasterProduct } from './types';

export const MASTER_PRODUCTS = [
  ...WINDOW_PRODUCTS,
  ...SLIDING_DOOR_PRODUCTS,
  ...ENTRY_DOOR_PRODUCTS,
];

export { WINDOW_PRODUCTS, SLIDING_DOOR_PRODUCTS, ENTRY_DOOR_PRODUCTS };

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
