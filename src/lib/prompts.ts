interface ProductInfo {
  brand: string;
  color: string;
  style: string | null;
  description: string | null;
}

export function buildRoofPrompt(product: ProductInfo): string {
  return [
    `This is a photograph of a residential house.`,
    `Replace ONLY the roof with a new ${product.brand} ${product.style || 'roofing'} roof in ${product.color} color.`,
    product.description ? `The roofing material is: ${product.description}.` : '',
    `The new roof must follow the exact same roof geometry, pitch, ridgelines, valleys, and hip lines as the original roof.`,
    `Preserve the entire rest of the house exactly as-is: siding, windows, doors, trim, gutters, landscaping, driveway, sky, lighting, shadows, and camera angle.`,
    `The result must be photorealistic and look like an actual photograph, not a rendering.`,
    `Maintain the original photograph's lighting conditions, time of day, and weather.`,
  ].filter(Boolean).join(' ');
}
