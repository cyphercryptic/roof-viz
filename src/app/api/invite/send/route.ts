import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { inviteSendSchema, parseBody } from '@/lib/validation';
import { sendInviteEmail } from '@/lib/email';
import { getSiteUrl } from '@/lib/site';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Confirm your email and sign in to invite your team.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('tenant_id, role, full_name').eq('id', user.id).maybeSingle();
    if (profileError) {
      return NextResponse.json({ error: 'Unable to verify your account. Please try again.' }, { status: 503 });
    }
    if (!profile) return NextResponse.json({ error: 'Finish setting up your company first.' }, { status: 403 });
    if (profile.role !== 'admin' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only company owners and admins can send invites.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const rateCheck = await checkRateLimit(admin, user.id, '/api/invite/send', RATE_LIMITS.general);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);
    const parsed = parseBody(inviteSendSchema, await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const email = parsed.data.email.trim().toLowerCase();
    const { role } = parsed.data;

    // Resolve email context before reserving capacity so a failed read cannot leave
    // an invitation behind that the caller never receives.
    const { data: tenant, error: tenantError } = await admin
      .from('tenants').select('name').eq('id', profile.tenant_id).single();
    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Unable to load your company. Please try again.' }, { status: 503 });
    }

    const inviteUrlBase = getSiteUrl();
    const token = crypto.randomBytes(32).toString('hex');
    const { data: invite, error } = await admin.rpc('create_team_invite', {
      p_inviter_id: user.id,
      p_email: email,
      p_role: role,
      p_token: token,
      p_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    // Migration 020 makes this check + reservation atomic under the tenant lock.
    // Missing RPCs/read errors fail closed; there is no direct-insert fallback.
    if (error || !invite) {
      if (error?.code === '23505') return NextResponse.json({ error: 'This person is already a member or has an active invitation.' }, { status: 409 });
      if (error?.code === 'P0001') return NextResponse.json({ error: 'Your plan has no available team seats. Remove an unused invitation or update your plan.' }, { status: 403 });
      if (error?.code === '42501') return NextResponse.json({ error: 'Inviting teammates requires an active plan and company admin access.' }, { status: 403 });
      return NextResponse.json({ error: 'Unable to create this invitation. Please try again.' }, { status: 503 });
    }

    const inviteUrl = `${inviteUrlBase}/invite/${invite.token}`;
    // A delivery outage must not hide a valid invitation. Return a copyable link.
    let emailSent = false;
    try {
      emailSent = await sendInviteEmail({ to: email, inviterName: profile.full_name, companyName: tenant.name, role, inviteUrl });
    } catch { /* The saved invitation is still usable through its link. */ }
    return NextResponse.json({ invite, inviteUrl, emailSent });
  } catch {
    return NextResponse.json({ error: 'Unable to create this invitation. Please try again.' }, { status: 503 });
  }
}
