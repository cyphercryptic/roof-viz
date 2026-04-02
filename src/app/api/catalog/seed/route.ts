import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { catalogSeedSchema, parseBody } from '@/lib/validation';

// POST: Add selected products from master catalog to tenant's product list
export async function POST(request: NextRequest) {
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Rate limit by user
  const adminSupabase = createAdminClient();
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/catalog/seed', RATE_LIMITS.general);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  const body = await request.json();
  const parsed = parseBody(catalogSeedSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Insert all selected products
  const rows = parsed.data.products.map((p) => ({
    tenant_id: profile.tenant_id,
    name: `${p.line} - ${p.color}`,
    brand: p.brand,
    color: p.color,
    style: p.style || null,
    description: p.description || null,
    is_active: true,
  }));

  const { data, error } = await supabase
    .from('products')
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: data?.length || 0 });
}
