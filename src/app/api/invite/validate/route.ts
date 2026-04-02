import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { inviteValidateSchema, parseBody } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();

  // Rate limit by IP (unauthenticated)
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(supabase, ip, '/api/invite/validate', RATE_LIMITS.invite);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const token = request.nextUrl.searchParams.get('token');
  const parsed = parseBody(inviteValidateSchema, { token });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: invite, error } = await supabase
    .from('invites')
    .select('email, role, tenant_id, accepted_at, expires_at, tenants(name)')
    .eq('token', parsed.data.token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'Invite already used' }, { status: 410 });
  }

  // Check expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  const tenantData = invite.tenants as unknown as { name: string };

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    companyName: tenantData?.name || 'Unknown Company',
  });
}
