import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: invite, error } = await supabase
    .from('invites')
    .select('email, role, tenant_id, accepted_at, tenants(name)')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'Invite already used' }, { status: 410 });
  }

  const tenantData = invite.tenants as unknown as { name: string };

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    companyName: tenantData?.name || 'Unknown Company',
  });
}
