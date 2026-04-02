import OpenAI from 'openai';
import { toFile } from 'openai';
import sharp from 'sharp';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateRoofVisualization(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  // DALL-E 2 edit requires RGBA PNG — ensure alpha channel exists
  const rgbaBuffer = await sharp(imageBuffer)
    .ensureAlpha()
    .png()
    .toBuffer();

  const file = await toFile(rgbaBuffer, 'house.png', { type: 'image/png' });

  const response = await openai.images.edit({
    model: 'dall-e-2',
    image: file,
    prompt,
    size: '1024x1024',
    response_format: 'b64_json',
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('No image data returned from OpenAI');
  }

  return Buffer.from(imageBase64, 'base64');
}
