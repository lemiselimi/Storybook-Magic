import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
import { orderHealth, emailLabel } from '../lib/order-health.js';
import * as recovery from '../lib/generation-recovery.js';

const now = Date.now();
const old = new Date(now - 20 * 60_000).toISOString();
test('paid orders with missing generation are flagged after grace period', () => {
  assert.equal(orderHealth({paidAt: old}, null, null, now).needsAttention, true);
  assert.equal(orderHealth({paidAt: new Date(now).toISOString()}, null, null, now).needsAttention, false);
});
test('failed and stalled PDFs are visible even when no image is missing', () => {
  assert.equal(orderHealth({}, {status:'failed', createdAt:old, images:{cover:'saved'}}, null, now).needsAttention, true);
  assert.equal(orderHealth({}, {status:'pdf_generating', createdAt:old}, null, now).needsAttention, true);
  assert.equal(orderHealth({}, {status:'ready'}, null, now).needsAttention, true);
});
test('normal approval hold is distinct from failure and shipment', () => {
  const ready={status:'ready', plan:'print', interiorPdfUrl:'pdf', printApproval:'pending', printReadyAt:new Date(now).toISOString()};
  assert.equal(orderHealth({},ready,null,now).needsAttention,false);
  assert.equal(orderHealth({},ready,null,now).stage,'Waiting for print approval');
  assert.equal(orderHealth({status:'fulfilled'},ready,{at:old},now).stage,'Submitted to printer');
  assert.equal(orderHealth({}, {...ready,printApproval:'requires_attention'},null,now).needsAttention,true);
  assert.equal(orderHealth({}, ready,{at:old},now).needsAttention,true);
});
test('provider acceptance never claims delivery or reading',()=>{
  assert.equal(emailLabel('email.sent'),'Accepted by email provider');
  assert.equal(emailLabel('email.delivered'),'Delivered to receiving mail server');
  assert.equal(emailLabel('unknown'),'Delivery not yet confirmed');
});

