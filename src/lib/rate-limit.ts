import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  unavailable?: boolean;
}

export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowSeconds: 900 },       // 5 req / 15 min
  invite: { maxRequests: 10, windowSeconds: 900 },     // 10 req / 15 min
  upload: { maxRequests: 20, windowSeconds: 900 },     // 20 req / 15 min
  visualize: { maxRequests: 10, windowSeconds: 900 },  // 10 req / 15 min
  general: { maxRequests: 60, windowSeconds: 60 },     // 60 req / 1 min
} as const;

/**
 * Atomically admit and record a request. Database failures deny admission so a
 * missing migration or outage cannot silently disable provider spend controls.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });
    if (error || !data || typeof data.allowed !== 'boolean'
      || !Number.isInteger(data.remaining) || data.remaining < 0 || data.remaining >= config.maxRequests
      || !Number.isInteger(data.retry_after_seconds) || data.retry_after_seconds < 0
      || (data.allowed && data.retry_after_seconds !== 0)
      || (!data.allowed && (data.remaining !== 0 || data.retry_after_seconds < 1))) {
      throw new Error('Rate limit admission unavailable');
    }
    return {
      allowed: data.allowed,
      remaining: data.remaining,
      retryAfterSeconds: data.retry_after_seconds,
    };
  } catch {
    console.error('Rate limit admission unavailable');
    return { allowed: false, remaining: 0, retryAfterSeconds: 30, unavailable: true };
  }
}

/**
 * Extract client IP from request headers (Vercel sets x-forwarded-for).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Distinguish exhausted allowance from an unavailable admission service.
 */
export function rateLimitResponse(result: RateLimitResult | number): NextResponse {
  const unavailable = typeof result !== 'number' && result.unavailable;
  const retryAfterSeconds = typeof result === 'number' ? result : result.retryAfterSeconds;
  return NextResponse.json(
    { error: unavailable ? 'Service temporarily unavailable. Please try again shortly.' : 'Too many requests. Please try again later.' },
    {
      status: unavailable ? 503 : 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    }
  );
}
