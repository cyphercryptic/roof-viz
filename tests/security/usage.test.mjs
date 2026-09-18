import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../../src/lib/usage.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(counts,{subscriptionError=false,countError=false,meteringDisabled=false,plan='pro',meteringHealthy=true}={}) {
  const context={exports:{},process:{env:{}},console,require(name){
    if(name==='@/lib/stripe')return{stripe:{}};
    if(name==='@/lib/metering')return{isMeteringConfigured:()=>!meteringDisabled,deliverMeteringEvent:async()=> 'idle'};
    if(name==='@/lib/site')return{SUPPORT_EMAIL:'test@example.test'};
    if(name==='@/lib/security-policy')return{hasGenerationAccess:()=>true};
    throw Error(name);
  }};
  vm.runInNewContext(code,context);
  let reads=0;
  const client={rpc:async()=>({data:meteringHealthy,error:null}),from(table){
    const query={select(){return query;},eq(){return query;},gte(){return query;},lt(){return query;},or(){return query;},
      single:async()=>({data:{plan,status:'active',visualization_limit:5,current_period_start:null,current_period_end:null},error:subscriptionError?{}:null}),
      then(resolve,reject){reads++;return Promise.resolve({count:counts.shift()??0,error:countError?{}:null}).then(resolve,reject);},
    };
    assert.ok(['subscriptions','visualizations'].includes(table)); return query;
  }};
  return{run:()=>context.exports.checkUsage(client,'tenant-a',{role:'demo',userId:'demo-a'}),reads:()=>reads};
}
test('demo preflight denies exhausted tenant before checking personal allowance',async()=>{
  const f=fixture([5,0]);const result=await f.run();assert.equal(result.allowed,false);assert.match(result.message,/team/);assert.equal(f.reads(),1);
});
test('demo lifetime cap still applies when team has capacity',async()=>{
  const f=fixture([2,5]);const result=await f.run();assert.equal(result.allowed,false);assert.equal(result.plan,'demo');
});
test('demo needs both team and personal capacity',async()=>{
  const f=fixture([2,1]);assert.equal((await f.run()).allowed,true);assert.equal(f.reads(),2);
});
test('subscription and quota read errors fail closed',async()=>{
  await assert.rejects(fixture([],{subscriptionError:true}).run(),/verify/);
  await assert.rejects(fixture([],{countError:true}).run(),/verify/);
});
test('metered generation denies missing worker configuration and unhealthy durable queue',async()=>{
  assert.equal((await fixture([],{plan:'pay_per_use',meteringDisabled:true}).run()).allowed,false);
  assert.equal((await fixture([],{plan:'pay_per_use',meteringHealthy:false}).run()).allowed,false);
});
