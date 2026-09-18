import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { catalogSeedSchema, parseBody } from '@/lib/validation';
import { MASTER_PRODUCTS } from '@/lib/master-products';

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

  const body = await request.json().catch(() => null);
  const parsed = parseBody(catalogSeedSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Seed only real catalog entries. Client-supplied reference URLs and attributes
  // never override the curated source of truth.
  const selections = parsed.data.products.map((selection) => MASTER_PRODUCTS.find((product) =>
    product.category === selection.category &&
    product.brand === selection.brand && product.line === selection.line && product.color === selection.color &&
    (!selection.name || selection.name === product.name) && !product.comingSoon
  ));
  if (selections.some((product) => !product)) {
    return NextResponse.json({ error: 'One or more products are no longer available in the catalog.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase.from('products')
    .select('category, name, brand, color').eq('tenant_id', profile.tenant_id);
  if (existingError) {
    const schemaMissing = ['42703', 'PGRST204'].includes(existingError.code);
    return NextResponse.json({
      error: schemaMissing ? 'The unified catalog is awaiting database setup. Please contact support.' : 'Unable to load your product catalog.',
      ...(schemaMissing ? { code: 'SCHEMA_NOT_READY' } : {}),
    }, { status: schemaMissing ? 503 : 500 });
  }
  const key = (product: { category: string; brand: string; name: string; color: string }) =>
    JSON.stringify([product.category, product.brand, product.name, product.color]);
  const known = new Set((existing || []).map(key));
  const rows = [];
  for (const product of selections) {
    if (!product || known.has(key(product))) continue;
    known.add(key(product));
    rows.push({
      tenant_id: profile.tenant_id,
      name: product.name,
      brand: product.brand,
      line: product.line,
      color: product.color,
      category: product.category,
      style: product.style || null,
      material: product.material || null,
      attributes: product.attributes,
      description: product.description || null,
      reference_image_url: product.reference_image_url || null,
      is_active: true,
    });
  }
  if (!rows.length) return NextResponse.json({ added: 0 });
  const { data, error } = await supabase.from('products').insert(rows).select('id');
  if (error) {
    return NextResponse.json({ error: 'Unable to add selected products. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ added: data?.length || 0 });
}
