import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as recovery from '../lib/generation-recovery.js';

const base = () => ({ status: 'generating', sessionId: 'paid-session', accessToken: 'valid-token', createdAt: new Date(Date.now()-900000).toISOString(), story: {pages: Array.from({length:8},()=>({}))}, images: {cover:'cover', ...Object.fromEntries(Array.from({length:7},(_,i)=>[i,'saved-'+i]))} });
test('retry only includes missing last illustration and preserves completed slots',()=>{assert.deepEqual(recovery.missingImageSlots(base()),['7']);assert.equal(recovery.canRetryGeneration(base()),true);});
test('running, complete, unpaid and exhausted books cannot retry',()=>{for(const edit of [{createdAt:new Date().toISOString()},{status:'ready'},{status:'pdf_generating'},{sessionId:null},{generationRetries:2}]) assert.equal(recovery.canRetryGeneration({...base(),...edit}),false);});
test('outfit consistency changes only contradictory swimsuit wording',()=>{assert.equal(recovery.consistentSceneOutfit('A full-body wetsuit. The child in a swimsuit holds a shell.'),'A full-body wetsuit. The child in a long-sleeved full-length diving wetsuit holds a shell.'); assert.equal(recovery.consistentSceneOutfit('A child in a yellow coat.'),'A child in a yellow coat.');});

const compiled = ts.transpileModule(fs.readFileSync(new URL('../app/api/retry-generation/route.js',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
function harness(){
 const values = new Map([['result:book',base()],['book:book',{referenceUrl:'reference',coverPrompt:'cover',scenePrompts:Array(8).fill('scene'),seed:7}]]);
 const submitted=[];
 const kv={get:async key=>structuredClone(values.get(key)), set:async(key,value,options)=>{if(options?.nx&&values.has(key))return null;values.set(key,structuredClone(value));return 'OK';},eval:async(_script,keys,args)=>{if(values.get(keys[0])===args[0])values.delete(keys[0]);}};
 const out={};
 Function('require','exports','fetch',compiled)(name=>name==='stripe'?class {}:name==='@/lib/kv'?{kv}:name==='@/lib/security'?{hasAccessToken:(a,b)=>!!a&&a===b,internalAuthorization:()=> 'Bearer internal'}:recovery,out,async(url,options)=>{submitted.push(JSON.parse(options.body));return Response.json({jobId:'retried-job',model:'nano'});});
 return {values,submitted,post:body=>out.POST(new Request('https://example.com/api/retry-generation',{method:'POST',body:JSON.stringify(body)}))};
}
test('unauthorized retry never submits images',async()=>{const h=harness();assert.equal((await h.post({ref:'book',accessToken:'wrong'})).status,403);assert.equal(h.submitted.length,0);});
test('authorized recovery keeps seven images, submits only eighth and blocks immediate repeat',async()=>{const h=harness();assert.equal((await h.post({ref:'book',accessToken:'valid-token'})).status,200);assert.equal(h.submitted.length,1);assert.deepEqual(h.values.get('result:book').images,base().images);assert.equal(h.values.get('job:retried-job').slot,'7');assert.equal((await h.post({ref:'book',accessToken:'valid-token'})).status,409);assert.equal(h.submitted.length,1);});
test('overlapping retry is rejected without a duplicate provider job',async()=>{const h=harness();h.values.set('generation-retry:book','other-owner');assert.equal((await h.post({ref:'book',accessToken:'valid-token'})).status,409);assert.equal(h.submitted.length,0);assert.equal(h.values.get('generation-retry:book'),'other-owner');});
