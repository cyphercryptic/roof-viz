import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_ATTEMPTS = 3;
// Per-attempt ceiling. Kept well under the route's maxDuration (120s) so all attempts
// plus backoff finish before Vercel kills the function and strands the DB row.
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

export async function generateRoofVisualization({
  houseImage,
  swatchImage,
  prompt,
}: RoofVisualizationInput): Promise<Buffer> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      // @ts-expect-error - responseModalities is supported but not in types yet
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const parts = [
    toImagePart(houseImage),
    ...(swatchImage ? [toImagePart(swatchImage)] : []),
    { text: prompt },
  ];

  let lastError: Error = new Error('Image generation failed');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await model.generateContent(parts, {
        signal: AbortSignal.timeout(PER_ATTEMPT_TIMEOUT_MS),
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
