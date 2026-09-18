import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverMeteringEvent, isMeteringWorkerConfigured } from '@/lib/metering';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isMeteringWorkerConfigured()) return NextResponse.json({ error: 'Metering worker is not configured' }, { status: 503 });
  const provided = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createAdminClient();
  const deadline = Date.now() + 45_000;
  let sent = 0;
  let retries = 0;
  try {
    for (let count = 0; count < 25 && Date.now() < deadline; count++) {
      const outcome = await deliverMeteringEvent(supabase);
      if (outcome === 'idle') break;
      if (outcome === 'sent') sent++;
      else retries++;
    }
    const { count: reviewCount, error } = await supabase.from('metering_outbox')
      .select('*', { count: 'exact', head: true }).eq('status', 'review');
    if (error) throw new Error('Cannot verify metering review queue');
    const heartbeat = await supabase.rpc('record_metering_worker_run');
    if (heartbeat.error) throw new Error('Cannot record metering scheduler health');
    return NextResponse.json({ sent, retries, needsReview: reviewCount || 0 }, { status: reviewCount ? 503 : 200 });
  } catch (error) {
    console.error('Metering worker failed:', error);
    return NextResponse.json({ error: 'Metering delivery requires retry', sent, retries }, { status: 503 });
  }
}
