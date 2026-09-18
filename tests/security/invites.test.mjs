import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

function compile(source) {
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const validationContext = { exports: {}, require: () => ({ z }) };
vm.runInNewContext(compile(await readFile(new URL('../../src/lib/validation.ts', import.meta.url), 'utf8')), validationContext);
const sources = Object.fromEntries(await Promise.all(['send', 'accept'].map(async (route) => [route,
  compile(await readFile(new URL(`../../src/app/api/invite/${route}/route.ts`, import.meta.url), 'utf8'))])));

const userId = '10000000-0000-4000-8000-000000000001';
const attackerChosenId = '10000000-0000-4000-8000-000000000002';
const token = 'a'.repeat(64);
function fixture(route, options = {}) {
  const calls = [];
  const user = options.user === undefined ? { id: userId, email: 'rep@example.com', email_confirmed_at: '2026-01-01' } : options.user;
  const profile = { tenant_id: 'tenant-a', role: options.role || 'owner', full_name: 'Owner' };
  function chain(table, privileged = false) {
    const response = table === 'profiles' ? { data: profile, error: options.profileError || null } : { data: { name: 'Example company' }, error: options.tenantError || null };
    const builder = {
      select() { return builder; }, eq() { return builder; },
      maybeSingle: async () => response, single: async () => response,
      insert() { throw Error(`Unexpected direct table mutation: ${table}`); },
      update() { throw Error(`Unexpected direct table mutation: ${table}`); },
    };
    calls.push({ table, privileged });
    return builder;
  }
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    crypto: { default: { randomBytes: () => ({ toString: () => token }) } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: options.authError || null }) }, from: (table) => chain(table) }) },
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: (table) => chain(table, true), rpc: async (name, payload) => {
      calls.push({ rpc: name, payload });
      if (options.rpcThrow) throw Error('transport failure');
      return { data: route === 'send' ? { id: 'invite-a', token } : { success: true }, error: options.rpcError || null };
    } }) },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { general: {}, auth: {} }, rateLimitResponse() {} },
    '@/lib/validation': validationContext.exports,
    '@/lib/site': { getSiteUrl: () => 'https://example.com' },
    '@/lib/email': { sendInviteEmail: async (payload) => { calls.push({ email: payload }); if (options.mailThrow) throw Error('mail offline'); return options.emailSent !== false; } },
  };
  const context = { exports: {}, Date, require: (name) => { if (!(name in modules)) throw Error(`Unexpected dependency: ${name}`); return modules[name]; } };
  vm.runInNewContext(sources[route], context);
  const body = options.body || (route === 'send' ? { email: 'REP@Example.com', role: 'rep' } : { token, fullName: 'New Rep', userId: attackerChosenId });
  return { calls, run: () => context.exports.POST({ json: async () => { if (options.badJson) throw Error('invalid json'); return body; } }) };
}

for (const route of ['send', 'accept']) {
  test(`${route}: no signed-in identity never invokes privileged RPC`, async () => {
    const f = fixture(route, { user: null }); assert.equal((await f.run()).status, 401); assert.equal(f.calls.length, 0);
  });
  test(`${route}: unconfirmed identity is rejected`, async () => {
    const f = fixture(route, { user: { id: userId, email: 'rep@example.com', email_confirmed_at: null } });
    assert.equal((await f.run()).status, 401); assert.equal(f.calls.length, 0);
  });
  test(`${route}: malformed JSON is a client error with no invitation mutation`, async () => {
    const f = fixture(route, { badJson: true }); assert.equal((await f.run()).status, 400); assert(!f.calls.some(c => c.rpc));
  });
  test(`${route}: missing migration or database outage fails closed`, async () => {
    const f = fixture(route, { rpcError: { code: 'PGRST202', message: 'rpc not found' } });
    assert.equal((await f.run()).status, 503); assert(!f.calls.some(c => c.email));
  });
  test(`${route}: exhausted seat allowance is denied`, async () => {
    const f = fixture(route, { rpcError: { code: 'P0001' } }); assert.equal((await f.run()).status, 403); assert(!f.calls.some(c => c.email));
  });
  test(`${route}: inactive subscription or authorization failure is denied`, async () => {
    const f = fixture(route, { rpcError: { code: '42501' } }); assert.equal((await f.run()).status, 403);
  });
}

test('accept: body userId cannot override server-verified identity', async () => {
  const f = fixture('accept'); assert.equal((await f.run()).status, 200);
  const rpc = f.calls.find(c => c.rpc); assert.equal(rpc.rpc, 'accept_team_invite');
  assert.equal(rpc.payload.p_user_id, userId); assert.notEqual(rpc.payload.p_user_id, attackerChosenId);
  assert(!f.calls.some(c => c.table));
});
test('accept: expired invitation does not return success', async () => {
  assert.equal((await fixture('accept', { rpcError: { code: 'P0002' } }).run()).status, 404);
});
test('accept: profile insert/transaction failure is retryable and does not consume invitation in route', async () => {
  const f = fixture('accept', { rpcError: { code: 'XX000' } }); assert.equal((await f.run()).status, 503);
  assert.equal(f.calls.filter(c => c.rpc).length, 1); assert(!f.calls.some(c => c.table));
});
test('send: profile lookup failure denies reservation', async () => {
  const f = fixture('send', { profileError: { message: 'read failure' } }); assert.equal((await f.run()).status, 503); assert(!f.calls.some(c => c.rpc));
});
test('send: representative cannot create invitations', async () => {
  const f = fixture('send', { role: 'rep' }); assert.equal((await f.run()).status, 403); assert(!f.calls.some(c => c.rpc));
});
test('send: failed tenant lookup leaves no reserved invitation', async () => {
  const f = fixture('send', { tenantError: { message: 'read failure' } }); assert.equal((await f.run()).status, 503); assert(!f.calls.some(c => c.rpc));
});
test('send: saved invite is returned for manual sharing when email delivery fails', async () => {
  const f = fixture('send', { mailThrow: true }); const response = await f.run();
  assert.equal(response.status, 200); assert.equal(response.body.emailSent, false);
  assert.equal(response.body.inviteUrl, `https://example.com/invite/${token}`);
  assert.equal(f.calls.find(c => c.rpc).payload.p_email, 'rep@example.com');
});
test('send: duplicate pending invitation does not send another email', async () => {
  const f = fixture('send', { rpcError: { code: '23505' } }); assert.equal((await f.run()).status, 409); assert(!f.calls.some(c => c.email));
});

 test('accept: whitespace-only names are rejected before consuming an invite', async () => {
  const f = fixture('accept', { body: { token, fullName: '   ' } });
  assert.equal((await f.run()).status, 400); assert(!f.calls.some(c => c.rpc));
});
