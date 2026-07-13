import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { SharePageClient } from './SharePageClient';

// Rendered per request: the view counter increments and the signed image URLs
// below must be freshly minted so expiry/revocation of the link actually bites.
export const dynamic = 'force-dynamic';

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
    .select('name, logo_url, brand_primary_color, brand_secondary_color, hide_powered_by')
    .eq('id', link.tenant_id)
    .single();

  // Check if tenant has Business Pro for white-label
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('tenant_id', link.tenant_id)
    .single();

  const isWhiteLabel = subscription?.plan === 'business_pro';

  // Increment view count (fire and forget)
  supabase
    .from('shared_links')
    .update({ view_count: (link.view_count || 0) + 1 })
    .eq('id', link.id)
    .then();

  // Buckets are private — mint short-lived signed URLs with the service role.
  // These are the ONLY way a homeowner sees the images, so expiring/revoking
  // the share link genuinely cuts off access.
  const [{ data: beforeData }, { data: afterData }] = await Promise.all([
    supabase.storage.from('house-photos').createSignedUrl(viz.original_image_path, 60 * 60),
    supabase.storage.from('visualizations').createSignedUrl(viz.result_image_path, 60 * 60),
  ]);

  if (!beforeData || !afterData) {
    notFound();
  }

  // White-label customization (colors, logo, hiding attribution) is a Business
  // Pro feature — enforce the plan here, not just in the settings UI, so writing
  // the tenant columns directly can't unlock it.
  return (
    <SharePageClient
      beforeUrl={beforeData.signedUrl}
      afterUrl={afterData.signedUrl}
      productName={viz.products?.name || 'Roofing Product'}
      productBrand={viz.products?.brand || ''}
      productColor={viz.products?.color || ''}
      customerName={viz.customer_name}
      companyName={tenant?.name || 'RoofViz'}
      whiteLabel={isWhiteLabel}
      primaryColor={isWhiteLabel ? tenant?.brand_primary_color || '#E07A2F' : '#E07A2F'}
      secondaryColor={isWhiteLabel ? tenant?.brand_secondary_color || '#3D2B1F' : '#3D2B1F'}
      hidePoweredBy={isWhiteLabel ? tenant?.hide_powered_by ?? false : false}
      logoUrl={isWhiteLabel ? tenant?.logo_url || null : null}
    />
  );
}
