import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import * as Sentry from '@sentry/nextjs';
import { generateProductVisualization, fetchProductReference, ContentRefusedError } from '@/lib/gemini';
import { buildPrompt } from '@/lib/prompts';
import { MASTER_PRODUCTS } from '@/lib/master-products';
import { normalizeProduct } from '@/types';
import { isTenantMediaPath } from '@/lib/security-policy';
import { getProductImageUrl, extractProductLine } from '@/lib/product-images';
import { checkUsage, recordUsage } from '@/lib/usage';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { visualizeSchema, parseBody } from '@/lib/validation';

export const maxDuration = 240; // Three bounded 60s opening attempts plus storage/backoff.

const REFERENCE_URLS = new Set(MASTER_PRODUCTS.flatMap((product) => product.reference_image_url ? [product.reference_image_url] : []));
const LIGHT_COLORS = new Set(['white', 'sandtone', 'sandstone', 'canvas', 'wheat', 'almond', 'ivory', 'cream', 'off-white']);

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
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck);

  // Check usage limits
  let usage: Awaited<ReturnType<typeof checkUsage>>;
  try {
    usage = await checkUsage(adminSupabaseForUsage, profile.tenant_id, {
      userId: user.id,
      role: profile.role,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Unable to verify your visualization allowance. Please try again.' }, { status: 503 });
  }
  if (!usage.allowed) {
    return NextResponse.json({
      error: usage.message || 'Visualization limit reached. Please upgrade your plan.',
      code: 'LIMIT_REACHED',
      usage: { used: usage.used, limit: usage.limit, plan: usage.plan },
    }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseBody(visualizeSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { productId, originalImagePath, customerName, customerAddress, enhance, perspective } = parsed.data;

  // Verify image path belongs to this tenant (prevent cross-tenant access)
  if (!isTenantMediaPath(originalImagePath, profile.tenant_id)) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
  }

  // Fetch the product
  const { data: productRow, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .single();

  if (productError || !productRow) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const product = normalizeProduct(productRow);
  if (product.category === 'roofing' && perspective === 'interior') {
    return NextResponse.json({ error: 'Choose an exterior photo for roofing.' }, { status: 400 });
  }
  // Legacy roofing rows can still render before the additive migration is applied.
  const hasCategorySchema = typeof productRow.category === 'string';
  if (parsed.data.category && parsed.data.category !== product.category) {
    return NextResponse.json({ error: 'Selected category does not match this product.' }, { status: 400 });
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
      ...(hasCategorySchema ? { category: product.category, perspective } : {}),
      status: 'processing',
    })
    .select()
    .single();

  if (vizError || !visualization) {
    if (vizError?.code === 'P0001') {
      return NextResponse.json({ error: 'Your visualization allowance is in use or has been reached. Wait for current renders to finish or review your plan.', code: 'LIMIT_REACHED' }, { status: 429 });
    }
    if (vizError?.code === '42501') {
      return NextResponse.json({ error: 'Unable to start this visualization. Check your account access and billing, then try again.', code: 'ACCESS_DENIED' }, { status: 403 });
    }
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

    const roofing = product.category === 'roofing';
    const skipReference = !roofing && (perspective === 'interior' || LIGHT_COLORS.has(product.color.toLowerCase().trim()));
    const referenceUrl = roofing
      ? product.swatch_url || getProductImageUrl(product.brand, product.line || extractProductLine(product.name, product.brand), product.color)
      : product.reference_image_url;
    const referenceImage = referenceUrl && !skipReference
      ? await fetchProductReference(referenceUrl, REFERENCE_URLS)
      : null;
    const prompt = buildPrompt(product, {
      perspective,
      hasSwatchReference: !!referenceImage,
      enhance: enhance ?? false,
    });
    const resultBuffer = await generateProductVisualization({
      houseImage: imageBuffer,
      referenceImage,
      prompt,
      category: product.category,
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

    // The bucket is private — hand back a signed URL for the result view.
    const { data: urlData, error: signedUrlError } = await adminSupabase.storage
      .from('visualizations')
      .createSignedUrl(resultPath, 60 * 60 * 4);

    if (signedUrlError || !urlData?.signedUrl) throw new Error('Failed to create result link');

    // Migration023 commits completion, usage and any PAYG outbox event together.
    const { error: completionError } = await adminSupabase
      .from('visualizations')
      .update({
        result_image_path: resultPath,
        prompt_used: prompt,
        status: 'completed',
        processing_time_ms: processingTime,
      })
      .eq('id', visualization.id);

    if (completionError) throw new Error('Failed to save completed visualization');

    // Record usage
    await recordUsage(adminSupabase, profile.tenant_id, visualization.id);

    return NextResponse.json({
      id: visualization.id,
      resultUrl: urlData.signedUrl,
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
      .eq('id', visualization.id)
      .eq('status', 'processing');

    // A refusal is expected/user-actionable; anything else is a real fault worth alerting on.
    if (!refused) Sentry.captureException(error);

    // Never leak raw SDK/DB/API-key error text to the client.
    const clientMessage = refused
      ? 'The AI could not process this photo. Try a clearer, well-lit photo of the selected area.'
      : 'Visualization failed. Please try again in a moment.';

    return NextResponse.json({ error: clientMessage }, { status: refused ? 422 : 500 });
  }
}
