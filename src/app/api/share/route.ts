import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canShare } from '@/lib/plan-features';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { visualization_id } = await request.json();
  if (!visualization_id) {
    return NextResponse.json({ error: 'Missing visualization_id' }, { status: 400 });
  }

  // Get profile and subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!canShare(subscription?.plan)) {
    return NextResponse.json({ error: 'Gallery sharing requires a Pro plan or higher' }, { status: 403 });
  }

  // Check if a share link already exists for this visualization
  const { data: existing } = await supabase
    .from('shared_links')
    .select('token')
    .eq('visualization_id', visualization_id)
    .eq('is_active', true)
    .single();

  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  // Create new share link
  const { data: link, error } = await supabase
    .from('shared_links')
    .insert({
      tenant_id: profile.tenant_id,
      visualization_id,
      created_by: user.id,
    })
    .select('token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: link.token });
}
