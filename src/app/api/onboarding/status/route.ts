import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const adminSupabase = createAdminClient();
  const tenantId = profile.tenant_id;

  // Check if tenant has any products
  const { count: productCount } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Check if tenant has any completed visualizations
  const { count: vizCount } = await adminSupabase
    .from('visualizations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'completed');

  // Check if tenant has sent any invites
  const { count: inviteCount } = await adminSupabase
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    hasProducts: (productCount || 0) > 0,
    hasVisualizations: (vizCount || 0) > 0,
    hasInvitedTeam: (inviteCount || 0) > 0,
    role: profile.role,
  });
}
