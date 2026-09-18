import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { inviteAcceptSchema, parseBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user || !user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Confirm your email and sign in with the invited email address to join this team.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const rateCheck = await checkRateLimit(admin, user.id, '/api/invite/accept', RATE_LIMITS.auth);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck);
    const parsed = parseBody(inviteAcceptSchema, await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

    if (!parsed.data.fullName.trim()) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });

    // The database transaction validates the confirmed auth email, current plan,
    // remaining seats and token before inserting the profile and consuming the
    // invitation together. Caller-supplied userId is never an identity credential.
    const { data, error } = await admin.rpc('accept_team_invite', {
      p_user_id: user.id,
      p_token: parsed.data.token,
      p_full_name: parsed.data.fullName.trim(),
    });
    if (error || !data?.success) {
      if (error?.code === 'P0002') return NextResponse.json({ error: 'This invitation is invalid, expired, or already used. Ask your company admin for a new link.' }, { status: 404 });
      if (error?.code === '23505') return NextResponse.json({ error: 'Your account already belongs to a company. Sign in with the invited account or contact your admin.' }, { status: 409 });
      if (error?.code === 'P0001') return NextResponse.json({ error: 'This company has no available team seats. Ask its admin to update the plan.' }, { status: 403 });
      if (error?.code === '42501') return NextResponse.json({ error: 'Use the invited email address to join. The company must also have an active plan.' }, { status: 403 });
      return NextResponse.json({ error: 'Unable to join the team. Please try again.' }, { status: 503 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to verify this invitation. Please try again.' }, { status: 503 });
  }
}
