/* eslint-disable @typescript-eslint/no-require-imports -- Offline CommonJS test harness. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const pdfLib = require('pdf-lib');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const drawnText = [];
const drawnImages = [];
const pdfMock = { ...pdfLib, PDFDocument: { create: async () => {
  const doc = await pdfLib.PDFDocument.create();
  const addPage = doc.addPage.bind(doc);
  doc.addPage = (...args) => {
    const page = addPage(...args);
    const text = page.drawText.bind(page);
    page.drawText = (value, options) => {
      drawnText.push({ text: value, ...options, width: options.font.widthOfTextAtSize(value, options.size) });
      return text(value, options);
    };
    const image = page.drawImage.bind(page);
    page.drawImage = (value, options) => {
      drawnImages.push({ originalRatio: value.width / value.height, drawnRatio: options.width / options.height });
      return image(value, options);
    };
    return page;
  };
  return doc;
} } };
function load(relative, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  const requireLocal = (id) => Object.hasOwn(mocks, id) ? mocks[id] : id === 'pdf-lib' ? pdfMock : id === '@/types' ? load('src/types/index.ts', mocks) : id.startsWith('@/') ? load(`src/${id.slice(2)}.ts`, mocks) : require(id);
  new Function('exports', 'module', 'require', source)(testModule.exports, testModule, requireLocal);
  return testModule.exports;
}
(async () => {
  const { createProposalPdf } = load('src/lib/proposal-pdf.ts');
  const image = await sharp({ create: { width: 400, height: 800, channels: 3, background: '#bad2dc' } }).png().toBuffer();
  const result = await sharp({ create: { width: 1200, height: 400, channels: 3, background: '#adbbb0' } }).webp().toBuffer();
  let last;
  for (const category of ['roofing', 'window', 'sliding_glass_door', 'entry_door']) {
    const start = drawnText.length;
    const bytes = await createProposalPdf({
      companyName: 'Exterior Concept Demonstration', customerName: 'Łukasz Example',
      customerAddress: 'Long customer address '.repeat(23),
      originalImage: image, resultImage: result,
      product: { category, name: 'LongProductSKU'.repeat(20), brand: 'Example', color: 'White', material: 'vinyl', description: 'Detailed product appearance, finish and hardware specification. '.repeat(40) },
    });
    const pdf = await pdfLib.PDFDocument.load(bytes);
    assert.ok(pdf.getPageCount() >= 2, 'Long content should paginate');
    assert.ok(pdf.getTitle().includes(category === 'roofing' ? 'Roofing' : category === 'window' ? 'Windows' : category === 'entry_door' ? 'Entry Doors' : 'Patio Doors'));
    for (const item of drawnText.slice(start)) {
      assert.ok(item.x >= 50 && item.x + item.width <= 563, `Text overflow: ${item.text}`);
      const footer = item.text.startsWith('ExteriorViz |') || /^\d+ \/ \d+$/.test(item.text);
      assert.ok(footer || item.y >= 75, `Content overlaps footer: ${item.text}`);
      assert.ok(item.y < 742);
    }
    last = { pdf, bytes };
  }
  for (const item of drawnImages) assert.ok(Math.abs(item.originalRatio - item.drawnRatio) < 0.0001, 'Image aspect ratios must remain unchanged');
  if (process.env.PROPOSAL_TEST_ARTIFACTS) {
    const out = process.env.PROPOSAL_TEST_ARTIFACTS;
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'proposal-long-content.pdf'), last.bytes);
    for (let i = 0; i < last.pdf.getPageCount(); i++) {
      const single = await pdfLib.PDFDocument.create();
      const [page] = await single.copyPages(last.pdf, [i]); single.addPage(page);
      fs.writeFileSync(path.join(out, `proposal-page-${i + 1}.pdf`), await single.save());
    }
  }
  const tenantId = '22222222-2222-4222-8222-222222222222';
  let expired = true;
  let wrongProductTenant = false;
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: tenantId } } }) },
    from(table) {
      const q = { select() { return q; }, eq() { return q; }, single: async () => ({ data:
        table === 'profiles' ? { tenant_id: tenantId } :
        table === 'subscriptions' ? { plan: 'pro', status: 'active', current_period_end: expired ? '2020-01-01T00:00:00Z' : '2099-01-01T00:00:00Z' } :
        { status: 'completed', original_image_path: `${tenantId}/source.png`, result_image_path: `${tenantId}/result.png`, product: { tenant_id: wrongProductTenant ? 'other-tenant' : tenantId } }
      }) }; return q;
    },
  };
  const proposalRoute = load('src/app/api/proposal/route.ts', {
    'next/server': { NextResponse: Response }, '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/rate-limit': { checkRateLimit: async () => ({ allowed: true }), RATE_LIMITS: { general: {} } },
  }).POST;
  const request = (body = JSON.stringify({ visualization_id: tenantId })) => new Request('https://example.test/api/proposal', { method: 'POST', body });
  assert.equal((await proposalRoute(request())).status, 403, 'Expired paid access cannot export');
  expired = false; wrongProductTenant = true;
  assert.equal((await proposalRoute(request())).status, 404, 'Legacy cross-tenant product join must not be rendered');
  assert.equal((await proposalRoute(request('invalid json'))).status, 400);
  console.log('PASS: actual PDFs for four categories, paginated long text/SKUs, content/footer bounds, non-Latin names, WebP conversion, image aspect ratios, expired-plan/product-tenant guards. No external calls.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
