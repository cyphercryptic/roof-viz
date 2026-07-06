interface ProductInfo {
  brand: string;
  color: string;
  style: string | null;
  description: string | null;
}

export interface RoofPromptOptions {
  /** A close-up swatch photo of the product is attached as the second image. */
  hasSwatchReference?: boolean;
  /** Opt-in presentation polish (lighting, sky, lawn). Off = strict like-for-like edit. */
  enhance?: boolean;
}

export function buildRoofPrompt(product: ProductInfo, options: RoofPromptOptions = {}): string {
  const { hasSwatchReference = false, enhance = false } = options;

  const lines = [
    `The first image is a photo of a customer's house. Edit it to replace only the roof covering with new ${product.brand} ${product.style || 'roofing'} in the color "${product.color}".`,
    ``,
  ];

  if (hasSwatchReference) {
    lines.push(
      `The second image is a close-up product swatch of the exact shingle being installed. Match its color palette, granule texture, tone variation, and shadow depth precisely when rendering the new roof.`,
      ``,
    );
  }

  if (product.description) {
    lines.push(`Product details: ${product.description}`, ``);
  }

  lines.push(
    `THE NEW ROOF:`,
    `- Follow the original roof geometry exactly: same pitch, ridgelines, hips, valleys, dormers, and overhangs.`,
    `- Keep chimneys, vents, pipes, skylights, and flashing in their original positions.`,
    `- Render realistic shingle coursing at the correct perspective and scale for each roof plane, with visible texture, depth, and shadow lines.`,
    `- Light the new roof consistently with the lighting already in the photo.`,
    ``,
  );

  if (enhance) {
    lines.push(
      `PHOTO POLISH (subtle, outside the roof):`,
      `- Balance the exposure so the photo reads like a bright, pleasant day; gently brighten if the original is dark.`,
      `- The sky may be cleaned up to a clear blue with soft clouds, and the lawn may look healthy and green.`,
      `- Keep colors natural, never oversaturated.`,
      ``,
      `STRICT LIMITS: even while polishing, never alter the house itself — its structure, siding color and material, windows, doors, trim, gutters, masonry, driveway, walkways, or fences — and never move, add, or remove any object. The camera angle, framing, and perspective must not change. The house must remain instantly recognizable as the same house.`,
    );
  } else {
    lines.push(
      `EVERYTHING ELSE MUST STAY IDENTICAL to the original photo: siding, brick, windows, doors, trim, gutters, chimneys, landscaping, lawn, driveway, vehicles, sky, background, lighting, shadows, framing, and camera angle. Do not brighten, relight, recolor, sharpen, or "improve" anything outside the roof surfaces.`,
    );
  }

  lines.push(
    ``,
    `The result must be photorealistic — the same photograph of the same house with only the roof replaced${enhance ? ', plus the light presentation polish described above' : ''}. It must not look like a rendering, painting, or AI-generated image.`,
  );

  return lines.join('\n');
}
