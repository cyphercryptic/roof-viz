'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trash2, ZoomIn } from 'lucide-react';
import { ProductSwatch } from '@/components/catalog/ProductSwatch';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onDelete: (product: Product) => void;
}

/**
 * Extract the product line from the product name.
 * E.g. "GAF Timberline HDZ - Charcoal" → "Timberline HDZ"
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

export function ProductCard({ product, onDelete }: ProductCardProps) {
  const line = extractLine(product);
  const [swatchOpen, setSwatchOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex">
          {/* Shingle swatch — click to enlarge */}
          <button
            type="button"
            onClick={() => setSwatchOpen(true)}
            className="relative w-20 sm:w-24 min-h-[80px] sm:min-h-[88px] flex-shrink-0 cursor-pointer group/swatch"
          >
            <ProductSwatch
              brand={product.brand}
              line={line}
              color={product.color}
              swatchUrl={product.swatch_url}
              className="w-full h-full"
            />
            {/* Zoom hint on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover/swatch:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover/swatch:opacity-100 transition-opacity drop-shadow-md" />
            </div>
          </button>

          {/* Content */}
          <div className="flex flex-1 items-center justify-between p-2 sm:p-3 min-w-0">
            <div className="min-w-0 flex-1 pr-1 sm:pr-2">
              <p className="font-semibold text-xs sm:text-sm text-brand-brown truncate">{product.name}</p>
              <p className="text-[10px] sm:text-xs text-brand-brown/40 mt-0.5">{product.brand}</p>
              <div className="mt-1 sm:mt-1.5 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0">
                  {product.color}
                </Badge>
                {product.style && (
                  <Badge variant="outline" className="text-[10px] sm:text-[11px] px-1 sm:px-1.5 py-0 hidden sm:inline-flex">
                    {product.style}
                  </Badge>
                )}
              </div>
            </div>
            {/* Delete — always visible on mobile, hover-reveal on desktop */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Enlarged swatch dialog */}
      <Dialog open={swatchOpen} onOpenChange={setSwatchOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 overflow-hidden rounded-xl">
          <div className="p-4 pb-2">
            <p className="font-semibold text-brand-brown text-lg">{product.color}</p>
            <p className="text-sm text-brand-brown/50">{product.brand} {line}</p>
          </div>
          <ProductSwatch
            brand={product.brand}
            line={line}
            color={product.color}
            swatchUrl={product.swatch_url}
            className="w-full aspect-square"
            sizes="(max-width: 640px) calc(100vw - 2rem), 384px"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
