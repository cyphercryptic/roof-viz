import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { SharePageClient } from './SharePageClient';
import { hasGenerationAccess, isTenantMediaPath } from '@/lib/security-policy';
import { canShare } from '@/lib/plan-features';

// Rendered per request: the view counter increments and the signed image URLs
// below must be freshly minted so expiry/revocation of the link actually bites.
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
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
  if (!link.expires_at || !Number.isFinite(Date.parse(link.expires_at)) || new Date(link.expires_at) <= new Date()) {
    notFound();
  }

  const viz = link.visualizations;
  if (!viz || viz.tenant_id !== link.tenant_id || viz.status !== 'completed'
    || (viz.products && viz.products.tenant_id !== link.tenant_id)
    || !isTenantMediaPath(viz.original_image_path, link.tenant_id)
    || !isTenantMediaPath(viz.result_image_path, link.tenant_id)) {
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
    .select('plan, status, current_period_end')
    .eq('tenant_id', link.tenant_id)
    .single();

  if (!subscription || !hasGenerationAccess(subscription) || !canShare(subscription.plan)) notFound();
  const isWhiteLabel = subscription.plan === 'business_pro';

  await supabase
    .from('shared_links')
    .update({ view_count: (link.view_count || 0) + 1 })
    .eq('id', link.id);

  // Buckets are private — mint short-lived signed URLs with the service role.
  // Revocation prevents new URLs; already issued URLs live for at most 5 minutes.
  const signedUrlSeconds = Math.max(1, Math.min(300, link.expires_at
    ? Math.floor((Date.parse(link.expires_at) - new Date().getTime()) / 1000) : 300));
  const [{ data: beforeData }, { data: afterData }] = await Promise.all([
    supabase.storage.from('house-photos').createSignedUrl(viz.original_image_path, signedUrlSeconds),
    supabase.storage.from('visualizations').createSignedUrl(viz.result_image_path, signedUrlSeconds),
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
      productName={viz.products?.name || 'Exterior Product'}
      productBrand={viz.products?.brand || ''}
      productColor={viz.products?.color || ''}
      customerName={viz.customer_name}
      companyName={tenant?.name || 'ExteriorViz'}
      whiteLabel={isWhiteLabel}
      primaryColor={isWhiteLabel ? tenant?.brand_primary_color || '#E07A2F' : '#E07A2F'}
      secondaryColor={isWhiteLabel ? tenant?.brand_secondary_color || '#3D2B1F' : '#3D2B1F'}
      hidePoweredBy={isWhiteLabel ? tenant?.hide_powered_by ?? false : false}
      logoUrl={isWhiteLabel ? tenant?.logo_url || null : null}
    />
  );
}
