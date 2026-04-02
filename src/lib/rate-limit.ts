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
}

export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowSeconds: 900 },       // 5 req / 15 min
  invite: { maxRequests: 10, windowSeconds: 900 },     // 10 req / 15 min
  upload: { maxRequests: 20, windowSeconds: 900 },     // 20 req / 15 min
  visualize: { maxRequests: 10, windowSeconds: 900 },  // 10 req / 15 min
  general: { maxRequests: 60, windowSeconds: 60 },     // 60 req / 1 min
} as const;

/**
 * Check rate limit using Supabase rate_limit_logs table.
 * Inserts a log entry and counts recent entries within the window.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  // Count existing requests in window
  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart);

  if (error) {
    // On error, allow the request (fail-open) but log
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxRequests, retryAfterSeconds: 0 };
  }

  const currentCount = count ?? 0;

  if (currentCount >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: config.windowSeconds,
    };
  }

  // Insert new log entry
  await supabase.from('rate_limit_logs').insert({
    identifier,
    endpoint,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - currentCount - 1,
    retryAfterSeconds: 0,
  };
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
 * Return a standard 429 response with Retry-After header.
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    }
  );
}
