import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');

test('atomic rate limit admission in PostgreSQL', async (t) => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    for (const name of ['013_rate_limit.sql', '022_atomic_rate_limits.sql']) {
      await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    }
    const consume = (identifier = 'user-A', endpoint = '/api/upload', max = 3) => db.query(
      'SELECT public.consume_rate_limit($1,$2,$3,900) AS result', [identifier, endpoint, max]);
    await t.test('browser and anonymous roles cannot admit themselves', async () => {
      for (const role of ['anon', 'authenticated']) {
        await db.exec(`SET ROLE ${role}`);
        await assert.rejects(consume(), /permission denied/);
        await db.exec('RESET ROLE');
      }
    });
    await db.exec('SET ROLE service_role');
    await t.test('admission persists before the next request and denied attempts consume no slot', async () => {
      // PGlite serializes connections; this tests real SQL admission semantics,
      // not a multi-connection load test of advisory lock contention.
      const batch = await Promise.all(Array.from({ length: 10 }, () => consume()));
      assert.equal(batch.filter(r => r.rows[0].result.allowed).length, 3);
      assert.equal(batch.at(-1).rows[0].result.retry_after_seconds > 0, true);
    });
    await t.test('different endpoints and users have independent allowances', async () => {
      assert.equal((await consume('user-B')).rows[0].result.allowed, true);
      assert.equal((await consume('user-A', '/api/share')).rows[0].result.allowed, true);
      await assert.rejects(consume('bad', '/api', 0), /Invalid rate limit configuration/);
    });
    await db.exec('RESET ROLE');
    await t.test('expired entries allow a new request', async () => {
      await db.exec("UPDATE rate_limit_logs SET created_at=now()-interval '16 minutes'");
      assert.equal((await consume()).rows[0].result.allowed, true);
      assert.equal((await db.query("SELECT count(*)::int AS n FROM rate_limit_logs WHERE identifier='user-A' AND endpoint='/api/upload'")).rows[0].n, 4);
    });
  } finally { await db.close(); }
});
