import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProductCategory } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_ATTEMPTS = 3;
// Roofing retains its 30s attempt ceiling. Opening edits use 60s below;
// three attempts plus backoff fit inside the route's 240s ceiling.
const PER_ATTEMPT_TIMEOUT_MS = 30_000;

// finishReasons that mean "the model refused" — retrying with the same input won't help.
const NON_RETRYABLE_FINISH = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'IMAGE_SAFETY', 'RECITATION', 'BLOCKLIST']);

/** Thrown when the model refuses the request — the route should not retry. */
export class ContentRefusedError extends Error {}

/** Detect the actual image format — uploads may be JPEG/PNG/WebP. */
function sniffMimeType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function toImagePart(buffer: Buffer) {
  return {
    inlineData: {
      mimeType: sniffMimeType(buffer),
      data: buffer.toString('base64'),
    },
  };
}

export interface RoofVisualizationInput {
  /** The customer's house photo. */
  houseImage: Buffer;
  /** Optional close-up swatch of the exact product, sent as a color/texture reference. */
  swatchImage?: Buffer | null;
  prompt: string;
}

export async function generateRoofVisualization(input: RoofVisualizationInput): Promise<Buffer> {
  return generateProductVisualization({
    houseImage: input.houseImage,
    referenceImage: input.swatchImage,
    prompt: input.prompt,
    category: 'roofing',
  });
}

export interface ProductVisualizationInput {
  houseImage: Buffer;
  referenceImage?: Buffer | null;
  prompt: string;
  category: ProductCategory;
}

export async function generateProductVisualization({
  houseImage, referenceImage, prompt, category,
}: ProductVisualizationInput): Promise<Buffer> {
  const roofing = category === 'roofing';
  const model = genAI.getGenerativeModel({
    model: roofing
      ? process.env.GEMINI_ROOF_MODEL || 'gemini-2.5-flash-image'
      : process.env.GEMINI_OPENING_MODEL || 'gemini-3.1-flash-image-preview',
    generationConfig: {
      // @ts-expect-error - responseModalities is supported but not in types yet
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });
  const target = category === 'window' ? 'window' : category === 'entry_door' ? 'entry door' : 'patio door';
  const parts = [
    toImagePart(houseImage),
    ...(referenceImage ? [
      { text: roofing
        ? 'The next image is the exact roof product swatch. Match its color and texture.'
        : `The next image is a ${target} style reference only. Match the style, shape and proportions; ignore reference colors. Edit only the ${target} in the FIRST source photo, using the color specified in the instructions.` },
      toImagePart(referenceImage),
    ] : []),
    { text: prompt },
  ];
  const timeoutMs = roofing ? PER_ATTEMPT_TIMEOUT_MS : 60_000;

  let lastError: Error = new Error('Image generation failed');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await model.generateContent(parts, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const candidate = response.response.candidates?.[0];

      for (const part of candidate?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }

      // No image came back — surface why so failures are debuggable
      const blockReason = response.response.promptFeedback?.blockReason;
      const finishReason = candidate?.finishReason;
      const modelText = candidate?.content?.parts?.find((p) => p.text)?.text?.slice(0, 300);
      const message = [
        'The AI did not return an image',
        blockReason ? `(blocked: ${blockReason})` : finishReason && finishReason !== 'STOP' ? `(${finishReason})` : '',
        modelText ? `— model said: "${modelText}"` : '',
      ].filter(Boolean).join(' ');

      // A safety/policy refusal won't change on retry — fail fast instead of burning
      // the whole time budget re-sending the same rejected image.
      if (blockReason || (finishReason && NON_RETRYABLE_FINISH.has(finishReason))) {
        throw new ContentRefusedError(message);
      }
      lastError = new Error(message);
    } catch (error) {
      if (error instanceof ContentRefusedError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
}

/** Only fetch curated product assets; do not turn catalog URLs into a server-side proxy. */
export async function fetchProductReference(url: string, allowedUrls: ReadonlySet<string>): Promise<Buffer | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    const storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : null;
    const isProductSwatch = parsed.origin === storageOrigin &&
      parsed.pathname.startsWith('/storage/v1/object/public/product-swatches/');
    if (!allowedUrls.has(url) && !isProductSwatch) return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' });
    if (!response.ok || !/^image\/(png|jpeg|webp)(;|$)/i.test(response.headers.get('content-type') || '')) return null;
    const maxBytes = 5 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > maxBytes) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return size ? Buffer.concat(chunks) : null;
  } catch {
    // A missing manufacturer image must not block the text-guided render.
    return null;
  }
}
