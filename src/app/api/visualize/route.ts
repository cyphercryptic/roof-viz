import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import * as Sentry from '@sentry/nextjs';
import { generateRoofVisualization, ContentRefusedError } from '@/lib/gemini';
import { buildRoofPrompt } from '@/lib/prompts';
import { getProductImageUrl, extractProductLine } from '@/lib/product-images';
import { checkUsage, recordUsage } from '@/lib/usage';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { visualizeSchema, parseBody } from '@/lib/validation';

export const maxDuration = 120; // Gemini generation takes 15-25s per attempt, with up to 3 attempts

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Rate limit by user
  const adminSupabaseForUsage = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabaseForUsage, user.id, '/api/visualize', RATE_LIMITS.visualize);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  // Check usage limits
  const usage = await checkUsage(adminSupabaseForUsage, profile.tenant_id, {
    userId: user.id,
    role: profile.role,
  });
  if (!usage.allowed) {
    return NextResponse.json({
      error: usage.message || 'Visualization limit reached. Please upgrade your plan.',
      code: 'LIMIT_REACHED',
      usage: { used: usage.used, limit: usage.limit, plan: usage.plan },
    }, { status: 429 });
  }

  const body = await request.json();
  const parsed = parseBody(visualizeSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { productId, originalImagePath, customerName, customerAddress, enhance } = parsed.data;

  // Verify image path belongs to this tenant (prevent cross-tenant access)
  if (!originalImagePath.startsWith(profile.tenant_id + '/')) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
  }

  // Fetch the product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Create visualization record
  const { data: visualization, error: vizError } = await supabase
    .from('visualizations')
    .insert({
      tenant_id: profile.tenant_id,
      created_by: user.id,
      product_id: productId,
      customer_name: customerName || null,
      customer_address: customerAddress || null,
      original_image_path: originalImagePath,
      status: 'processing',
    })
    .select()
    .single();

  if (vizError || !visualization) {
    return NextResponse.json({ error: 'Failed to create visualization record' }, { status: 500 });
  }

  const adminSupabase = createAdminClient();
  const startTime = Date.now();

  try {
    // Download the original image from storage
    const { data: imageData, error: downloadError } = await adminSupabase.storage
      .from('house-photos')
      .download(originalImagePath);

    if (downloadError || !imageData) {
      throw new Error('Failed to download original image');
    }

    const imageBuffer = Buffer.from(await imageData.arrayBuffer());

    // Fetch the product swatch photo to give Gemini an exact color/texture reference.
    // Non-fatal: fall back to text-only description if unavailable.
    const swatchUrl =
      product.swatch_url ||
      getProductImageUrl(product.brand, extractProductLine(product.name, product.brand), product.color);
    let swatchImage: Buffer | null = null;
    if (swatchUrl) {
      try {
        const swatchRes = await fetch(swatchUrl, { signal: AbortSignal.timeout(5000) });
        if (swatchRes.ok) {
          swatchImage = Buffer.from(await swatchRes.arrayBuffer());
        }
      } catch {
        // proceed without the swatch reference
      }
    }

    const prompt = buildRoofPrompt(product, {
      hasSwatchReference: !!swatchImage,
      enhance: enhance ?? false,
    });
    const resultBuffer = await generateRoofVisualization({
      houseImage: imageBuffer,
      swatchImage,
      prompt,
    });

    // Upload the result image
    const resultPath = `${profile.tenant_id}/${visualization.id}/result.png`;
    const { error: uploadError } = await adminSupabase.storage
      .from('visualizations')
      .upload(resultPath, resultBuffer, { contentType: 'image/png' });

    if (uploadError) {
      throw new Error('Failed to upload result image');
    }

    const processingTime = Date.now() - startTime;

    // Update visualization record
    await adminSupabase
      .from('visualizations')
      .update({
        result_image_path: resultPath,
        prompt_used: prompt,
        status: 'completed',
        processing_time_ms: processingTime,
      })
      .eq('id', visualization.id);

    // Record usage
    await recordUsage(adminSupabase, profile.tenant_id, visualization.id);

    // The bucket is private — hand back a signed URL for the result view.
    const { data: urlData } = await adminSupabase.storage
      .from('visualizations')
      .createSignedUrl(resultPath, 60 * 60 * 4);

    return NextResponse.json({
      id: visualization.id,
      resultUrl: urlData?.signedUrl,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const internalMessage = error instanceof Error ? error.message : 'Unknown error';
    const refused = error instanceof ContentRefusedError;

    // Store the detailed reason internally for debugging.
    await adminSupabase
      .from('visualizations')
      .update({
        status: 'failed',
        error_message: internalMessage,
        processing_time_ms: processingTime,
      })
      .eq('id', visualization.id);

    // A refusal is expected/user-actionable; anything else is a real fault worth alerting on.
    if (!refused) Sentry.captureException(error);

    // Never leak raw SDK/DB/API-key error text to the client.
    const clientMessage = refused
      ? 'The AI could not process this photo. Try a clearer, well-lit exterior shot of the house.'
      : 'Visualization failed. Please try again in a moment.';

    return NextResponse.json({ error: clientMessage }, { status: refused ? 422 : 500 });
  }
}
