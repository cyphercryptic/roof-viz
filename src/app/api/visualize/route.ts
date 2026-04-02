import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateRoofVisualization } from '@/lib/openai';
import { buildRoofPrompt } from '@/lib/prompts';
import { checkUsage, recordUsage } from '@/lib/usage';

export const maxDuration = 60; // Allow up to 60 seconds for OpenAI processing

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

  // Check usage limits
  const adminSupabaseForUsage = createAdminClient();
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
  const { productId, originalImagePath, customerName, customerAddress } = body;

  if (!productId || !originalImagePath) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Build the prompt and call OpenAI
    const prompt = buildRoofPrompt(product);
    const resultBuffer = await generateRoofVisualization(imageBuffer, prompt);

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

    // Get result URL
    const { data: urlData } = adminSupabase.storage
      .from('visualizations')
      .getPublicUrl(resultPath);

    return NextResponse.json({
      id: visualization.id,
      resultUrl: urlData.publicUrl,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update visualization as failed
    await adminSupabase
      .from('visualizations')
      .update({
        status: 'failed',
        error_message: errorMessage,
        processing_time_ms: processingTime,
      })
      .eq('id', visualization.id);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
