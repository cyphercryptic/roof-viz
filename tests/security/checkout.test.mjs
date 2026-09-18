import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

const compile = async (name) => ts.transpileModule(await readFile(new URL(`../../src/app/api/billing/${name}/route.ts`, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const checkoutCode = await compile('checkout');
const portalCode = await compile('portal');

function fixture(options = {}) {
  const calls = { customer: [], checkout: [], portal: [] };
  const sub = { stripe_customer_id: options.newCustomer ? null : 'cus_A', stripe_subscription_id: options.localSubscription || null };
  function client() {
    return {
      rpc: async () => ({ data: !options.schedulerStale, error: null }),
      auth: { getUser: async () => ({ data: { user: options.signedOut ? null : { id: 'user_A' } }, error: null }) },
      from(table) {
        let update = false;
        const q = {
          select() { return q; }, eq() { return q; }, is() { return q; },
          update() { update = true; return q; },
          async single() { return result(); }, async maybeSingle() { return result(); },
        };
        function result() {
          if (table === 'profiles') return { data: { tenant_id: 'tenant_A', role: options.role || 'owner' }, error: null };
          if (table === 'subscriptions' && !update) return { data: sub, error: options.readError ? { message: 'offline' } : null };
          if (table === 'subscriptions' && update) return { data: { stripe_customer_id: 'cus_new' }, error: options.saveError ? { message: 'offline' } : null };
          throw Error(`Unexpected table ${table}`);
        }
        return q;
      },
    };
  }
  const metered = options.plan === 'pay_per_use';
  const price = { id: metered ? 'price_metered' : 'price_pro', active: true, recurring: { usage_type: metered ? 'metered' : 'licensed' } };
  const stripe = {
    prices: { retrieve: async () => options.priceMismatch ? { ...price, recurring: null } : price },
    customers: { create: async (...args) => { calls.customer.push(args); return { id: 'cus_new' }; } },
    subscriptions: {
      list: async () => ({ data: options.stripeStatus ? [{ status: options.stripeStatus }] : [], has_more: false }),
      retrieve: async () => ({ status: options.retrievedStatus || 'active' }),
    },
    checkout: { sessions: {
      list: async (params) => ({ data: params.status === 'open' ? (options.open ? [options.open] : []) : (options.latest ? [options.latest] : []), has_more: false }),
      listLineItems: async () => ({ data: [{ price }], has_more: false }),
      create: async (...args) => { calls.checkout.push(args); return { id: 'cs_new', status: 'open', url: 'https://checkout.stripe.com/new' }; },
    } },
    billingPortal: { sessions: { create: async (...args) => { calls.portal.push(args); return { url: 'https://billing.stripe.com/portal' }; } } },
  };
  const modules = {
    'node:crypto': crypto,
    'next/server': { NextResponse: { json: (body, opts) => ({ body, status: opts?.status || 200 }) } },
    '@/lib/supabase/server': { createClient: async () => client() },
    '@/lib/supabase/admin': { createAdminClient: client },
    '@/lib/stripe': { stripe, PLANS: {
      pro: { stripePriceId: 'price_pro', payPerUse: false },
      pay_per_use: { stripePriceId: 'price_metered', payPerUse: true },
    } },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { general: {} } },
    '@/lib/validation': { billingCheckoutSchema: {}, parseBody: () => ({ success: true, data: { plan: options.plan || 'pro' } }) },
    '@/lib/site': { getSiteUrl: () => 'https://canonical.example' },
    '@/lib/metering': { isMeteringConfigured: () => !options.meteringDisabled },
  };
  function load(code) {
    const context = { exports: {}, require: (name) => {
      if (!(name in modules)) throw Error(`Unexpected module ${name}`);
      return modules[name];
    }, console: { error() {} } };
    vm.runInNewContext(code, context);
    return () => context.exports.POST({ json: async () => ({}) });
  }
  return { calls, checkout: load(checkoutCode), portal: load(portalCode) };
}

test('unauthenticated and non-admin users cannot start checkout', async () => {
  for (const [options,status] of [[{signedOut:true},401],[{role:'rep'},403]]) {
    const f=fixture(options); assert.equal((await f.checkout()).status,status); assert.equal(f.calls.checkout.length,0);
  }
});
test('subscription read and customer save failures stop checkout', async () => {
  for (const options of [{readError:true},{newCustomer:true,saveError:true}]) {
    const f=fixture(options); assert.equal((await f.checkout()).status,503); assert.equal(f.calls.checkout.length,0);
  }
});
test('customer and checkout use stable tenant-level idempotency keys', async () => {
  const a=fixture({newCustomer:true}); const b=fixture({newCustomer:true});
  assert.equal((await a.checkout()).status,200); await b.checkout();
  assert.equal(a.calls.customer[0][1].idempotencyKey,b.calls.customer[0][1].idempotencyKey);
  assert.equal(a.calls.checkout[0][1].idempotencyKey,b.calls.checkout[0][1].idempotencyKey);
  assert.equal(a.calls.checkout[0][0].success_url,'https://canonical.example/settings/billing?success=true');
});
test('metered price omits quantity; licensed price sends one', async () => {
  const metered=fixture({plan:'pay_per_use'}); await metered.checkout();
  assert.equal('quantity' in metered.calls.checkout[0][0].line_items[0],false);
  const licensed=fixture(); await licensed.checkout();
  assert.equal(licensed.calls.checkout[0][0].line_items[0].quantity,1);
});
test('metered checkout stays disabled until durable worker is configured', async () => {
  const f=fixture({plan:'pay_per_use',meteringDisabled:true});
  assert.equal((await f.checkout()).status,503); assert.equal(f.calls.checkout.length,0);
  assert.equal((await fixture({plan:'pay_per_use',schedulerStale:true}).checkout()).status,503);
});
test('misconfigured recurring price is denied', async () => {
  const f=fixture({priceMismatch:true}); assert.equal((await f.checkout()).status,503); assert.equal(f.calls.checkout.length,0);
});
test('local existing subscription and Stripe outstanding subscriptions block second purchase', async () => {
  for (const options of [{localSubscription:'sub_A'}, ...['active','trialing','past_due','unpaid','paused','incomplete'].map(stripeStatus=>({stripeStatus}))]) {
    const f=fixture(options); assert.equal((await f.checkout()).status,409); assert.equal(f.calls.checkout.length,0);
  }
});
test('same plan open checkout is reused; different plan is blocked', async () => {
  const open={id:'cs_open',mode:'subscription',status:'open',url:'https://checkout.stripe.com/resume',metadata:{tenant_id:'tenant_A',plan:'pro'}};
  const f=fixture({open}); assert.equal((await f.checkout()).body.url,open.url); assert.equal(f.calls.checkout.length,0);
  const other=fixture({open:{...open,metadata:{...open.metadata,plan:'starter'}}});
  assert.equal((await other.checkout()).status,409); assert.equal(other.calls.checkout.length,0);
});
test('checkout opened or completed during earlier Stripe reads cannot create competing checkout', async () => {
  for (const latest of [{id:'cs_race',mode:'subscription',status:'open'},{id:'cs_race',mode:'subscription',status:'complete',subscription:'sub_A'}]) {
    const f=fixture({latest}); assert.equal((await f.checkout()).status,409); assert.equal(f.calls.checkout.length,0);
  }
});
test('billing portal fails closed on DB errors and uses canonical return URL', async () => {
  const failed=fixture({readError:true}); assert.equal((await failed.portal()).status,503); assert.equal(failed.calls.portal.length,0);
  const f=fixture(); assert.equal((await f.portal()).status,200);
  assert.equal(f.calls.portal[0][0].return_url,'https://canonical.example/settings/billing');
});
