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
    CREATE SCHEMA storage;
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
      $$ SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
    GRANT USAGE ON SCHEMA storage TO authenticated, service_role;
    GRANT ALL ON storage.objects TO authenticated, service_role;
    CREATE POLICY "Tenant members can view their logos" ON storage.objects FOR SELECT TO authenticated USING
      (bucket_id='logos' AND (storage.foldername(name))[1]=current_setting('request.jwt.claim.tenant',true));
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
    UPDATE subscriptions SET visualization_limit = 1, plan='pro', current_period_start=date_trunc('month',now()), current_period_end=date_trunc('month',now())+interval '1 month';
  `);
  await db.exec(await migration('019_unified_product_categories.sql'));
  await db.exec(await migration('020_security_boundaries.sql'));
  await db.exec(await migration('021_review_hardening.sql'));

  async function asUser(user, operation) {
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.role='authenticated'; SET request.jwt.claim.sub='${user}'; SET request.jwt.claim.tenant='${user===V ? B : A}';`);
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
    await asUser(U, () => assert.rejects(db.query('INSERT INTO shared_links(tenant_id,created_by,visualization_id,expires_at) VALUES ($1,$2,$3,now()+make_interval(days=>7))', [A,U,otherJob]), /row-level security/));
    share = (await asUser(U, () => db.query('INSERT INTO shared_links(tenant_id,created_by,visualization_id,expires_at) VALUES ($1,$2,$3,now()+make_interval(days=>7)) RETURNING id', [A,U,ownJob]))).rows[0].id;
    await asUser(U, () => assert.rejects(db.query('UPDATE shared_links SET visualization_id=$1 WHERE id=$2', [otherJob,share]), /row-level security/));
  });
  await t.test('failed billing denies generation even when quota is available', async () => {
    await db.exec(`UPDATE subscriptions SET status='past_due', visualization_limit=100 WHERE tenant_id='${A}';`);
    await asUser(U, () => assert.rejects(job(A,U,PA), /active subscription is required/));
  });

  await db.exec(`UPDATE subscriptions SET stripe_customer_id='cus_A', stripe_subscription_id='sub_A' WHERE tenant_id='${A}';`);
  const reconcile = async (event, created, sub = 'sub_A', plan = 'pro') => {
    const lease=(await db.query("SELECT acquire_stripe_sync('cus_A') token")).rows[0].token;
    try {
      return await db.query(
        "SELECT public.apply_stripe_subscription_event($1,$2,'cus_A',$3,NULL,$4,'active',250,now(),now()+interval '1 month',false,$5) AS result",
        [event,created,sub,plan,lease]);
    } finally {
      await db.query("SELECT release_stripe_sync('cus_A',$1)",[lease]);
    }
  };
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
    "SELECT create_team_invite($1,$2,'rep',$3,now()+make_interval(days=>7)) AS invitation", [U,email,inviteToken]);
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

  await t.test('direct shares require paid current access and bounded nonnull expiry, but revocation remains possible', async () => {
    const insert=(expiry)=>db.query('INSERT INTO shared_links(tenant_id,created_by,visualization_id,expires_at) VALUES ($1,$2,$3,$4)',[A,U,ownJob,expiry]);
    await db.exec(`UPDATE subscriptions SET plan='pro',status='active' WHERE tenant_id='${A}';`);
    for(const expiry of [null,new Date(Date.now()+31*86400000).toISOString()]) {
      await asUser(U,()=>assert.rejects(insert(expiry),/row-level security/));
    }
    await db.exec(`UPDATE subscriptions SET plan='free' WHERE tenant_id='${A}';`);
    await asUser(U,()=>assert.rejects(insert(new Date(Date.now()+86400000).toISOString()),/row-level security/));
    await asUser(U,()=>db.query('UPDATE shared_links SET is_active=false WHERE id=$1',[share]));
    await asUser(U,()=>assert.rejects(db.query('UPDATE shared_links SET is_active=true WHERE id=$1',[share]),/row-level security/));
  });
  await t.test('demo users must satisfy pooled tenant quota as well as their lifetime quota', async () => {
    await db.exec(`UPDATE profiles SET role='demo' WHERE id='${V}'; UPDATE subscriptions SET visualization_limit=1 WHERE tenant_id='${B}';`);
    await asUser(V,()=>assert.rejects(job(B,V,PB),/Visualization limit reached/));
    await db.exec(`UPDATE subscriptions SET visualization_limit=100 WHERE tenant_id='${B}';`);
    for(let i=0;i<4;i++) await asUser(V,()=>job(B,V,PB));
    await asUser(V,()=>assert.rejects(job(B,V,PB),/Demo visualization limit reached/));
  });
  await t.test('swatch uploads require own tenant and admin role; logo replacement is also tenant scoped', async () => {
    const insert=(bucket,name)=>db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2) RETURNING id',[bucket,name]);
    await asUser(U,()=>insert('product-swatches',`${A}/custom/sample.png`));
    await asUser(U,()=>assert.rejects(insert('product-swatches',`${B}/custom/sample.png`),/row-level security/));
    await asUser(N,()=>assert.rejects(insert('product-swatches',`${A}/custom/rep.png`),/row-level security/));
    const logo=(await asUser(U,()=>insert('logos',`${A}/logo.png`))).rows[0].id;
    await asUser(U,()=>db.query('UPDATE storage.objects SET name=$1 WHERE id=$2',[`${A}/logo-new.png`,logo]));
    await asUser(U,()=>assert.rejects(db.query('UPDATE storage.objects SET name=$1 WHERE id=$2',[`${B}/logo-new.png`,logo]),/row-level security/));
  });
  await t.test('old webhook apply RPC is inaccessible and only one current-snapshot lease is granted', async () => {
    await asService(()=>assert.rejects(db.query("SELECT apply_stripe_subscription_event('evt_old_api',100,'cus_A','sub_A',NULL,'pro','active',250,now(),now()+interval '1 month',false)"),/permission denied/));
    const lease=(await asService(()=>db.query("SELECT acquire_stripe_sync('cus_A') token"))).rows[0].token;
    assert.ok(lease);
    assert.equal((await asService(()=>db.query("SELECT acquire_stripe_sync('cus_A') token"))).rows[0].token,null);
    await asService(()=>db.query("SELECT release_stripe_sync('cus_A',$1)",[lease]));
  });
  await t.test('expired worker cannot overwrite a newer canceled snapshot even with identical event seconds', async () => {
    const oldLease=(await asService(()=>db.query("SELECT acquire_stripe_sync('cus_A') token"))).rows[0].token;
    await db.exec(`UPDATE subscriptions SET billing_sync_until=now()-interval '1 second' WHERE tenant_id='${A}';`);
    const newLease=(await asService(()=>db.query("SELECT acquire_stripe_sync('cus_A') token"))).rows[0].token;
    await asService(()=>db.query("SELECT apply_stripe_subscription_event('evt_canceled_100',100,'cus_A','sub_A',NULL,'free','canceled',5,NULL,NULL,true,$1)",[newLease]));
    await asService(()=>assert.rejects(db.query("SELECT apply_stripe_subscription_event('evt_late_active_100',100,'cus_A','sub_A',NULL,'pro','active',250,now(),now()+interval '1 month',false,$1)",[oldLease]),/lease expired/));
    assert.equal((await db.query(`SELECT plan FROM subscriptions WHERE tenant_id='${A}'`)).rows[0].plan,'free');
    assert.equal((await db.query("SELECT count(*)::int n FROM stripe_processed_events WHERE id='evt_late_active_100'")).rows[0].n,0);
  });

  await db.exec(await migration('008_pay_per_use.sql'));
  await db.exec(await migration('023_metering_outbox.sql'));
  await db.exec(`UPDATE subscriptions SET plan='pay_per_use',status='active',visualization_limit=-1,
    stripe_customer_id='cus_A',stripe_subscription_id='sub_A',current_period_start=now(),current_period_end=now()+interval '1 month' WHERE tenant_id='${A}';`);
  let billedJob;
  await t.test('metered generation requires an actual recent protected-worker heartbeat',async()=>{
    assert.equal((await asService(()=>db.query('SELECT metering_scheduler_is_healthy() healthy'))).rows[0].healthy,false);
    await asUser(U,()=>assert.rejects(job(A,U,PA),/scheduler is unavailable/));
    await asService(()=>db.query('SELECT record_metering_worker_run()'));
    assert.equal((await asService(()=>db.query('SELECT metering_scheduler_is_healthy() healthy'))).rows[0].healthy,true);
  });
  await t.test('metered billing snapshot is server-owned and survives a plan change during generation',async()=>{
    billedJob=(await asUser(U,()=>job(A,U,PA))).rows[0].id;
    const snapshot=(await db.query('SELECT billing_plan,billing_customer_id FROM visualizations WHERE id=$1',[billedJob])).rows[0];
    assert.equal(snapshot.billing_plan,'pay_per_use');assert.equal(snapshot.billing_customer_id,'cus_A');
    await db.exec(`UPDATE subscriptions SET plan='pro' WHERE tenant_id='${A}';`);
  });
  await t.test('outbox enqueue failure rolls completion and usage back atomically',async()=>{
    await db.exec(`CREATE FUNCTION reject_metering_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture enqueue failure'; END $$;
      CREATE TRIGGER reject_metering_fixture BEFORE INSERT ON metering_outbox FOR EACH ROW EXECUTE FUNCTION reject_metering_fixture();`);
    await asService(()=>assert.rejects(db.query("UPDATE visualizations SET status='completed' WHERE id=$1",[billedJob]),/fixture enqueue failure/));
    assert.equal((await db.query('SELECT status FROM visualizations WHERE id=$1',[billedJob])).rows[0].status,'processing');
    assert.equal((await db.query('SELECT count(*)::int n FROM usage_records WHERE visualization_id=$1',[billedJob])).rows[0].n,0);
    await db.exec('DROP TRIGGER reject_metering_fixture ON metering_outbox; DROP FUNCTION reject_metering_fixture();');
  });
  await t.test('completion creates exactly one usage record and durable event, including repeated updates',async()=>{
    await asService(()=>db.query("UPDATE visualizations SET status='completed' WHERE id=$1",[billedJob]));
    await asService(()=>db.query("UPDATE visualizations SET status='completed' WHERE id=$1",[billedJob]));
    assert.equal((await db.query('SELECT count(*)::int n FROM usage_records WHERE visualization_id=$1',[billedJob])).rows[0].n,1);
    assert.equal((await db.query('SELECT count(*)::int n FROM metering_outbox WHERE visualization_id=$1',[billedJob])).rows[0].n,1);
    await asUser(U,()=>assert.rejects(db.query('SELECT * FROM metering_outbox'),/permission denied/));
  });
  await t.test('outbox claims exclude competitors, failed sends retry, and stale workers cannot acknowledge',async()=>{
    const first=(await asService(()=>db.query('SELECT claim_metering_event($1) job',[billedJob]))).rows[0].job;
    assert.ok(first.lease_token);assert.equal(first.attempts,1);
    assert.equal((await asService(()=>db.query('SELECT claim_metering_event($1) job',[billedJob]))).rows[0].job,null);
    await asService(()=>db.query('SELECT finish_metering_event($1,$2,false,$3)',[billedJob,first.lease_token,'network timeout']));
    assert.equal((await asService(()=>db.query('SELECT claim_metering_event($1) job',[billedJob]))).rows[0].job,null);
    await db.query("UPDATE metering_outbox SET next_attempt_at=now()-interval '1 second' WHERE visualization_id=$1",[billedJob]);
    const second=(await asService(()=>db.query('SELECT claim_metering_event($1) job',[billedJob]))).rows[0].job;
    assert.equal(second.attempts,2);assert.notEqual(first.lease_token,second.lease_token);
    assert.equal((await asService(()=>db.query('SELECT finish_metering_event($1,$2,true,NULL) ok',[billedJob,first.lease_token]))).rows[0].ok,false);
    assert.equal((await asService(()=>db.query('SELECT finish_metering_event($1,$2,true,NULL) ok',[billedJob,second.lease_token]))).rows[0].ok,true);
    assert.equal((await asService(()=>db.query('SELECT claim_metering_event($1) job',[billedJob]))).rows[0].job,null);
  });
  await t.test('ambiguous attempts beyond deduplication window stop automatic sends and block more metered generation',async()=>{
    await db.exec(`UPDATE subscriptions SET plan='pay_per_use' WHERE tenant_id='${A}';`);
    const id=(await asUser(U,()=>job(A,U,PA))).rows[0].id;
    await asService(()=>db.query("UPDATE visualizations SET status='completed' WHERE id=$1",[id]));
    await db.query("UPDATE metering_outbox SET attempts=1,first_attempt_at=now()-interval '24 hours' WHERE visualization_id=$1",[id]);
    assert.equal((await asService(()=>db.query('SELECT claim_metering_event($1) job',[id]))).rows[0].job,null);
    assert.equal((await db.query('SELECT status FROM metering_outbox WHERE visualization_id=$1',[id])).rows[0].status,'review');
    assert.equal((await asService(()=>db.query('SELECT metering_is_healthy($1) healthy',[A]))).rows[0].healthy,false);
    await asUser(U,()=>assert.rejects(job(A,U,PA),/requires reconciliation/));
  });
  await db.close();
});
