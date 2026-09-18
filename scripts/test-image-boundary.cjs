/* eslint-disable @typescript-eslint/no-require-imports -- Offline CommonJS test harness. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
function modules(mocks = {}) {
  const cache = new Map();
  function load(file) {
    if (!path.extname(file)) file = fs.existsSync(`${file}.ts`) ? `${file}.ts` : path.join(file, 'index.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const testModule = { exports: {} }; cache.set(file, testModule);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireLocal = (id) => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('@/') ? load(path.join(root, 'src', id.slice(2))) : require(id);
    new Function('exports', 'module', 'require', 'process', 'setTimeout', 'fetch', source)(testModule.exports, testModule, requireLocal, { env: {} }, (fn) => fn(), () => { throw new Error('Unexpected network access'); });
    return testModule.exports;
  }
  return (relative) => load(path.join(root, relative));
}
(async () => {
  const valid = {};
  for (const format of ['png', 'jpeg', 'webp']) {
    valid[format] = await sharp({ create: { width: 80, height: 40, channels: 3, background: '#baddad' } })[format]().toBuffer();
  }
  const { normalizeImageBuffer, ImageValidationError } = modules()('src/lib/image-normalization.ts');
  for (const data of Object.values(valid)) {
    const metadata = await sharp(await normalizeImageBuffer(data, { maxDimension: 30 })).metadata();
    assert.equal(metadata.format, 'png'); assert.equal(metadata.width, 30); assert.equal(metadata.height, 15);
  }
  for (const data of [Buffer.alloc(0), Buffer.alloc(10 * 1024 * 1024 + 1), Buffer.from('not an image'), Buffer.from('<svg width="5" height="5"></svg>')]) {
    await assert.rejects(normalizeImageBuffer(data), (error) => error instanceof ImageValidationError);
  }

  const stored = [];
  let storageError = false;
  const tenant = '22222222-2222-4222-8222-222222222222';
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) },
    from() { const q = { select() { return q; }, eq() { return q; }, single: async () => ({ data: { tenant_id: tenant } }) }; return q; },
    storage: { from() { return {
      upload: async (path, buffer, options) => { stored.push({ path, buffer, options }); return { error: storageError ? { message: 'INTERNAL_STORAGE_DETAIL' } : null }; },
      createSignedUrl: async () => ({ data: { signedUrl: 'https://example.test/signed' } }),
    }; } },
  };
  const upload = modules({
    'next/server': { NextResponse: Response }, '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { upload: {} } },
  })('src/app/api/upload/route.ts').POST;
  const send = async (file) => { const form = new FormData(); form.set('file', file); return upload(new Request('https://example.test/api/upload', { method: 'POST', body: form })); };
  assert.equal((await upload(new Request('https://example.test/api/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }))).status, 400);
  assert.equal((await send('text instead of file')).status, 400);
  assert.equal((await send(new File(['bad'], 'spoof.png', { type: 'image/png' }))).status, 400);
  for (const format of ['jpeg', 'webp', 'png']) {
    const response = await send(new File([valid[format]], `photo.${format}`, { type: `image/${format}` }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).url, 'https://example.test/signed');
  }
  assert.equal(new Set(stored.map((item) => item.path)).size, 3);
  for (const item of stored) { assert.equal(item.options.contentType, 'image/png'); assert.equal((await sharp(item.buffer).metadata()).format, 'png'); }
  storageError = true;
  const failed = await send(new File([valid.png], 'photo.png', { type: 'image/png' }));
  assert.equal(failed.status, 500); assert.ok(!(await failed.text()).includes('INTERNAL_STORAGE_DETAIL'));

  let calls = 0;
  let mode = 'jpeg';
  const provider = modules({ '@google/generative-ai': { GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: async () => {
      calls++;
      if (mode === '400') throw Object.assign(new Error('Invalid request'), { status: 400 });
      if (mode === '429' && calls === 1) throw Object.assign(new Error('Busy'), { status: 429 });
      const format = mode === 'webp' ? 'webp' : 'jpeg';
      return { response: { candidates: [{ content: { parts: [{ inlineData: { mimeType: `image/${format}`, data: valid[format].toString('base64') } }] } }] } };
    } }; }
  } } })('src/lib/gemini.ts');
  const generate = (source = valid.png) => provider.generateProductVisualization({ houseImage: source, prompt: 'test', category: 'window' });
  for (mode of ['jpeg', 'webp']) assert.equal((await sharp(await generate()).metadata()).format, 'png');
  mode = '400'; calls = 0; await assert.rejects(generate()); assert.equal(calls, 1, 'Permanent errors must not retry');
  mode = '429'; calls = 0; await generate(); assert.equal(calls, 2, 'Transient errors may retry');
  calls = 0; await assert.rejects(generate(Buffer.from('bad source'))); assert.equal(calls, 0, 'Invalid input must not call the provider');
  console.log('PASS: multipart validation, byte/format limits, actual PNG storage/output, unique paths, sanitized storage failures, provider 400 no-retry/429 retry, invalid input rejected before provider. No external calls.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
