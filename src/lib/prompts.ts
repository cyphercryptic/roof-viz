interface ProductInfo {
  brand: string;
  color: string;
  style: string | null;
  description: string | null;
}

export function buildRoofPrompt(product: ProductInfo): string {
  return [
    `Transform this house photograph into a stunning, magazine-quality home exterior image suitable for a premium home remodeling website.`,
    ``,
    `ROOF REPLACEMENT:`,
    `Replace the roof with a new ${product.brand} ${product.style || 'roofing'} roof in ${product.color} color.`,
    product.description ? `The roofing material is: ${product.description}.` : '',
    `The new roof must follow the exact same roof geometry, pitch, ridgelines, valleys, hip lines, and dormers as the original.`,
    `Ensure the shingle texture, depth, and shadow lines are clearly visible and realistic.`,
    ``,
    `PHOTO ENHANCEMENT:`,
    `Enhance the overall image to look like a professional real estate or home remodeling portfolio photo:`,
    `- Optimize lighting: if the original is too dark, brighten it naturally. If harsh sunlight creates blown-out highlights, soften them.`,
    `- Balance exposure across the entire image so all details are visible.`,
    `- Make the sky look appealing — clear blue sky with soft clouds is ideal. Replace overcast or dull skies if needed.`,
    `- Ensure the lawn and landscaping look lush, green, and well-maintained.`,
    `- Colors should be vibrant but natural — not oversaturated.`,
    `- The overall mood should be warm, inviting, and aspirational — like a beautiful day showcasing a dream home.`,
    ``,
    `PRESERVATION:`,
    `Keep the house structure, architecture, siding, windows, doors, trim, gutters, driveway, and camera angle exactly the same.`,
    `The result must be photorealistic — it should look like an actual high-quality photograph, not a rendering or AI-generated image.`,
  ].filter(Boolean).join('\n');
}
