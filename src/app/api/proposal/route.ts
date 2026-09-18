import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createProposalPdf } from '@/lib/proposal-pdf';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { proposalSchema, parseBody } from '@/lib/validation';
import { isTenantMediaPath, hasGenerationAccess } from '@/lib/security-policy';

const PRO_PLANS = ['pro', 'business', 'business_pro'];

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
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

    // 2. Plan gate - Pro+ only
    const adminSupabase = createAdminClient();

    // Rate limit by user
    const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/proposal', RATE_LIMITS.general);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck);

    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!subscription || !PRO_PLANS.includes(subscription.plan)) {
      return NextResponse.json(
        { error: 'PDF proposals require a Pro plan or higher. Please upgrade to access this feature.', code: 'PLAN_REQUIRED' },
        { status: 403 }
      );
    }

    if (!hasGenerationAccess(subscription)) {
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing.', code: 'SUBSCRIPTION_INACTIVE' },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json().catch(() => null);
    const parsed = parseBody(proposalSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { visualization_id } = parsed.data;

    // 4. Fetch visualization with product data
    const { data: visualization, error: vizError } = await adminSupabase
      .from('visualizations')
      .select('*, product:products(*)')
      .eq('id', visualization_id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (vizError || !visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
    }

    if (visualization.product && visualization.product.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Visualization product is unavailable.' }, { status: 404 });
    }

    if (visualization.status !== 'completed' || !visualization.result_image_path) {
      return NextResponse.json({ error: 'Visualization is not completed yet' }, { status: 400 });
    }

    // Privileged downloads must stay inside this company's storage namespace,
    // including for legacy rows created before the database integrity constraints.
    if (![visualization.original_image_path, visualization.result_image_path]
      .every(path => isTenantMediaPath(path, profile.tenant_id))) {
      return NextResponse.json({ error: 'Visualization images are unavailable.' }, { status: 404 });
    }

    // 5. Fetch tenant info
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('name, logo_url')
      .eq('id', profile.tenant_id)
      .single();

    // 6. Download images from Supabase storage
    const [originalResult, resultResult] = await Promise.all([
      adminSupabase.storage.from('house-photos').download(visualization.original_image_path),
      adminSupabase.storage.from('visualizations').download(visualization.result_image_path),
    ]);

    if (originalResult.error || !originalResult.data) {
      return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
    }
    if (resultResult.error || !resultResult.data) {
      return NextResponse.json({ error: 'Failed to download result image' }, { status: 500 });
    }

    const originalImageBytes = new Uint8Array(await originalResult.data.arrayBuffer());
    const resultImageBytes = new Uint8Array(await resultResult.data.arrayBuffer());

    // Optionally download company logo
    let logoBytes: Uint8Array | null = null;
    if (tenant?.logo_url) {
      try {
        const logoUrl = new URL(tenant.logo_url);
        const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
        const logoPrefix = `/storage/v1/object/public/logos/${profile.tenant_id}/`;
        if (logoUrl.origin === storageOrigin && logoUrl.pathname.startsWith(logoPrefix)) {
          const objectPath = decodeURIComponent(logoUrl.pathname.slice('/storage/v1/object/public/logos/'.length));
          if (!isTenantMediaPath(objectPath, profile.tenant_id)) throw new Error('Invalid logo path');
          const { data } = await adminSupabase.storage.from('logos').download(objectPath);
          if (data && data.size <= 5 * 1024 * 1024) logoBytes = new Uint8Array(await data.arrayBuffer());
        }
      } catch {
        // Optional logo failure must not block the proposal.
      }
    }

    const pdfBytes = await createProposalPdf({
      companyName: tenant?.name,
      customerName: visualization.customer_name,
      customerAddress: visualization.customer_address,
      originalImage: originalImageBytes,
      resultImage: resultImageBytes,
      logoImage: logoBytes,
      product: visualization.product,
    });

    const filename = `proposal-${visualization_id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error('Proposal generation error:', error);
    return NextResponse.json({ error: 'Could not create the proposal. Please try again.' }, { status: 500 });
  }
}
