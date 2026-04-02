import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canShare } from '@/lib/plan-features';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { shareSchema, parseBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by user
  const adminSupabase = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/share', RATE_LIMITS.general);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const body = await request.json();
  const parsed = parseBody(shareSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { visualization_id } = parsed.data;

  // Get profile and subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!canShare(subscription?.plan)) {
    return NextResponse.json({ error: 'Gallery sharing requires a Pro plan or higher' }, { status: 403 });
  }

  // Verify visualization belongs to this tenant (defense-in-depth)
  const { data: viz } = await supabase
    .from('visualizations')
    .select('id')
    .eq('id', visualization_id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!viz) {
    return NextResponse.json({ error: 'Visualization not found' }, { status: 404 });
  }

  // Check if a share link already exists for this visualization
  const { data: existing } = await supabase
    .from('shared_links')
    .select('token')
    .eq('visualization_id', visualization_id)
    .eq('is_active', true)
    .single();

  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  // Create new share link (expires in 30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data: link, error } = await supabase
    .from('shared_links')
    .insert({
      tenant_id: profile.tenant_id,
      visualization_id,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select('token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: link.token });
}
