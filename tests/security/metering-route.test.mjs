import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../../src/app/api/visualize/route.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function run({enqueueFailure=false,dispatchFailure=false}={}){
  let status='processing';let usageCalls=0;const failureFilters=[];
  const db={auth:{getUser:async()=>({data:{user:{id:'user'}}})},from(table){
    let patch=null;const filters=[];
    const q={select(){return q;},insert(){return q;},update(value){patch=value;return q;},eq(k,v){filters.push([k,v]);return q;},
      single:async()=>({data:table==='profiles'?{tenant_id:'tenant',role:'owner'}:table==='products'?{id:'product',category:'roofing',color:'Black',brand:'Sample'}:{id:'viz'}}),
      then(resolve,reject){
        if(patch?.status==='completed'&&enqueueFailure)return Promise.resolve({error:{message:'outbox insert failed'}}).then(resolve,reject);
        if(patch){
          if(patch.status==='failed')failureFilters.push(...filters);
          if(filters.every(([k,v])=>k!=='status'||status===v))status=patch.status;
        }
        return Promise.resolve({error:null}).then(resolve,reject);
      },
    };return q;
  },storage:{from:()=>({download:async()=>({data:new Blob(['image'])}),upload:async()=>({error:null}),createSignedUrl:async()=>({data:{signedUrl:'https://example.test/image'}})})}};
  const modules={
    'next/server':{NextResponse:Response},
    '@/lib/supabase/server':{createClient:async()=>db},'@/lib/supabase/admin':{createAdminClient:()=>db},
    '@sentry/nextjs':{captureException(){}},
    '@/lib/gemini':{ContentRefusedError:class extends Error{},fetchProductReference:async()=>null,generateProductVisualization:async()=>Buffer.from('result')},
    '@/lib/prompts':{buildPrompt:()=>''},'@/lib/master-products':{MASTER_PRODUCTS:[]},'@/types':{normalizeProduct:p=>p},
    '@/lib/security-policy':{isTenantMediaPath:()=>true},'@/lib/product-images':{getProductImageUrl:()=>null,extractProductLine:()=>''},
    '@/lib/usage':{checkUsage:async()=>({allowed:true}),recordUsage:async()=>{usageCalls++;if(dispatchFailure)throw Error('unexpected dispatch fault');}},
    '@/lib/rate-limit':{checkRateLimit:async()=>({allowed:true}),RATE_LIMITS:{visualize:{}}},
    '@/lib/validation':{visualizeSchema:{},parseBody:()=>({success:true,data:{productId:'product',originalImagePath:'tenant/photo.png',perspective:'exterior'}})},
  };
  const context={exports:{},Buffer,Date,console,require:name=>{if(!(name in modules))throw Error(name);return modules[name];}};
  vm.runInNewContext(code,context);
  const response=await context.exports.POST(new Request('https://example.test/api/visualize',{method:'POST',body:'{}'}));
  return{response,status,usageCalls,failureFilters};
}
test('completion enqueue failure never returns successful unbilled result or dispatches usage',async()=>{
  const result=await run({enqueueFailure:true});assert.equal(result.response.status,500);assert.equal(result.usageCalls,0);
});
test('unexpected post-completion dispatch error cannot downgrade completed job and refund allowance',async()=>{
  const result=await run({dispatchFailure:true});assert.equal(result.status,'completed');
  assert.ok(result.failureFilters.some(([k,v])=>k==='status'&&v==='processing'));
});
