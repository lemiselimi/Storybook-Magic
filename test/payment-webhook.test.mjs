import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compiled=ts.transpileModule(fs.readFileSync(new URL('../app/api/webhook/route.js',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const event={type:'checkout.session.completed',data:{object:{id:'session',payment_status:'paid',metadata:{ref:'book',plan:'digital'}}}};
function harness(existing,fail=false){
 const values=new Map([['book:book',{referenceUrl:'photo',coverPrompt:'cover',scenePrompts:['one','two'],story:{pages:[{},{}]},accessToken:'access',previewImages:{cover:'saved-cover',0:'saved-page'}}],['order:session',{status:'fulfilled'}]]);
 if(existing)values.set('result:book',existing);
 let calls=0;
 const kv={get:async k=>structuredClone(values.get(k)),set:async(k,v,o)=>{if(o?.nx&&values.has(k))return null;values.set(k,structuredClone(v));return 'OK';},eval:async(_s,keys,args)=>{if(values.get(keys[0])===args[0])values.delete(keys[0]);}};
 class Stripe {webhooks={constructEvent:()=>event};}
 const out={};
 Function('require','exports','fetch','process',compiled)(n=>n==='stripe'?Stripe:n==='@/lib/kv'?{kv}:{internalAuthorization:()=> 'Bearer internal',internalWebhookUrl:()=> 'https://example.com/callback'},out,async()=>{calls++;return Response.json(fail?{error:'provider unavailable'}:{jobId:'job',model:'nano'});},{env:{STRIPE_WEBHOOK_SECRET:'test',STRIPE_SECRET_KEY:'test'}});
 return {values,calls:()=>calls,post:()=>out.POST(new Request('https://example.com/api/webhook',{method:'POST',body:'signed-test'}))};
}
test('replayed payment preserves ready book and fulfilled order without generating again',async()=>{const saved={sessionId:'session',status:'ready',images:{7:'last'},interiorPdfUrl:'pdf'};const h=harness(saved);assert.equal((await h.post()).status,200);assert.equal(h.calls(),0);assert.deepEqual(h.values.get('result:book'),saved);assert.equal(h.values.get('order:session').status,'fulfilled');});
test('overlapping payment notifications do not submit duplicate images',async()=>{const h=harness();h.values.set('payment-generation:session','other');assert.equal((await h.post()).status,503);assert.equal(h.calls(),0);});
test('submission failure preserves access and completed preview pages for recovery',async()=>{const h=harness(null,true);await h.post();const r=h.values.get('result:book');assert.equal(r.status,'failed');assert.equal(r.sessionId,'session');assert.equal(r.accessToken,'access');assert.equal(r.images[0],'saved-page');assert.equal(r.images.cover,'saved-cover');});
test('successful notification submits only missing scenes and duplicate delivery is harmless',async()=>{const h=harness();await h.post();await h.post();assert.equal(h.calls(),1);assert.equal(h.values.get('job:job').slot,1);assert.equal(h.values.get('result:book').status,'generating');});
