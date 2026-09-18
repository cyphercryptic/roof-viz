import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getStatus() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') throw new Error('Profile query failed');
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const adminSupabase = createAdminClient();
  const tenantId = profile.tenant_id;

  const results = await Promise.all([
    adminSupabase.from('products').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('is_active', true),
    adminSupabase.from('visualizations').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'completed'),
    adminSupabase.from('invites').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ]);
  if (results.some(({ error, count }) => error || count === null)) {
    throw new Error('Onboarding counts unavailable');
  }
  const [products, visualizations, invites] = results;

  return NextResponse.json({
    hasProducts: (products.count || 0) > 0,
    hasVisualizations: (visualizations.count || 0) > 0,
    hasInvitedTeam: (invites.count || 0) > 0,
    role: profile.role,
  });
}

export async function GET() {
  try {
    return await getStatus();
  } catch {
    console.error('Onboarding status unavailable');
    return NextResponse.json({ error: 'Setup status is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
