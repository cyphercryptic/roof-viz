'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ProductSwatch } from '@/components/catalog/ProductSwatch';
import { cn } from '@/lib/utils';
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
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // All brands for the filter pills (from unfiltered products)
  const allBrands = [...new Set(products.map((p) => p.brand))].sort();

  // Filter by brand
  const brandFiltered = activeBrand
    ? products.filter((p) => p.brand === activeBrand)
    : products;

  // Filter by search
  const filteredProducts = searchQuery
    ? brandFiltered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.color.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : brandFiltered;

  // Group filtered products by brand
  const grouped = filteredProducts.reduce<Record<string, Product[]>>((acc, product) => {
    if (!acc[product.brand]) acc[product.brand] = [];
    acc[product.brand].push(product);
    return acc;
  }, {});

  const brands = Object.keys(grouped).sort();

  // Selected product from full list (not filtered)
  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div className="space-y-2">
      {/* Brand filter pills */}
      {allBrands.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveBrand(null)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              activeBrand === null
                ? 'bg-brand-orange text-white'
                : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
            )}
          >
            All
          </button>
          {allBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setActiveBrand(brand)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeBrand === brand
                  ? 'bg-brand-orange text-white'
                  : 'bg-brand-peach-light text-brand-brown/60 hover:bg-brand-peach'
              )}
            >
              {brand}
            </button>
          ))}
        </div>
      )}

      {/* Search input for large catalogs */}
      {products.length > 8 && (
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-sm"
        />
      )}

      {/* Product dropdown */}
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
          {filteredProducts.length === 0 ? (
            <div className="py-6 text-center text-sm text-brand-brown/40">
              No products match your search
            </div>
          ) : (
            brands.map((brand) => (
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
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