function load(file, modules, env={}) {
  const compiled=ts.transpileModule(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const out={};
  Function('require','exports','process',compiled)(name=>{if(!(name in modules))throw new Error(`Unexpected module ${name}`);return modules[name];},out,{env});
  return out;
}
function store(initial=[]) {
  const values=new Map(initial), sorted=new Map();
  return {values, get:async k=>structuredClone(values.get(k)), set:async(k,v,o)=>{if(o?.nx&&values.has(k))return null;values.set(k,structuredClone(v));return 'OK';},
    del:async k=>values.delete(k), scan:async()=>[0,[...values.keys()].filter(k=>k.startsWith('order:'))],
    zadd:async(k,{score,member})=>{if(!sorted.has(k))sorted.set(k,new Map());sorted.get(k).set(member,score);},
    zrem:async(k,m)=>sorted.get(k)?.delete(m), zremrangebyscore:async()=>{},
    zrange:async k=>[...(sorted.get(k)||new Map()).keys()],
    eval:async(_s,keys,args)=>{if(values.get(keys[0])===args[0])values.delete(keys[0]);},
  };
}
test('admin and cron authentication fail closed and use separate secrets',()=>{
  const auth=load('lib/watchdog-auth.js',{'node:crypto':crypto},{WATCHDOG_ADMIN_KEY:'a'.repeat(40),CRON_SECRET:'cron'});
  const req=value=>new Request('https://site.test',{headers:{Authorization:`Bearer ${value}`}});
  assert.equal(auth.isWatchdogAdmin(req('a'.repeat(40))),true);
  assert.equal(auth.isWatchdogAdmin(req('cron')),false);
  assert.equal(auth.isWatchdogCron(req('cron')),true);
  assert.equal(auth.isWatchdogCron(req('a'.repeat(40))),false);
  const missing=load('lib/watchdog-auth.js',{'node:crypto':crypto},{});
  assert.equal(missing.isWatchdogAdmin(req('undefined')),false);
  assert.equal(missing.isWatchdogCron(req('undefined')),false);
});
test('order endpoint rejects unauthorized reads and actions before accessing providers',async()=>{
  const route=load('app/api/operations/route.js',{
    '@/lib/watchdog-auth':{isWatchdogAdmin:()=>false,privateHeaders:{'Cache-Control':'no-store'}},
    '@/lib/order-watchdog':{}, '@/app/api/retry-generation/route':{}, '@/lib/kv':{},
  });
  assert.equal((await route.GET(new Request('https://site.test'))).status,401);
  assert.equal((await route.POST(new Request('https://site.test',{method:'POST',body:'{}'}))).status,401);
});

function monitor(kv,{sessions=[],sendError=false,alerts=true,stripeFailure=false}={}){
  let sends=0;
  class Stripe {checkout={sessions:{list:async()=>{if(stripeFailure)throw new Error('Stripe down');return {data:sessions,has_more:false};}}};}
  class Resend {emails={send:async()=>{sends++;return sendError?{error:{message:'failed'}}:{data:{id:'alert'}};}};}
  const api=load('lib/order-watchdog.js',{'node:crypto':crypto,stripe:Stripe,resend:{Resend},'@/lib/kv':{kv},'@/lib/generation-recovery':recovery,'@/lib/order-health':{orderHealth,EMAIL_PROBLEMS:new Set(['email.bounced']),emailLabel}},
    {STRIPE_SECRET_KEY:'test',...(alerts?{RESEND_API_KEY:'test',WATCHDOG_ALERT_EMAIL:'owner@example.test'}:{})});
  return {...api,sends:()=>sends};
}
test('reconciliation finds paid orders missing locally, and repeated checks do not spam alerts',async()=>{
  const kv=store();
  const api=monitor(kv,{sessions:[{id:'paid',payment_status:'paid',created:Math.floor(now/1000)-1200,metadata:{ref:'lost',plan:'digital'}},{id:'unpaid',payment_status:'unpaid',metadata:{ref:'ignore'}}]});
  await api.runWatchdog();await api.runWatchdog();
  const result=await api.watchdogSnapshot();
  assert.equal(result.orders.length,1);assert.equal(result.orders[0].ref,'lost');assert.equal(result.orders[0].needsAttention,true);
  assert.equal(result.orders[0].sessionId,undefined);assert.equal(api.sends(),1);
  assert.equal(kv.values.get('order:paid'),undefined); // monitor never rewrites payment records
});
test('monitor preserves completed artwork, exposes no access token, and does not auto-retry',async()=>{
  const saved={status:'failed',sessionId:'paid',accessToken:'private',createdAt:old,images:{cover:'photo'},story:{pages:[{},{}]}};
  const kv=store([['order:paid',{ref:'book',plan:'digital',paidAt:old}],['result:book',saved],['book:book',{referenceUrl:'private-photo'}]]);
  const api=monitor(kv,{alerts:false});await api.runWatchdog();
  assert.deepEqual(kv.values.get('result:book'),saved);
  const snapshot=await api.watchdogSnapshot();
  assert.equal(snapshot.orders[0].canRetry,true);assert.equal(JSON.stringify(snapshot).includes('private'),false);
  assert.equal(api.sends(),0);
});
test('overlapping monitor execution returns busy without acquiring another run',async()=>{
  const kv=store([['watchdog:run-lock','another']]);const api=monitor(kv);
  assert.deepEqual(await api.runWatchdog(),{busy:true});assert.equal(kv.values.get('watchdog:run-lock'),'another');
});
test('failed checks record a failed heartbeat and release the lock',async()=>{
  const kv=store();const api=monitor(kv,{stripeFailure:true});
  await assert.rejects(api.runWatchdog());assert.equal(kv.values.get('watchdog:last-run').ok,false);assert.equal(kv.values.has('watchdog:run-lock'),false);
});
test('alert rejection is visible and remains eligible on the next run',async()=>{
  const kv=store([['order:paid',{ref:'book',paidAt:old}]]);const api=monitor(kv,{sendError:true});
  await api.runWatchdog();await api.runWatchdog();assert.equal(api.sends(),2);assert.equal(kv.values.get('watchdog:last-run').alert,'failed');
});
test('email SDK error is recorded and not reported as successful',async()=>{
  const kv=store();class Resend {emails={send:async()=>({error:{message:'bad'}})};}
  const api=load('lib/tracked-email.js',{resend:{Resend},'@/lib/kv':{kv}},{RESEND_API_KEY:'test'});
  await assert.rejects(api.sendTrackedEmail({to:'nobody@example.test'},'Preview link'));
  assert.equal([...kv.values.values()][0].sendFailed,true);
});
test('accepted email is not reported as failed when tracking storage is unavailable',async()=>{
  const kv={set:async()=>{throw new Error('Storage down');},zadd:async()=>{throw new Error('Storage down');}};
  class Resend {emails={send:async()=>({data:{id:'accepted'}})};}
  const api=load('lib/tracked-email.js',{resend:{Resend},'@/lib/kv':{kv}},{RESEND_API_KEY:'test'});
  assert.deepEqual(await api.sendTrackedEmail({},'Preview link'),{id:'accepted'});
});
test('forged email events are rejected without modifying tracking records',async()=>{
  class Resend {webhooks={verify:()=>{throw new Error('Invalid signature');}};}
  const route=load('app/api/resend-webhook/route.js',{resend:{Resend},'@/lib/kv':{kv:{}}},{RESEND_API_KEY:'test',RESEND_WEBHOOK_SECRET:'test'});
  assert.equal((await route.POST(new Request('https://site.test',{method:'POST',body:'{}'}))).status,400);
});
