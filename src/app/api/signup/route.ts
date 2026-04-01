import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const { userId, companyName, fullName } = await request.json();

  if (!userId || !companyName || !fullName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();

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
      role: 'admin',
    });

  if (profileError) {
    // Cleanup: delete tenant if profile creation fails
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ tenant });
}
