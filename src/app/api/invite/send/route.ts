import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { inviteSendSchema, parseBody } from '@/lib/validation';
import { sendInviteEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // Authenticate user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get profile and verify admin/owner role
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only admins can send invites' }, { status: 403 });
  }

  // Rate limit
  const adminSupabase = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/invite/send', RATE_LIMITS.general);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  // Validate body
  const body = await request.json();
  const parsed = parseBody(inviteSendSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { email, role } = parsed.data;

  // Get tenant name for the email
  const { data: tenant } = await adminSupabase
    .from('tenants')
    .select('name')
    .eq('id', profile.tenant_id)
    .single();

  const companyName = tenant?.name || 'your team';

  // Generate token and create invite record
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { data: invite, error: insertError } = await adminSupabase
    .from('invites')
    .insert({
      tenant_id: profile.tenant_id,
      email,
      role,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Build invite URL and send email (fire-and-forget)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roofviz.com';
  const inviteUrl = `${siteUrl}/invite/${token}`;

  sendInviteEmail({
    to: email,
    inviterName: profile.full_name,
    companyName,
    role,
    inviteUrl,
  });

  return NextResponse.json({ invite });
}
