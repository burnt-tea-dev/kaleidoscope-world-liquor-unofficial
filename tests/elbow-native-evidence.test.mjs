import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {livingKnockback} from '../development/elbow/source.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/elbow-knockback-capabilities.json',import.meta.url),'utf8'));
const byCase=new Map(data.cases.map(row=>[row.case,row]));
const at=(row,phase)=>row.samples.find(sample=>sample.phase===phase);

test('native capability retains separate failed collection/subset facts and verifies actual air, not labels',()=>{
 assert.equal(data.collection.ground_run_overall_ok,false);
 assert.equal(data.collection.air_run_overall_ok,true);
 assert.equal(data.cases.length,14);assert.equal(data.collection.ground_cases,8);assert.equal(data.collection.actual_air_cases,6);
 assert.equal(data.production_adapter_installed,false);assert.equal(data.simulated_players,false);assert.equal(data.client,false);
 for(const row of data.cases){
  assert.equal(row.counts.before,1);assert.equal(row.counts.hit,1);assert.equal(row.invalid_air,false);
  if(!row.configured_ground){
   assert.ok(row.actual_air_samples>=14);
   for(const phase of ['beforeHurt','entityHitEntity','afterHurt','afterHurt/run'])assert.equal(at(row,phase).observed_ground,false,row.case+'/'+phase);
  }
 }
 assert.equal(data.label_only_air_counterexamples.length,6);
 for(const row of data.label_only_air_counterexamples){assert.equal(row.configured_ground,false);assert.equal(row.observed_ground_at_before_hurt,true);assert.equal(row.actual_air_proven,false);}
});

test('actual AI event order and same-tick callbacks cannot substitute for a committed base-kick observation',()=>{
 for(const row of data.cases.filter(row=>row.counts.after===1)){
  const before=at(row,'beforeHurt');assert.ok(row.samples.indexOf(before)<row.samples.indexOf(at(row,'entityHitEntity')));
  assert.ok(row.samples.indexOf(at(row,'entityHitEntity'))<row.samples.indexOf(at(row,'afterHurt')));
  for(const phase of ['entityHitEntity','afterHurt','afterHurt/run']){
   const sample=at(row,phase);assert.equal(sample.relative_tick,0);assert.deepEqual(sample.target_velocity,before.target_velocity);
  }
 }
 const canceled=byCase.get('r0/ground/cancel');assert.equal(canceled.counts.after,0);
 assert.deepEqual(at(canceled,'entityHitEntity/timeout1').target_velocity,{x:0,y:0,z:0});
 assert.equal(byCase.get('r0/ground/death').counts.died,1);
});

test('measured native API vertical kick is a concrete counterexample to the original Java airborne branch',()=>{
 for(const name of ['r0','r05']){
  const row=byCase.get(name+'/air/API'),before=at(row,'beforeHurt'),after=at(row,'entityHitEntity/timeout1');
  const source=livingKnockback({velocity:before.target_velocity,ground:false,resistance:row.resistance,strength:.5,direction:{x:0,z:-1}});
  assert.equal(source.velocity.y,before.target_velocity.y);assert.ok(Math.abs(after.target_velocity.y-source.velocity.y)>.18);
  assert.ok(Math.abs(after.target_velocity.y-.2)<1e-5);
 }
 const full=byCase.get('r1/air/API');assert.deepEqual(at(full,'entityHitEntity/timeout1').target_velocity,at(full,'beforeHurt').target_velocity);
 // Public metadata must not accidentally grow into host/private logs or inventories.
 const text=JSON.stringify(data);for(const forbidden of ['/root/','/var/lib/','engine_inputs','source_inputs','-138727','bedrock_server'])assert.equal(text.includes(forbidden),false,forbidden);
});
