import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MasterProduct } from '@/lib/master-products';

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

  const { products } = await request.json() as { products: MasterProduct[] };

  if (!products || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'No products provided' }, { status: 400 });
  }

  // Insert all selected products
  const rows = products.map((p) => ({
    tenant_id: profile.tenant_id,
    name: `${p.line} - ${p.color}`,
    brand: p.brand,
    color: p.color,
    style: p.style,
    description: p.description,
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
