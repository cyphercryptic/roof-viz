import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { SharePageClient } from './SharePageClient';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch the shared link with visualization, product, and tenant data
  const { data: link, error } = await supabase
    .from('shared_links')
    .select(`
      *,
      visualizations (
        *,
        products (*)
      )
    `)
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (error || !link) {
    notFound();
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    notFound();
  }

  const viz = link.visualizations;
  if (!viz || viz.status !== 'completed' || !viz.result_image_path) {
    notFound();
  }

  // Get tenant info for branding
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, logo_url')
    .eq('id', link.tenant_id)
    .single();

  // Increment view count (fire and forget)
  supabase
    .from('shared_links')
    .update({ view_count: (link.view_count || 0) + 1 })
    .eq('id', link.id)
    .then();

  // Build public URLs for images
  const { data: beforeData } = supabase.storage
    .from('house-photos')
    .getPublicUrl(viz.original_image_path);
  const { data: afterData } = supabase.storage
    .from('visualizations')
    .getPublicUrl(viz.result_image_path);

  return (
    <SharePageClient
      beforeUrl={beforeData.publicUrl}
      afterUrl={afterData.publicUrl}
      productName={viz.products?.name || 'Roofing Product'}
      productBrand={viz.products?.brand || ''}
      productColor={viz.products?.color || ''}
      customerName={viz.customer_name}
      companyName={tenant?.name || 'RoofViz'}
    />
  );
}
