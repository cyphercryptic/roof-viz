/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads TypeScript modules in an isolated VM. */
// Offline contract tests: transpile the actual modules and stub every paid/network boundary.
// Run: node scripts/test-unified-domain.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function modules(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(filename) {
    if (!path.extname(filename)) filename = fs.existsSync(`${filename}.ts`) ? `${filename}.ts` : path.join(filename, 'index.ts');
    if (cache.has(filename)) return cache.get(filename).exports;
    const testModule = { exports: {} };
    cache.set(filename, testModule);
    const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(js, {
      module: testModule, exports: testModule.exports, Buffer, URL, Response, Request, AbortSignal, console,
      process: { env: {} }, setTimeout: (fn) => fn(),
      fetch: () => { throw new Error('Unexpected network access'); },
      require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('@/') ? load(path.join(root, 'src', id.slice(2))) : id.startsWith('.') ? load(path.resolve(path.dirname(filename), id)) : require(id),
      ...globals,
    }, { filename });
    return testModule.exports;
  }
  return (relative) => load(path.join(root, relative));
}
const load = modules();
const { MASTER_PRODUCTS } = load('src/lib/master-products.ts');
const { normalizeProduct } = load('src/types/index.ts');
const { buildPrompt } = load('src/lib/prompts.ts');
const { visualizeSchema, catalogSeedSchema } = load('src/lib/validation.ts');
const uuid = '11111111-1111-4111-8111-111111111111';
const tenant = '22222222-2222-4222-8222-222222222222';
const counts = {};
for (const product of MASTER_PRODUCTS) counts[product.category] = (counts[product.category] || 0) + 1;
assert.deepEqual(counts, { roofing: 155, window: 52, sliding_glass_door: 88, entry_door: 208 });
assert.equal(new Set(MASTER_PRODUCTS.map((p) => JSON.stringify([p.category, p.brand, p.name, p.color]))).size, MASTER_PRODUCTS.length);
assert.equal(catalogSeedSchema.safeParse({ products: MASTER_PRODUCTS }).success, true);
assert.equal(visualizeSchema.safeParse({ productId: uuid, originalImagePath: `${tenant}/photo.png`, category: 'siding' }).success, false);
assert.equal(normalizeProduct({ name: 'Old roof', attributes: null }).category, 'roofing');
assert.equal(Object.keys(normalizeProduct({ attributes: null }).attributes).length, 0);
for (const product of MASTER_PRODUCTS) {
  const prompt = buildPrompt(normalizeProduct(product), { perspective: 'exterior' });
  assert.ok(prompt.includes(product.color));
  if (product.category === 'sliding_glass_door' && product.name.includes('Hinged')) {
    assert.match(prompt, /FRENCH HINGED PATIO DOOR/);
    assert.doesNotMatch(prompt, /brand-new SLIDING/);
  }
}

async function routeCase(product, body = {}, options = {}) {
  const events = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: uuid } } }) },
    from(table) {
      let operation, payload;
      const query = {
        select() { return query; },
        eq(column, value) { events.push(['filter', table, column, value]); return query; },
        insert(value) { operation = 'insert'; payload = value; events.push(['insert', table, value]); return query; },
        update(value) { operation = 'update'; payload = value; events.push(['update', table, value]); return query; },
        single: async () => ({ data: table === 'profiles' ? { tenant_id: tenant, role: 'owner' } : table === 'products' ? product : { id: uuid }, error: table === 'visualizations' && options.insertError ? { code: options.insertError } : null }),
        then(resolve) { return Promise.resolve({ data: [], error: operation === 'update' && payload.status === 'completed' && options.failCompletion ? { message: 'failed' } : null }).then(resolve); },
      };
      return query;
    },
    storage: { from() { return {
      download: async () => ({ data: new Blob([Buffer.from([0xff, 0xd8, 0xff])]) }),
      upload: async () => ({ error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/signed-result' } }),
    }; } },
  };
  class ContentRefusedError extends Error {}
  const POST = modules({
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@sentry/nextjs': { captureException: () => {} },
    '@/lib/usage': { checkUsage: async () => { if (options.failUsage) throw new Error('database detail'); return { allowed: true }; }, recordUsage: async () => { events.push(['usage']); } },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { visualize: {} } },
    '@/lib/product-images': { getProductImageUrl: () => null, extractProductLine: () => 'Line' },
    '@/lib/gemini': {
      ContentRefusedError,
      fetchProductReference: async () => { events.push(['reference']); return Buffer.from('reference'); },
      generateProductVisualization: async (input) => { events.push(['generate', input]); return Buffer.from('result'); },
    },
  })('src/app/api/visualize/route.ts').POST;
  const response = await POST(new Request('https://example.test/api/visualize', {
    method: 'POST', body: JSON.stringify({ productId: uuid, originalImagePath: `${tenant}/photo.png`, ...body }),
  }));
  return { response, events };
}
async function seedCase(products, existing = [], dbError = null) {
  let inserted = [];
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: uuid } } }) },
    from() {
      const query = {
        select() { return query; }, eq() { return query; },
        insert(rows) { inserted = rows; return query; },
        single: async () => ({ data: { tenant_id: tenant, role: 'owner' } }),
        then(resolve) { return Promise.resolve({ data: inserted.length ? inserted : existing, error: dbError }).then(resolve); },
      };
      return query;
    },
  };
  const POST = modules({
    'next/server': { NextResponse: Response },
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { general: {} } },
  })('src/app/api/catalog/seed/route.ts').POST;
  const response = await POST(new Request('https://example.test/api/catalog/seed', { method: 'POST', body: JSON.stringify({ products }) }));
  return { response, inserted };
}

