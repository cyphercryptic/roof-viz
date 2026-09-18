import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Deterministic local safeguard, including deployment source archives without
// .git. Never print a matching value. This is not a full entropy/history scanner.
const ignored = new Set(['.git', 'node_modules', '.next', '.vercel', 'coverage', 'out']);
const patterns = [
  /\b(?:sk_live_|sk_test_|whsec_|sb_secret_)[A-Za-z0-9_-]{24,}/g,
  /\bsk-(?:proj-|ant-api\d+-)[A-Za-z0-9_-]{24,}/g,
  /\b(?:gh[pousr]_|github_pat_|re_)[A-Za-z0-9_]{32,}/g,
  /\bAIza[A-Za-z0-9_-]{35}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
];
const jwt = /\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}/g;
const findings = [];
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('.env') || entry.name === '.doppler.yaml') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    if (!entry.isFile() || !/\.(?:[cm]?[jt]sx?|json|md|sql|ya?ml|html|css|sh)$/.test(entry.name)) continue;
    const source = await readFile(file, 'utf8');
    let found = patterns.some(pattern => { pattern.lastIndex = 0; return pattern.test(source); });
    for (const match of source.matchAll(jwt)) {
      try {
        const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString());
        if (payload.role === 'service_role') found = true;
      } catch { /* Not a structured privileged token. */ }
    }
    if (found) findings.push(file);
  }
}
await scan('.');
if (findings.length) {
  console.error('Potential private credentials detected; values redacted:', findings.join(', '));
  process.exitCode = 1;
} else {
  console.log('Source credential check passed (known private-key patterns and service-role JWTs).');
}
