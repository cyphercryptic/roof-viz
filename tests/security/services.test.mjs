import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { hasGenerationAccess } from '../../src/lib/security-policy.ts';

async function load(file, modules = {}, env = {}) {
  const source = await readFile(new URL(`../../src/${file}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, process: { env }, console: { error() {} }, require(name) {
    if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200, headers: options?.headers }) } };
    if (!(name in modules)) throw Error(`Unexpected import ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(code, context);
  return context.exports;
}

test('preview email and checkout links stay on preview even with a production custom URL', async () => {
  const preview = await load('lib/site.ts', {}, { VERCEL_ENV: 'preview', NEXT_PUBLIC_SITE_URL: 'https://live.example', VERCEL_BRANCH_URL: 'branch.vercel.app', VERCEL_URL: 'deploy.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'old-roof.vercel.app' });
  assert.equal(preview.getSiteUrl(), 'https://branch.vercel.app');
  const deployment = await load('lib/site.ts', {}, { VERCEL_ENV: 'preview', VERCEL_URL: 'deploy.vercel.app' });
  assert.equal(deployment.getSiteUrl(), 'https://deploy.vercel.app');
  const production = await load('lib/site.ts', {}, { VERCEL_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://live.example/' });
  assert.equal(production.getSiteUrl(), 'https://live.example');
});

test('rate limiting uses a single atomic RPC and distinguishes limits from database outages', async () => {
  const { checkRateLimit, rateLimitResponse } = await load('lib/rate-limit.ts');
  const calls = [];
  const client = { rpc: async (...args) => { calls.push(args); return { data: { allowed: true, remaining: 4, retry_after_seconds: 0 } }; } };
  const config = { maxRequests: 5, windowSeconds: 900 };
  assert.equal((await checkRateLimit(client, 'user-A', '/api/upload', config)).allowed, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'consume_rate_limit');
  assert.equal(calls[0][1].p_identifier, 'user-A');
  const denied = await checkRateLimit({ rpc: async () => ({ data: { allowed: false, remaining: 0, retry_after_seconds: 17 } }) }, 'a', '/b', config);
  assert.equal(rateLimitResponse(denied).status, 429);
  assert.equal(rateLimitResponse(denied).headers['Retry-After'], '17');
  for (const rpc of [async () => ({ error: { message: 'offline' } }), async () => { throw Error('network'); }, async () => ({ data: { allowed: true } }), async () => ({ data: { allowed: true, remaining: 5, retry_after_seconds: 0 } })]) {
    const result = await checkRateLimit({ rpc }, 'a', '/b', config);
    assert.equal(result.allowed, false);
    assert.equal(rateLimitResponse(result).status, 503);
  }
});

async function routeFixture(file, options = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner-A' } } }) },
    from(table) {
      const call = { table, filters: [], orders: [] }; calls.push(call);
      const q = {
        select(value, opts) { call.select = value; call.head = opts?.head; return q; },
        eq(...args) { call.filters.push(args); return q; },
        gte(...args) { call.filters.push(args); return q; },
        not() { return q; }, order(key) { call.orders.push(key); return q; },
        single: async () => result(), range: async (start) => { call.start = start; return result(); },
        then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
      };
      function result() {
        if (table === 'profiles') return { data: { tenant_id: 'tenant-A', role: options.role || 'owner' } };
        if (table === 'subscriptions') return { data: { plan: 'business', status: options.status || 'active', current_period_end: options.expired ? '2000-01-01' : '2099-01-01' } };
        if (options.countError && call.head) return { data: null, count: null, error: { message: 'offline' } };
        if (options.pageError && call.select === 'processing_time_ms') {
          return call.start === 0 ? { data: Array.from({ length: 1000 }, () => ({ processing_time_ms: 100 })) } : { data: null, error: { message: 'offline' } };
        }
        return call.head ? { count: table === 'products' && call.filters.some(([k,v]) => k === 'is_active' && v) ? 0 : 1 } : { data: [] };
      }
      return q;
    },
  };
  const route = await load(file, {
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/supabase/admin': { createAdminClient: () => client },
    '@/lib/security-policy': { hasGenerationAccess },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { general: {} } },
  });
  return { run: route.GET, calls };
}

test('analytics rejects expired and past-due subscriptions and non-admin roles', async () => {
  for (const options of [{ status: 'past_due' }, { expired: true }, { role: 'rep' }]) {
    const f = await routeFixture('app/api/analytics/route.ts', options);
    assert.equal((await f.run()).status, 403);
  }
});
test('analytics returns a retryable failure instead of partial or false-zero reports', async () => {
  for (const options of [{ countError: true }, { pageError: true }]) {
    const f = await routeFixture('app/api/analytics/route.ts', options);
    assert.equal((await f.run()).status, 503);
  }
  const f = await routeFixture('app/api/analytics/route.ts');
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal(response.body.dailyActivity.length, 30);
  assert.ok(f.calls.filter(c => c.start !== undefined).every(c => c.orders.join(',') === 'created_at,id'));
  assert.ok(f.calls.filter(c => c.table === 'visualizations').every(c => c.filters.some(([k,v]) => k === 'tenant_id' && v === 'tenant-A')));
});
test('onboarding ignores inactive catalog entries and does not fabricate status on database failure', async () => {
  const f = await routeFixture('app/api/onboarding/status/route.ts');
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal(response.body.hasProducts, false);
  const failed = await routeFixture('app/api/onboarding/status/route.ts', { countError: true });
  assert.equal((await failed.run()).status, 503);
});