(async () => {
  for (const category of Object.keys(counts)) {
    const product = { ...MASTER_PRODUCTS.find((p) => p.category === category), id: uuid, tenant_id: tenant, is_active: true, color: 'Black' };
    const { response, events } = await routeCase(product);
    assert.equal(response.status, 200, category);
    assert.equal((await response.json()).resultUrl, 'https://example.test/signed-result');
    assert.equal(events.find((e) => e[0] === 'generate')[1].category, category);
    assert.equal(events.find((e) => e[0] === 'insert')[2].category, category);
    assert.ok(events.some((e) => e[0] === 'filter' && e[2] === 'tenant_id' && e[3] === tenant));
    assert.ok(events.some((e) => e[0] === 'filter' && e[2] === 'is_active' && e[3] === true));
    assert.equal(events.filter((e) => e[0] === 'usage').length, 1);
  }
  const roof = MASTER_PRODUCTS.find((p) => p.category === 'roofing');
  for (const body of [{ category: 'window' }, { perspective: 'interior' }, { originalImagePath: 'another-tenant/photo.png' }, { originalImagePath: `${tenant}/../secret` }, { originalImagePath: `${tenant}/%2e%2e/secret` }]) {
    const { response, events } = await routeCase(roof, body);
    assert.equal(response.status, 400);
    assert.ok(!events.some((e) => e[0] === 'generate'));
  }
  const window = { ...MASTER_PRODUCTS.find((p) => p.category === 'window'), color: 'Black' };
  for (const [product, body] of [[window, { perspective: 'interior' }], [{ ...window, color: 'Sandtone' }, {}]]) {
    const { response, events } = await routeCase(product, body);
    assert.equal(response.status, 200);
    assert.ok(!events.some((e) => e[0] === 'reference'));
  }
  const failed = await routeCase(roof, {}, { failCompletion: true });
  assert.equal(failed.response.status, 500);
  assert.ok(!failed.events.some((e) => e[0] === 'usage'));
  for (const [options, expected] of [[{ failUsage: true }, 503], [{ insertError: 'P0001' }, 429], [{ insertError: '42501' }, 403]]) {
    const outcome = await routeCase(roof, {}, options);
    assert.equal(outcome.response.status, expected);
    assert.ok(!outcome.events.some((e) => e[0] === 'generate'));
  }
  const legacy = { ...roof }; delete legacy.category;
  const old = await routeCase(legacy);
  assert.equal(old.response.status, 200);
  assert.ok(!Object.hasOwn(old.events.find((e) => e[0] === 'insert')[2], 'category'));
  const seeds = Object.keys(counts).map((category) => MASTER_PRODUCTS.find((p) => p.category === category));
  const seeded = await seedCase([...seeds, seeds[0]]);
  assert.equal(seeded.response.status, 200);
  assert.equal(seeded.inserted.length, 4, 'Repeated products are seeded once');
  assert.equal((await seedCase(seeds, seeded.inserted)).inserted.length, 0, 'Existing products are not duplicated');
  const forged = { ...seeds[1], reference_image_url: 'https://attacker.example/private.png', attributes: { windowType: 'attacker' } };
  const canonical = await seedCase([forged]);
  assert.equal(canonical.inserted[0].reference_image_url, seeds[1].reference_image_url);
  assert.equal(canonical.inserted[0].attributes.windowType, seeds[1].attributes.windowType);
  assert.equal((await seedCase([{ ...seeds[0], name: 'Invented SKU' }])).response.status, 400);
  assert.equal((await seedCase(seeds, [], { code: '42703' })).response.status, 503);
  const providerCalls = [];
  let refuse = false;
  let fetches = 0;
  const provider = modules({
    '@google/generative-ai': { GoogleGenerativeAI: class {
      getGenerativeModel(config) {
        return { generateContent: async (parts, request) => {
          providerCalls.push({ config, parts, request });
          return { response: refuse ? { candidates: [{ finishReason: 'SAFETY' }] } : { candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from('image').toString('base64') } }] } }] } };
        } };
      }
    } },
  }, { fetch: async () => { fetches++; return new Response(Buffer.from('asset'), { headers: { 'content-type': 'image/png' } }); } })('src/lib/gemini.ts');
  const image = Buffer.from([0xff, 0xd8, 0xff]);
  await provider.generateProductVisualization({ houseImage: image, referenceImage: image, category: 'entry_door', prompt: 'Door' });
  assert.equal(providerCalls[0].config.model, 'gemini-3.1-flash-image-preview');
  assert.equal(providerCalls[0].parts[0].inlineData.mimeType, 'image/jpeg');
  assert.match(providerCalls[0].parts[1].text, /entry door style reference/);
  assert.ok(providerCalls[0].request.signal);
  await provider.generateRoofVisualization({ houseImage: image, prompt: 'Roof' });
  assert.equal(providerCalls[1].config.model, 'gemini-2.5-flash-image');
  refuse = true;
  await assert.rejects(provider.generateProductVisualization({ houseImage: image, category: 'window', prompt: 'Window' }), (error) => error instanceof provider.ContentRefusedError);
  assert.equal(providerCalls.length, 3, 'Refusals must not retry');
  assert.equal(await provider.fetchProductReference('http://127.0.0.1/private', new Set()), null);
  assert.equal(await provider.fetchProductReference('https://untrusted.example/asset.png', new Set()), null);
  assert.equal(fetches, 0);
  assert.equal((await provider.fetchProductReference('https://manufacturer.example/product.png', new Set(['https://manufacturer.example/product.png']))).toString(), 'asset');
  assert.equal(fetches, 1);
  console.log('PASS: 503 catalog variants, prompt routing, hinged doors, legacy rows, tenant/category validation, all four render flows, private result URLs, reference policy, completion-before-billing, provider MIME/model/refusal contracts, trusted reference fetches, canonical/idempotent catalog seeding. No external requests.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
