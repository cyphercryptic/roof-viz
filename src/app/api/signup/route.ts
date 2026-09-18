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

  const body = await request.json().catch(() => null);
  const parsed = parseBody(signupSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { companyName, fullName } = parsed.data;

  // Only a verified session may provision a company. A caller-supplied user id
  // is never identity proof, including for recently created unconfirmed accounts.
  const authClient = await createClient();
  const { data: { user: sessionUser } } = await authClient.auth.getUser();
  if (!sessionUser?.email || !sessionUser.email_confirmed_at) {
    return NextResponse.json({ error: 'Confirm your email and sign in to finish setup.' }, { status: 401 });
  }
  const userId = sessionUser.id;
  const userEmail = sessionUser.email;
  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles').select('tenant_id').eq('id', userId).maybeSingle();
  if (existingError) {
    return NextResponse.json({ error: 'Could not check your account. Please try again.' }, { status: 500 });
  }
  if (existingProfile) {
    return NextResponse.json({ tenant: { id: existingProfile.tenant_id } });
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
    // This tenant was created by this request and has no profile; remove only it.
    // A concurrent successful setup owns a different tenant and is preserved.
    await supabase.from('tenants').delete().eq('id', tenant.id);
    if (profileError.code === '23505') {
      const { data: existing } = await supabase.from('profiles')
        .select('tenant_id').eq('id', userId).maybeSingle();
      if (existing) return NextResponse.json({ tenant: { id: existing.tenant_id } });
    }
    console.error('Profile creation failed during signup:', profileError);
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
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
