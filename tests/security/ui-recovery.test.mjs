import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const hookCode = compile(await readFile(new URL('../../src/hooks/useUser.ts', import.meta.url), 'utf8'));
const pageCode = compile(await readFile(new URL('../../src/app/(dashboard)/visualize/page.tsx', import.meta.url), 'utf8'));
const flush = () => new Promise(resolve => setImmediate(resolve));

function hookFixture({ authError, profileError, missing = false, rejected = false } = {}) {
  const states = [];
  let cursor = 0;
  let effect;
  let callback;
  let profileReads = 0;
  const redirects = [];
  const user = { id: 'user-a', email: 'a@example.com' };
  const profile = { id: 'user-a', tenant_id: 'tenant-a', role: 'owner' };
  const client = {
    auth: {
      getUser: async () => { if (rejected) throw Error('network down'); return { data: { user }, error: authError }; },
      onAuthStateChange: cb => { callback = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from() {
      profileReads++;
      const chain = { select() { return chain; }, eq() { return chain; }, maybeSingle() { return chain; }, abortSignal: async () => ({ data: missing ? null : profile, error: profileError }) };
      return chain;
    },
  };
  const modules = {
    react: { useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useEffect: fn => { effect = fn; } },
    'next/navigation': { useRouter: () => ({ replace: path => redirects.push(path) }) },
    '@/lib/supabase/client': { createClient: () => client },
  };
  const context = { exports: {}, require: name => modules[name], queueMicrotask, setTimeout, clearTimeout, AbortSignal };
  vm.runInNewContext(hookCode, context);
  const render = () => { cursor = 0; return context.exports.useUser(); };
  render();
  const cleanup = effect();
  return { render, cleanup, redirects, emit: event => callback(event, { user }), profileReads: () => profileReads };
}

test('profile read failure shows retryable error without redirecting an established user to onboarding', async () => {
  const f = hookFixture({ profileError: { message: 'database offline' } }); await flush();
  assert.equal(f.render().loading, false); assert(f.render().error); assert.deepEqual(f.redirects, []); f.cleanup();
});
test('rejected authentication lookup resolves loading and reports recoverable error', async () => {
  const f = hookFixture({ rejected: true }); await flush();
  assert.equal(f.render().loading, false); assert(f.render().error); assert.deepEqual(f.redirects, []); f.cleanup();
});
test('only a successful empty profile lookup starts onboarding', async () => {
  const f = hookFixture({ missing: true }); await flush();
  assert.equal(f.render().error, null); assert.deepEqual(f.redirects, ['/onboarding']); f.cleanup();
});
test('same-user sign-in/refresh events preserve loaded workspace and unsaved page state', async () => {
  const f = hookFixture(); await flush(); const reads = f.profileReads();
  f.emit('SIGNED_IN'); f.emit('TOKEN_REFRESHED'); await flush();
  assert.equal(f.render().loading, false); assert.equal(f.profileReads(), reads); assert.equal(f.render().profile.id, 'user-a'); f.cleanup();
});

function visualizationFixture() {
  // Seed a real component render with a chosen window and an uploaded photo.
  const states = ['configure', [{ id: 'product-a', name: 'Acclaim', category: 'window' }], 'product-a', '', '', 'window', 'interior', false, false, 'preview', false, 'tenant/photo', 'url', [], 0, false, null];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useEffect() {} },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
    '@/lib/supabase/client': { createClient: () => ({}) },
    '@/hooks/useUser': { useUser: () => ({ profile: { role: 'owner' } }) },
    '@/types': { CATEGORY_LABELS: { window: 'Windows', roofing: 'Roofing' }, normalizeProduct: p => p },
    '@/lib/site': { SUPPORT_EMAIL: 'support@example.com' },
  };
  const context = { exports: {}, require: name => modules[name] || new Proxy({}, { get: (_, key) => String(key) }), URLSearchParams };
  vm.runInNewContext(pageCode, context);
  const tree = context.exports.default();
  function find(node, type) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === type) return node;
    const children = node.props?.children;
    for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) { const match = find(child, type); if (match) return match; }
    return null;
  }
  return { states, select: find(tree, 'CategorySelector').props.onSelect };
}
test('clicking the current category preserves selected product and interior perspective', () => {
  const f = visualizationFixture(); f.select('window');
  assert.equal(f.states[2], 'product-a'); assert.equal(f.states[6], 'interior');
});
test('switching category clears incompatible selection and restores exterior perspective', () => {
  const f = visualizationFixture(); f.select('roofing');
  assert.equal(f.states[2], ''); assert.equal(f.states[5], 'roofing'); assert.equal(f.states[6], 'exterior');
});

const galleryCode = compile(await readFile(new URL('../../src/app/(dashboard)/gallery/page.tsx', import.meta.url), 'utf8'));
function galleryFixture({ queryError = false, signingError = false, rowCount = 1 } = {}) {
  const states = [];
  let cursor = 0;
  let effect;
  const ranges = [];
  const rows = Array.from({ length: rowCount }, (_, index) => ({ id: `viz-${index}`, status: 'completed', original_image_path: `tenant/source-${index}`, result_image_path: `tenant/result-${index}`, created_at: '2026-09-01', products: { name: 'Window' } }));
  const client = {
    from: table => {
      let start = 0; let end = 499;
      const chain = {
        select() { return chain; }, eq() { return chain; }, order() { return chain; },
        range(a, b) { start = a; end = b; ranges.push([a, b]); return chain; },
        single: async () => ({ data: { plan: 'pro' }, error: null }),
        then(resolve) { return Promise.resolve({ data: queryError ? null : rows.slice(start, end + 1), error: queryError ? { message: 'database unavailable' } : null }).then(resolve); },
      };
      assert(['subscriptions', 'visualizations'].includes(table));
      return chain;
    },
    storage: { from: () => ({ createSignedUrls: async paths => ({ data: signingError ? null : paths.map(path => ({ path, signedUrl: `https://example.com/${path}` })), error: signingError ? { message: 'storage unavailable' } : null }) }) },
  };
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: { useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useEffect: fn => { effect = fn; }, useMemo: fn => fn() },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => ({}) },
    '@/lib/supabase/client': { createClient: () => client },
    '@/hooks/useUser': { useUser: () => ({ profile: { id: 'user-a', tenant_id: 'tenant-a', role: 'owner' } }) },
  };
  const context = { exports: {}, Date, require: name => modules[name] || new Proxy({}, { get: (_, key) => String(key) }) };
  vm.runInNewContext(galleryCode, context);
  context.exports.default(); effect();
  return { states, ranges };
}
test('gallery database failure reports an error instead of claiming no saved previews', async () => {
  const f = galleryFixture({ queryError: true }); await flush();
  assert.equal(f.states[2], false); assert.match(f.states[3], /could not load/);
});
test('gallery loads additional pages beyond the first server response', async () => {
  const f = galleryFixture({ rowCount: 1001 }); await flush();
  assert.equal(f.states[0].length, 1001); assert.deepEqual(f.ranges, [[0, 499], [500, 999], [1000, 1499]]); assert.equal(f.states[3], null);
});
test('gallery signing failure preserves project records and exposes image retry state', async () => {
  const f = galleryFixture({ signingError: true }); await flush();
  assert.equal(f.states[0].length, 1); assert.equal(f.states[4], true); assert.equal(f.states[2], false); assert.equal(f.states[3], null);
});
