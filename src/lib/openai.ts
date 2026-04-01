import OpenAI from 'openai';
import { toFile } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateRoofVisualization(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const file = await toFile(imageBuffer, 'house.png', { type: 'image/png' });

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: file,
    prompt,
    size: '1024x1024',
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('No image data returned from OpenAI');
  }

  return Buffer.from(imageBase64, 'base64');
}
