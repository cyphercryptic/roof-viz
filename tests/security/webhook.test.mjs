import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../../src/app/api/billing/webhook/route.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ stripeError, dbError, signatureError, leaseBusy, status = 'active', type = 'checkout.session.completed' } = {}) {
  const calls = [];
  const order = [];
  const subscription = { id: 'sub_a', customer: 'cus_a', status, items: { data: [{
    price: { id: 'price_pro' }, current_period_start: 1_780_000_000, current_period_end: 1_790_000_000,
  }] } };
  const event = { id: 'evt_a', created: 100, type, data: { object: type.startsWith('checkout')
    ? { mode: 'subscription', customer: 'cus_a', subscription: 'sub_a', metadata: { tenant_id: 'tenant-a', plan: 'business_pro' } }
    : { id: 'sub_a', customer: 'cus_a' } } };
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/stripe': {
      PLANS: { free: { visualizationLimit: 5 }, pro: { stripePriceId: 'price_pro', visualizationLimit: 250 } },
      stripe: {
        webhooks: { constructEvent: () => { if (signatureError) throw Error('bad signature'); return event; } },
        subscriptions: { retrieve: async () => { order.push('retrieve'); if (stripeError) throw Error('transient outage'); return subscription; } },
      },
    },
    '@/lib/supabase/admin': { createAdminClient: () => ({ rpc: async (name, payload) => {
      order.push(name); calls.push({ name, payload });
      if(name==='acquire_stripe_sync') return { data: leaseBusy ? null : '00000000-0000-4000-8000-000000000099', error: null };
      return { data: 'applied', error: dbError && name==='apply_stripe_subscription_event' ? { message: 'database offline' } : null };
    } }) },
  };
  const context = { exports: {}, require: (name) => {
    if (!(name in modules)) throw Error(`Unexpected dependency ${name}`);
    return modules[name];
  }, process: { env: {} }, console: { error() {} }, Date };
  vm.runInNewContext(javascript, context);
  return { run: () => context.exports.POST({ headers: new Headers({ 'stripe-signature': 'fixture' }), text: async () => '{}' }), calls, order };
}

test('invalid signature is rejected before any database call', async () => {
  const f = fixture({ signatureError: true });
  assert.equal((await f.run()).status, 400);
  assert.equal(f.calls.length, 0);
});
test('transient Stripe failure does not claim completion and is retriable', async () => {
  const f = fixture({ stripeError: true });
  assert.equal((await f.run()).status, 500);
  assert.deepEqual(f.order, ['acquire_stripe_sync','retrieve','release_stripe_sync']);
});
test('database failure produces a retryable response instead of acknowledging lost access', async () => {
  assert.equal((await fixture({ dbError: true }).run()).status, 500);
});
test('checkout entitlement comes from actual Stripe price and status, not metadata', async () => {
  const f = fixture({ status: 'incomplete' });
  assert.equal((await f.run()).status, 200);
  assert.equal(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_plan, 'pro');
  assert.equal(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_status, 'incomplete');
  assert.equal(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_limit, 250);
});
test('portal updates reconcile the current price and canceled state downgrades', async () => {
  const f = fixture({ type: 'customer.subscription.updated', status: 'canceled' });
  assert.equal((await f.run()).status, 200);
  assert.equal(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_deleted, true);
  assert.equal(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_plan, 'free');
});

test('snapshot is retrieved only after acquiring lease, then apply and release follow', async () => {
  const f=fixture(); await f.run();
  assert.deepEqual(f.order,['acquire_stripe_sync','retrieve','apply_stripe_subscription_event','release_stripe_sync']);
  assert.ok(f.calls.find(c=>c.name==='apply_stripe_subscription_event').payload.p_sync_token);
});
test('concurrent busy lease returns retryable failure without reading an unordered snapshot', async () => {
  const f=fixture({leaseBusy:true}); assert.equal((await f.run()).status,500);
  assert.deepEqual(f.order,['acquire_stripe_sync']);
});
