import OpenAI from 'openai';
import { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateRoofVisualization(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const file = await toFile(imageBuffer, 'house.png', { type: 'image/png' });

  try {
    // Try gpt-image-1 first (best quality, no mask needed)
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: file,
      prompt,
      size: '1024x1024',
    });

    // gpt-image-1 returns b64_json by default
    const imageBase64 = response.data?.[0]?.b64_json;
    if (imageBase64) {
      return Buffer.from(imageBase64, 'base64');
    }

    // If b64_json not available, try URL
    const imageUrl = response.data?.[0]?.url;
    if (imageUrl) {
      const res = await fetch(imageUrl);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw new Error('No image data returned from OpenAI');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // If gpt-image-1 isn't available, fall back to dall-e-2 with mask hint in prompt
    if (errorMessage.includes('dall-e-2') || errorMessage.includes('Invalid value')) {
      console.warn('gpt-image-1 not available, falling back to dall-e-2');

      const sharp = (await import('sharp')).default;
      const rgbaBuffer = await sharp(imageBuffer).ensureAlpha().png().toBuffer();
      const rgbaFile = await toFile(rgbaBuffer, 'house.png', { type: 'image/png' });

      const response = await openai.images.edit({
        model: 'dall-e-2',
        image: rgbaFile,
        prompt,
        size: '1024x1024',
        response_format: 'b64_json',
      });

      const base64 = response.data?.[0]?.b64_json;
      if (!base64) throw new Error('No image data returned from DALL-E 2');
      return Buffer.from(base64, 'base64');
    }

    throw err;
  }
}
