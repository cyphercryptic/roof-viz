'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getProductImageUrl } from '@/lib/product-images';
import { getShingleGradient } from '@/lib/shingle-colors';

interface ProductSwatchProps {
  brand: string;
  line: string;
  color: string;
  /** Optional override URL (e.g. custom product swatch uploaded by admin) */
  swatchUrl?: string | null;
  className?: string;
  /** Override sizes hint for Next.js Image optimization */
  sizes?: string;
}

/**
 * Renders a product swatch — tries to load the actual manufacturer photo first,
 * falls back to the CSS gradient swatch if the image fails or isn't available.
 */
export function ProductSwatch({ brand, line, color, swatchUrl, className = '', sizes = '(max-width: 768px) 96px, 128px' }: ProductSwatchProps) {
  const catalogImageUrl = getProductImageUrl(brand, line, color);
  const imageUrl = swatchUrl || catalogImageUrl;
  const [imgFailed, setImgFailed] = useState(false);

  const gradient = getShingleGradient(color);

  if (imageUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Gradient background shows while image loads */}
        <div className="absolute inset-0" style={{ background: gradient }} />
        <Image
          src={imageUrl}
          alt={`${brand} ${line} - ${color}`}
          fill
          sizes={sizes}
          className="object-cover"
          quality={85}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0" style={{ background: gradient }} />
      {/* Texture overlay to simulate shingle granule texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.15'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
