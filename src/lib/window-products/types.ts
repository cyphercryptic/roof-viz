import type { ProductCategory, ProductAttributes } from '@/types';

export interface MasterProduct {
  category: ProductCategory;
  brand: string;
  line: string;
  name: string;
  color: string;
  material: string;
  description: string;
  attributes: ProductAttributes;
  /** Optional reference image URL — sent to Gemini as a few-shot visual target */
  reference_image_url?: string;
  comingSoon?: boolean;
}
