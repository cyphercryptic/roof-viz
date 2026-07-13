import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { inviteAcceptSchema, parseBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // Rate limit by IP (unauthenticated)
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(supabase, ip, '/api/invite/accept', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const body = await request.json();
  const parsed = parseBody(inviteAcceptSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { token, fullName } = parsed.data;

  // Bind the new profile to a VERIFIED identity, not a bare caller-supplied id.
  // Session cookie is the preferred proof; with email confirmation enabled the
  // invite page has no session yet, so accept the id only for a just-created,
  // still-unconfirmed auth user (the invite token itself gates tenant access).
  const authClient = await createClient();
  const { data: { user: sessionUser } } = await authClient.auth.getUser();

  let userId: string;
  if (sessionUser) {
    userId = sessionUser.id;
  } else {
    const claimed = parsed.data.userId;
    if (!claimed) {
      return NextResponse.json(
        { error: 'Your session could not be verified. Please sign in and try again.' },
        { status: 401 }
      );
    }
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(claimed);
    const ageMs = authUser ? Date.now() - new Date(authUser.created_at).getTime() : Infinity;
    if (!authUser || authUser.email_confirmed_at || ageMs > 15 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Your session could not be verified. Please sign in and try again.' },
        { status: 401 }
      );
    }
    userId = authUser.id;
  }

  // Fetch and validate the invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  // Check invite expiration
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  // Whitelist allowed roles
  const allowedRoles = ['rep', 'admin', 'demo'];
  const role = allowedRoles.includes(invite.role) ? invite.role : 'rep';

  // Create the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      tenant_id: invite.tenant_id,
      full_name: fullName,
      role,
    });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Mark invite as accepted
  await supabase
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  return NextResponse.json({ success: true });
}
