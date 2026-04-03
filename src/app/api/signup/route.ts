import { NextRequest, NextResponse } from 'next/server';
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
  const { userId, companyName, fullName } = parsed.data;

  // Create slug from company name
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Create the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: companyName, slug })
    .select()
    .single();

  if (tenantError) {
    // Handle duplicate slug
    if (tenantError.code === '23505') {
      return NextResponse.json({ error: 'A company with a similar name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
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
    // Cleanup: delete tenant if profile creation fails
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Send welcome email (fire-and-forget — don't block the response)
  // We need the user's email; fetch it from Supabase Auth
  const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
  if (authUser?.email) {
    sendWelcomeEmail({
      to: authUser.email,
      fullName,
      companyName,
    });
  }

  return NextResponse.json({ tenant });
}
