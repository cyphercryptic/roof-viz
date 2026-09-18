import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
const compile=async(path)=>ts.transpileModule(await readFile(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const code=await compile('../../src/lib/metering.ts');
const workerCode=await compile('../../src/app/api/internal/billing/meter/route.ts');
function fixture({sendError=false,claimError=false,ackError=false,configured=true,enabled=true}={}){
  const sends=[];const rpcs=[];
  const job={visualization_id:'viz-a',stripe_customer_id:'cus-a',event_timestamp:1789000000,lease_token:'lease-a'};
  const env=configured?{PAYG_METERING_ENABLED:enabled?'true':'false',PAYG_RETRY_SCHEDULE_CONFIRMED:enabled?'true':'false',CRON_SECRET:'fixture-secret',STRIPE_SECRET_KEY:'fixture-key',STRIPE_PRICE_PAY_PER_USE:'price-test'}:{};
  const context={exports:{},process:{env},console,require(name){if(name==='@/lib/stripe')return{stripe:{billing:{meterEvents:{create:async(...args)=>{sends.push(args);if(sendError)throw Error('network timeout');}}}}};throw Error(name);}};
  vm.runInNewContext(code,context);
  const db={rpc:async(name,args)=>{
    rpcs.push({name,args});
    if(name==='claim_metering_event')return{data:job,error:claimError?{}:null};
    return{data:!ackError,error:ackError?{}:null};
  }};
  return{run:()=>context.exports.deliverMeteringEvent(db,'viz-a'),configured:()=>context.exports.isMeteringConfigured(),workerConfigured:()=>context.exports.isMeteringWorkerConfigured(),sends,rpcs};
}
test('PAYG is opt-in and requires worker plus Stripe configuration',()=>{
  assert.equal(fixture({configured:false}).configured(),false);assert.equal(fixture().configured(),true);
});
test('disabling new PAYG preserves configured worker delivery for existing backlog',async()=>{
  const f=fixture({enabled:false});assert.equal(f.configured(),false);assert.equal(f.workerConfigured(),true);
  assert.equal(await f.run(),'sent');
});
test('delivery has stable identifier, original timestamp, bounded timeout and idempotency key',async()=>{
  const a=fixture();const b=fixture();assert.equal(await a.run(),'sent');await b.run();
  assert.equal(a.sends[0][0].identifier,'viz-a');assert.equal(a.sends[0][0].timestamp,1789000000);
  assert.equal(a.sends[0][1].idempotencyKey,b.sends[0][1].idempotencyKey);
  assert.equal(a.sends[0][1].timeout,10000);assert.equal(a.sends[0][1].maxNetworkRetries,0);
  assert.equal(a.rpcs[1].args.p_lease_token,'lease-a');assert.equal(a.rpcs[1].args.p_success,true);
});
test('network failure records retry against the claimed lease',async()=>{
  const f=fixture({sendError:true});assert.equal(await f.run(),'retry');assert.equal(f.rpcs[1].args.p_success,false);
});
test('claim failure sends nothing and accepted-but-unacknowledged send is not falsely marked failed',async()=>{
  const a=fixture({claimError:true});await assert.rejects(a.run(),/claim/);assert.equal(a.sends.length,0);
  const b=fixture({ackError:true});await assert.rejects(b.run(),/confirm/);
  assert.equal(b.rpcs.length,2);assert.equal(b.rpcs[1].args.p_success,true);
});
function worker({configured=true,auth='Bearer fixture-secret',outcome='idle'}={}){
  let dbCalls=0;let deliveries=0;
  const context={exports:{},Buffer,Date,process:{env:{CRON_SECRET:configured?'fixture-secret':''}},console:{error(){}},require(name){
    if(name==='node:crypto')return crypto;
    if(name==='next/server')return{NextResponse:Response};
    if(name==='@/lib/metering')return{isMeteringWorkerConfigured:()=>configured,deliverMeteringEvent:async()=>{deliveries++;return outcome;}};
    if(name==='@/lib/supabase/admin')return{createAdminClient:()=>{dbCalls++;return{rpc:async()=>({error:null}),from:()=>({select:()=>({eq:async()=>({count:0,error:null})})})};}};
    throw Error(name);
  }};
  vm.runInNewContext(workerCode,context);
  return{run:()=>context.exports.GET(new Request('https://example.test/api/internal/billing/meter',{headers:{authorization:auth}})),dbCalls:()=>dbCalls,deliveries:()=>deliveries};
}
test('worker rejects absent configuration and invalid credentials before database access',async()=>{
  const a=worker({configured:false});assert.equal((await a.run()).status,503);assert.equal(a.dbCalls(),0);
  const b=worker({auth:'Bearer wrong'});assert.equal((await b.run()).status,401);assert.equal(b.dbCalls(),0);
});
test('worker stops at empty queue or bounded 25-event batch',async()=>{
  const a=worker();assert.equal((await a.run()).status,200);assert.equal(a.deliveries(),1);
  const b=worker({outcome:'sent'});assert.equal((await b.run()).status,200);assert.equal(b.deliveries(),25);
});
