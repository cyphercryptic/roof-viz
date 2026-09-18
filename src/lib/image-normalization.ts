import sharp from 'sharp';

export class ImageValidationError extends Error {}

/** Decode and re-encode actual image bytes, never trust an upload's MIME label. */
export async function normalizeImageBuffer(
  input: Buffer,
  options: { maxBytes?: number; maxDimension?: number } = {},
): Promise<Buffer> {
  if (!input.length || input.length > (options.maxBytes ?? 10 * 1024 * 1024)) {
    throw new ImageValidationError('Image is empty or exceeds the supported size.');
  }
  try {
    const pipeline = sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' });
    const metadata = await pipeline.metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp', 'heif'].includes(metadata.format) || (metadata.pages || 1) > 1) {
      throw new ImageValidationError('Use a still JPEG, PNG, WebP, or supported HEIC photo.');
    }
    const dimension = options.maxDimension ?? 2048;
    return await pipeline.rotate().resize(dimension, dimension, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageValidationError('Unable to decode this photo. Please use a valid JPEG, PNG, or WebP image under 40 megapixels.');
  }
}
