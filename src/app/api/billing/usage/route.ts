import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUsage } from '@/lib/usage';

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
  try {
    const usage = await checkUsage(adminSupabase, profile.tenant_id, {
      userId: user.id,
      role: profile.role,
    });
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: 'Could not load your visualization allowance. Please try again.' }, { status: 503 });
  }
}
