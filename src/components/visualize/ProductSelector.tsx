'use client';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSwatch } from '@/components/catalog/ProductSwatch';
import type { Product } from '@/types';

interface ProductSelectorProps {
  products: Product[];
  selectedId: string;
  onSelect: (productId: string) => void;
  disabled?: boolean;
}

/**
 * Extract the product line from the product name.
 */
function extractLine(product: Product): string {
  const name = product.name;
  let rest = name.startsWith(product.brand)
    ? name.slice(product.brand.length).trim()
    : name;
  const dashIdx = rest.indexOf(' - ');
  if (dashIdx > 0) rest = rest.slice(0, dashIdx).trim();
  return rest || name;
}

export function ProductSelector({ products, selectedId, onSelect, disabled }: ProductSelectorProps) {
  // Group products by brand
  const grouped = products.reduce<Record<string, Product[]>>((acc, product) => {
    if (!acc[product.brand]) acc[product.brand] = [];
    acc[product.brand].push(product);
    return acc;
  }, {});

  const brands = Object.keys(grouped).sort();
  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div>
      <Select value={selectedId} onValueChange={(v) => onSelect(v ?? '')} disabled={disabled}>
        <SelectTrigger className="w-full h-12 text-base">
          {selectedProduct ? (
            <div className="flex items-center gap-3 min-w-0">
              <ProductSwatch
                brand={selectedProduct.brand}
                line={extractLine(selectedProduct)}
                color={selectedProduct.color}
                className="h-6 w-6 rounded border shadow-sm flex-shrink-0"
              />
              <span className="truncate font-medium">{selectedProduct.name}</span>
            </div>
          ) : (
            <SelectValue placeholder="Select a roofing product" />
          )}
        </SelectTrigger>
        <SelectContent>
          {brands.map((brand) => (
            <SelectGroup key={brand}>
              <SelectLabel className="text-xs font-semibold uppercase text-brand-brown/40">
                {brand}
              </SelectLabel>
              {grouped[brand].map((product) => (
                <SelectItem key={product.id} value={product.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <ProductSwatch
                      brand={product.brand}
                      line={extractLine(product)}
                      color={product.color}
                      className="h-6 w-6 rounded border shadow-sm flex-shrink-0"
                    />
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <span className="ml-2 text-brand-brown/50">- {product.color}</span>
                      {product.style && (
                        <span className="ml-1 text-brand-brown/40 text-xs">({product.style})</span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
