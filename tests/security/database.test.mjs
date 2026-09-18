import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const migration = (name) => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const U = '10000000-0000-4000-8000-000000000001';
const V = '10000000-0000-4000-8000-000000000002';
const N = '10000000-0000-4000-8000-000000000003';
const PA = '20000000-0000-4000-8000-000000000001';
const PB = '20000000-0000-4000-8000-000000000002';

// Executes the actual committed migration in an ephemeral WASM PostgreSQL engine.
// No production database, external account or model call is involved.
test('database security boundaries', async (t) => {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;
    CREATE FUNCTION public.gen_random_bytes(n integer) RETURNS bytea LANGUAGE sql AS
      $$ SELECT decode(repeat(replace(gen_random_uuid()::text, '-', ''), (n + 15) / 16), 'hex') $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
  `);
  for (const name of ['001_tenants.sql', '002_profiles.sql', '003_products.sql', '004_visualizations.sql',
    '005_invites.sql', '006_rls_policies.sql', '007_subscriptions.sql', '010_owner_role.sql',
    '011_shared_links.sql', '014_invite_expiration.sql', '017_profiles_prevent_privilege_escalation.sql']) {
    await db.exec(await migration(name));
  }
  await db.exec(`
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    INSERT INTO auth.users(id,email,email_confirmed_at) VALUES
      ('${U}','owner-a@example.test',now()), ('${V}','owner-b@example.test',now()), ('${N}','new@example.test',now());
    INSERT INTO tenants(id,name,slug) VALUES ('${A}','A','a'),('${B}','B','b');
    INSERT INTO profiles(id,tenant_id,full_name,role) VALUES ('${U}','${A}','A','owner'),('${V}','${B}','B','owner');
    INSERT INTO products(id,tenant_id,name,brand,color) VALUES ('${PA}','${A}','A','A','A'),('${PB}','${B}','B','B','B');
    UPDATE subscriptions SET visualization_limit = 1;
  `);
  await db.exec(await migration('019_unified_product_categories.sql'));
  await db.exec(await migration('020_security_boundaries.sql'));

  async function asUser(user, operation) {
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.role='authenticated'; SET request.jwt.claim.sub='${user}';`);
    try { return await operation(); }
    finally { await db.exec("RESET ROLE; SET request.jwt.claim.role=''; SET request.jwt.claim.sub='';"); }
  }
  async function asService(operation) {
    await db.exec("SET ROLE service_role; SET request.jwt.claim.role='service_role';");
    try { return await operation(); }
    finally { await db.exec("RESET ROLE; SET request.jwt.claim.role='';"); }
  }
  const job = (tenant, user, product, status = 'processing') => db.query(
    'INSERT INTO visualizations(tenant_id,created_by,product_id,original_image_path,status) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [tenant, user, product, `${tenant}/photo/original.png`, status]);

  await t.test('new account cannot insert itself as owner of an existing tenant', async () => {
    await asUser(N, () => assert.rejects(db.query(
      'INSERT INTO profiles(id,tenant_id,full_name,role) VALUES ($1,$2,$3,$4)', [N,A,'intruder','owner']), /permission denied/));
  });
  await t.test('owner cannot move own profile to another tenant', async () => {
    await asUser(U, () => assert.rejects(db.query('UPDATE profiles SET tenant_id=$1 WHERE id=$2', [B,U]), /tenant is not allowed/));
  });
  await t.test('storage paths reject URL normalization and encoded traversal before privileged downloads', async () => {
    for (const suffix of ['\t..\t/victim/original.png', '\n..\r/victim/original.png', 'photo.png?x=1', 'photo.png#fragment', '%2e%2e/victim/original.png', '\\victim/file.png', './file.png', '../file.png', '/file.png']) {
      await asUser(U, () => assert.rejects(db.query(
        'INSERT INTO visualizations(tenant_id,created_by,product_id,original_image_path,status) VALUES ($1,$2,$3,$4,$5)',
        [A,U,PA,`${A}/${suffix}`,'processing']), /Invalid visualization tenant data/));
    }
  });
  let ownJob;
  let otherJob;
  await t.test('first job reserves the last credit; second is denied while first is in flight', async () => {
    ownJob = (await asUser(U, () => job(A,U,PA))).rows[0].id;
    await asUser(U, () => assert.rejects(job(A,U,PA), /Visualization limit reached/));
    otherJob = (await asUser(V, () => job(B,V,PB))).rows[0].id;
  });
  await t.test('browser cannot forge a completed result or alter stored media paths', async () => {
    await asUser(U, () => assert.rejects(job(A,U,PA,'completed'), /must begin processing/));
    await asUser(U, () => assert.rejects(db.query('UPDATE visualizations SET result_image_path=$1 WHERE id=$2', [`${B}/private.png`,ownJob]), /permission denied/));
  });
  await t.test('trusted completion still counts when no usage record was written', async () => {
    await asService(() => db.query("UPDATE visualizations SET status='completed', result_image_path=tenant_id::text || '/result.png'"));
    await asUser(U, () => assert.rejects(job(A,U,PA), /Visualization limit reached/));
  });
  await t.test('browser cannot delete a completed job to refund its allowance', async () => {
    await asUser(U, () => assert.rejects(db.query('DELETE FROM visualizations WHERE id=$1', [ownJob]), /permission denied/));
  });
  let share;
  await t.test('direct share INSERT and UPDATE cannot reference another tenant visualization', async () => {
    await asUser(U, () => assert.rejects(db.query('INSERT INTO shared_links(tenant_id,created_by,visualization_id) VALUES ($1,$2,$3)', [A,U,otherJob]), /row-level security/));
    share = (await asUser(U, () => db.query('INSERT INTO shared_links(tenant_id,created_by,visualization_id) VALUES ($1,$2,$3) RETURNING id', [A,U,ownJob]))).rows[0].id;
    await asUser(U, () => assert.rejects(db.query('UPDATE shared_links SET visualization_id=$1 WHERE id=$2', [otherJob,share]), /row-level security/));
  });
  await t.test('failed billing denies generation even when quota is available', async () => {
    await db.exec(`UPDATE subscriptions SET status='past_due', visualization_limit=100 WHERE tenant_id='${A}';`);
    await asUser(U, () => assert.rejects(job(A,U,PA), /active subscription is required/));
  });

  await db.exec(`UPDATE subscriptions SET stripe_customer_id='cus_A', stripe_subscription_id='sub_A' WHERE tenant_id='${A}';`);
  const reconcile = (event, created, sub = 'sub_A', plan = 'pro') => db.query(
    "SELECT public.apply_stripe_subscription_event($1,$2,'cus_A',$3,NULL,$4,'active',250,now(),now()+interval '1 month',false) AS result",
    [event,created,sub,plan]);
  await t.test('unprivileged clients cannot call billing reconciliation', async () => {
    await asUser(U, () => assert.rejects(reconcile('evt_forbidden',1), /permission denied/));
  });
  await t.test('failed entitlement write leaves no processed marker and succeeds on retry', async () => {
    await asService(() => assert.rejects(reconcile('evt_retry',20,'sub_A','invalid_plan'), /check constraint/));
    assert.equal((await db.query("SELECT count(*)::int n FROM stripe_processed_events WHERE id='evt_retry'")).rows[0].n,0);
    assert.equal((await asService(() => reconcile('evt_retry',20))).rows[0].result,'applied');
    assert.equal((await asService(() => reconcile('evt_retry',20))).rows[0].result,'duplicate');
  });
  await t.test('old events and events for a different subscription cannot change current access', async () => {
    assert.equal((await asService(() => reconcile('evt_old',10,'sub_A','starter'))).rows[0].result,'stale');
    assert.equal((await asService(() => reconcile('evt_foreign',30,'sub_OLD','starter'))).rows[0].result,'stale');
    assert.equal((await db.query(`SELECT plan FROM subscriptions WHERE tenant_id='${A}'`)).rows[0].plan,'pro');
  });
  const token = 'a'.repeat(64);
  const sendInvite = (email, inviteToken = token) => db.query(
    "SELECT create_team_invite($1,$2,'rep',$3,now()+interval '7 days') AS invitation", [U,email,inviteToken]);
  const acceptInvite = (user, inviteToken = token) => db.query(
    'SELECT accept_team_invite($1,$2,$3) AS accepted', [user,inviteToken,'New member']);
  await t.test('browser cannot bypass seat checks with direct invite insertion or RPC calls', async () => {
    await asUser(U, () => assert.rejects(db.query('INSERT INTO invites(tenant_id,email,token) VALUES ($1,$2,$3)',[A,'other@example.test',token]), /permission denied/));
    await asUser(U, () => assert.rejects(sendInvite('other@example.test'), /permission denied/));
  });
  await t.test('invite reserves a seat and duplicate recipient is rejected', async () => {
    await asService(() => sendInvite('new@example.test'));
    await asService(() => assert.rejects(sendInvite('NEW@example.test','b'.repeat(64)), /pending invitation/));
  });
  await t.test('wrong recipient cannot consume invitation; intended confirmed user can', async () => {
    await asService(() => assert.rejects(acceptInvite(V), /verified email address/));
    assert.equal((await db.query('SELECT accepted_at FROM invites WHERE token=$1',[token])).rows[0].accepted_at,null);
    assert.equal((await asService(() => acceptInvite(N))).rows[0].accepted.success,true);
    assert.equal((await asService(() => acceptInvite(N))).rows[0].accepted.success,true);
  });
  await t.test('pending invitations consume remaining seats and expired invitations do not', async () => {
    await db.exec(`UPDATE subscriptions SET plan='starter' WHERE tenant_id='${A}';`);
    await asService(() => sendInvite('third@example.test','c'.repeat(64)));
    await asService(() => assert.rejects(sendInvite('fourth@example.test','d'.repeat(64)), /no available team seats/));
    await db.exec(`UPDATE invites SET expires_at=now()-interval '1 day' WHERE token='${'c'.repeat(64)}';`);
    await asService(() => sendInvite('fourth@example.test','d'.repeat(64)));
  });
  await db.close();
});
