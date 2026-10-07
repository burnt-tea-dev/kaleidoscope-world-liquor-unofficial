import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';

const evidence=JSON.parse(fs.readFileSync(new URL('../data/native-accepted-hurt-correlation-20261008.json',import.meta.url)));
test('observed trace binds the exact adapter and states its limited native scope',()=>{
 const bytes=fs.readFileSync(new URL('../runtime/BP/scripts/accepted-hurt-feedback.js',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),evidence.adapter_sha256);
 assert.equal(evidence.real_players,0);assert.equal(evidence.simulated_players,false);
 assert.equal(evidence.client,false);assert.equal(evidence.runtime_changed,false);assert.equal(evidence.full_java_parity_verified,false);
 const text=JSON.stringify(evidence);for(const forbidden of ['/root/','/var/lib/','engine_inputs','source_inputs','bedrock_server'])assert.equal(text.includes(forbidden),false);
});

for(const run of evidence.runs)for(const scene of run.scenes)test('actual Native callback sequence: '+scene.name,()=>{
 const tasks=[],delivered=[],adapter=new AcceptedHurtFeedback({run:fn=>tasks.push(fn)});
 // Native creates distinct before/after objects and unstable damageSource wrappers.
 const source=()=>({cause:scene.cause,damagingEntity:{id:'actor'}});
 for(const row of scene.events){
  if(row.kind==='before'){
   assert.equal(row.sourceStable,false);
   const event={hurtEntity:{id:'target'},damage:row.damage,cancel:false,get damageSource(){return source();}};
   adapter.queue(event,accepted=>delivered.push({call:row.call,accepted}));
  }else if(row.kind==='after'){
   assert.ok(row.sameEvent.every(value=>value===false));assert.ok(row.sameSource.every(value=>value===false));
   adapter.applied({hurtEntity:{id:'target'},damage:row.damage,damageSource:source()});
  }
 }
 tasks.forEach(fn=>fn());assert.deepEqual(delivered,scene.callbacks);assert.equal(adapter.pending.size,0);
 const requested=scene.events.filter(row=>row.kind==='returned');assert.ok(requested.every(row=>row.accepted===true));
 const before=scene.events.filter(row=>row.kind==='before');
 if(scene.cause==='override')assert.equal(before.length,scene.amounts.length);
 else{
  assert.ok(before.length<requested.length);
  const repeated=requested.find(row=>!before.some(event=>event.call===row.call));
  assert.ok(repeated);assert.equal(delivered.some(row=>row.call===repeated.call),false);
 }
});
