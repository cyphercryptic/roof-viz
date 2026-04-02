import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export async function GET() {
  const supabase = await createClient();

  // Auth check
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

  // Role gate: must be admin or owner
  if (profile.role !== 'admin' && profile.role !== 'owner') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const adminSupabase = createAdminClient();

  // Rate limit by user
  const rateCheck = await checkRateLimit(adminSupabase, user.id, '/api/analytics', RATE_LIMITS.general);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterSeconds);

  // Plan gate: must be business or business_pro
  const { data: subscription } = await adminSupabase
    .from('subscriptions')
    .select('plan')
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!subscription || (subscription.plan !== 'business' && subscription.plan !== 'business_pro')) {
    return NextResponse.json(
      { error: 'Analytics is available on Business plans and above' },
      { status: 403 }
    );
  }

  const tenantId = profile.tenant_id;

  // Total completed visualizations
  const { count: totalVisualizations } = await adminSupabase
    .from('visualizations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'completed');

  // Visualizations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: thisMonthCount } = await adminSupabase
    .from('visualizations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString());

  // Average processing time
  const { data: processingData } = await adminSupabase
    .from('visualizations')
    .select('processing_time_ms')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .not('processing_time_ms', 'is', null);

  let avgProcessingTime = 0;
  if (processingData && processingData.length > 0) {
    const total = processingData.reduce((sum, v) => sum + (v.processing_time_ms || 0), 0);
    avgProcessingTime = Math.round(total / processingData.length);
  }

  // Most popular products (top 5)
  const { data: allVizProducts } = await adminSupabase
    .from('visualizations')
    .select('product_id, products(id, name, brand, color)')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed');

  const productCounts: Record<string, { name: string; brand: string; color: string; count: number }> = {};
  if (allVizProducts) {
    for (const v of allVizProducts) {
      const pid = v.product_id;
      const product = v.products as unknown as { id: string; name: string; brand: string; color: string } | null;
      if (!product) continue;
      if (!productCounts[pid]) {
        productCounts[pid] = { name: product.name, brand: product.brand, color: product.color, count: 0 };
      }
      productCounts[pid].count++;
    }
  }
  const popularProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Visualizations per rep (join profiles for name)
  const { data: allVizReps } = await adminSupabase
    .from('visualizations')
    .select('created_by, created_at, profiles(id, full_name)')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed');

  const repStats: Record<string, { name: string; count: number; lastActive: string }> = {};
  if (allVizReps) {
    for (const v of allVizReps) {
      const repId = v.created_by;
      const creator = v.profiles as unknown as { id: string; full_name: string } | null;
      if (!creator) continue;
      if (!repStats[repId]) {
        repStats[repId] = { name: creator.full_name, count: 0, lastActive: v.created_at };
      }
      repStats[repId].count++;
      if (v.created_at > repStats[repId].lastActive) {
        repStats[repId].lastActive = v.created_at;
      }
    }
  }
  const repsPerformance = Object.values(repStats).sort((a, b) => b.count - a.count);

  // Daily visualization count for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const { data: dailyVizData } = await adminSupabase
    .from('visualizations')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Build daily counts map
  const dailyCounts: Record<string, number> = {};
  // Initialize all 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    dailyCounts[key] = 0;
  }
  if (dailyVizData) {
    for (const v of dailyVizData) {
      const key = v.created_at.split('T')[0];
      if (dailyCounts[key] !== undefined) {
        dailyCounts[key]++;
      }
    }
  }
  const dailyActivity = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    totalVisualizations: totalVisualizations ?? 0,
    thisMonth: thisMonthCount ?? 0,
    avgProcessingTime,
    activeReps: repsPerformance.length,
    popularProducts,
    repsPerformance,
    dailyActivity,
  });
}
