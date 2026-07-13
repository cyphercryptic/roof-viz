import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { signupSchema, parseBody } from '@/lib/validation';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // Rate limit by IP (unauthenticated)
  const ip = getClientIp(request);
  const rateCheck = await checkRateLimit(supabase, ip, '/api/signup', RATE_LIMITS.auth);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const body = await request.json();
  const parsed = parseBody(signupSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { companyName, fullName } = parsed.data;

  // Bind the new profile to a VERIFIED identity, not a caller-supplied id
  // (which would let anyone attach an arbitrary auth user to their tenant).
  // Preferred proof is the session cookie; with email confirmation enabled
  // there is no session yet, so fall back to accepting the id only for a
  // just-created, still-unconfirmed auth user that has no profile.
  const authClient = await createClient();
  const { data: { user: sessionUser } } = await authClient.auth.getUser();

  let userId: string;
  let userEmail: string | null;

  if (sessionUser) {
    userId = sessionUser.id;
    userEmail = sessionUser.email ?? null;
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
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json(
        { error: 'This account is already set up. Please sign in.' },
        { status: 409 }
      );
    }
    userId = authUser.id;
    userEmail = authUser.email ?? null;
  }

  // Create slug from company name. Names like "&&&" normalize to empty, and distinct
  // names can collide, so fall back to a random slug and retry on collision instead of
  // failing signup — a failed tenant insert here strands the already-created auth user.
  const baseSlug =
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'company';

  let tenant: { id: string } | null = null;
  for (let attempt = 0; attempt < 5 && !tenant; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    const { data, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: companyName, slug })
      .select('id')
      .single();

    if (!tenantError) {
      tenant = data;
      break;
    }
    if (tenantError.code !== '23505') {
      console.error('Tenant creation failed during signup:', tenantError);
      return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
    }
    // 23505 = unique violation on slug — loop and try a randomized one
  }

  if (!tenant) {
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
  }

  // Create the admin profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      tenant_id: tenant.id,
      full_name: fullName,
      role: 'owner',
    });

  if (profileError) {
    // A profile may already exist if this is a retry after a partial failure — treat
    // that as success rather than deleting the tenant out from under the user.
    if (profileError.code !== '23505') {
      // Cleanup: delete tenant if profile creation fails
      await supabase.from('tenants').delete().eq('id', tenant.id);
      console.error('Profile creation failed during signup:', profileError);
      return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
    }
  }

  // Send welcome email. Await it so the serverless instance doesn't freeze before the
  // send completes; sendWelcomeEmail swallows its own errors, so this never blocks signup.
  if (userEmail) {
    await sendWelcomeEmail({
      to: userEmail,
      fullName,
      companyName,
    });
  }

  return NextResponse.json({ tenant });
}
