/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS VM harness intentionally loads mocked modules. */
// Offline identity and redirect regression tests. No network or email is allowed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(relative, mocks) {
  const filename = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const fixtureModule={exports:{}};
  vm.runInNewContext(output,{module:fixtureModule,exports:fixtureModule.exports,URL,Date,console:{error(){}},require:id=>mocks[id] ?? (id.startsWith('@/') ? load('src/'+id.slice(2)+'.ts',mocks):require(id))},{filename});
  return fixtureModule.exports;
}
const user = {id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test',email_confirmed_at:'2026-01-01'};
async function signup(options={}) {
  const writes=[];
  let profileReads=0;
  const db={from(table){let mode='select';const q={select(){return q;},eq(){return q;},insert(body){mode='insert';writes.push([table,body]);return q;},delete(){mode='delete';writes.push(['delete',table]);return q;},maybeSingle:async()=>({data:options.existing ? {tenant_id:'existing'} : options.profileRace && profileReads++ ? {tenant_id:'winner'}:null,error:options.readError?{code:'error'}:null}),single:async()=>({data:table==='tenants'?{id:'new-tenant'}:null,error:table==='profiles'&&options.profileRace?{code:'23505'}:null}),then(resolve){return Promise.resolve({error:mode==='insert'&&table==='profiles'&&options.profileRace?{code:'23505'}:null}).then(resolve);}};return q;}};
  const {POST}=load('src/app/api/signup/route.ts',{
    'next/server':{NextResponse:Response},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:options.unauthenticated?null:options.unconfirmed?{...user,email_confirmed_at:null}:user}})}})},
    '@/lib/supabase/admin':{createAdminClient:()=>db},
    '@/lib/rate-limit':{checkRateLimit:async()=>({allowed:true}),getClientIp:()=>'',RATE_LIMITS:{auth:{}}},
    '@/lib/email':{sendWelcomeEmail:async()=>{writes.push(['welcome']);}},
  });
  const response=await POST(new Request('https://example.test/api/signup',{method:'POST',body:options.badJson?'invalid':JSON.stringify({userId:user.id,companyName:'Sample company',fullName:'Owner'})}));
  return {status:response.status,body:await response.json(),writes};
}
(async()=>{
  for(const options of [{unauthenticated:true},{unconfirmed:true}]){const r=await signup(options);assert.equal(r.status,401);assert.equal(r.writes.length,0);}
  let r=await signup({existing:true});assert.equal(r.body.tenant.id,'existing');assert.equal(r.writes.length,0);
  r=await signup({readError:true});assert.equal(r.status,500);assert.equal(r.writes.length,0);
  r=await signup({badJson:true});assert.equal(r.status,400);assert.equal(r.writes.length,0);
  r=await signup();assert.equal(r.status,200);assert.equal(r.writes.find(x=>x[0]==='profiles')[1].id,user.id);
  r=await signup({profileRace:true});assert.equal(r.status,200);assert.equal(r.body.tenant.id,'winner');assert.deepEqual(r.writes.find(x=>x[0]==='delete'),['delete','tenants']);assert.ok(!r.writes.some(x=>x[0]==='welcome'));
  const {GET}=load('src/app/auth/callback/route.ts',{'next/server':{NextResponse:{redirect:url=>url}},'@/lib/supabase/server':{createClient:async()=>({auth:{exchangeCodeForSession:async()=>({error:null})}})}});
  for(const [next,expected] of [['https://evil.test','/onboarding'],['//evil.test','/onboarding'],['/reset-password','/reset-password'],['/invite/'+'a'.repeat(64),'/invite/'+'a'.repeat(64)],['/invite/bad','/onboarding']]){
    const nextUrl=new URL('https://example.test/auth/callback');nextUrl.searchParams.set('code','mock');nextUrl.searchParams.set('next',next);
    const result=await GET({nextUrl,url:nextUrl.toString()});assert.equal(result.origin,'https://example.test');assert.equal(result.pathname,expected);
  }
  console.log('PASS: onboarding identity proof, idempotency, race recovery, malformed input and safe callback redirects');
})().catch(error=>{console.error(error);process.exitCode=1;});
