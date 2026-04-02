import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateRoofVisualization(
  imageBuffer: Buffer,
  prompt: string
): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      // @ts-expect-error - responseModalities is supported but not in types yet
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const response = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image,
      },
    },
    { text: prompt },
  ]);

  // Extract the generated image from the response
  const parts = response.response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No response from Gemini');
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }

  throw new Error('No image data returned from Gemini');
}
