import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {meleeKnockbackSequence,attackerAfterKnockback} from '../development/elbow/source.js';
import {replaceQueuedVelocity} from '../development/elbow/native-motion.js';
const evidence=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/elbow-velocity-control.json',import.meta.url)));
test('source hurt float constant is widened, then extra attack performs its own halving and grounded cap',()=>{
 const input={velocity:{x:.2,y:0,z:-.4},ground:true,resistance:.5,baseHurtApplied:true,baseDirection:{x:0,z:-1},attackPlan:{strength:.5,direction:{x:0,z:-1},clearSprint:true}};
 const row=meleeKnockbackSequence(input);assert.equal(row.velocity.x,.05);assert.equal(row.velocity.y,.3500000014901161);assert.equal(row.velocity.z,.25000000149011614);assert.equal(row.clearSprint,true);
 const stronger=meleeKnockbackSequence({...input,baseHurtApplied:false});assert.equal(stronger.velocity.x,.1);assert.equal(stronger.velocity.z,.04999999999999999);
});
test('source full resistance preserves target momentum but still settles a positive attack branch',()=>{
 const velocity={x:.2,y:.3,z:-.4};const row=meleeKnockbackSequence({velocity,ground:false,resistance:1,baseHurtApplied:true,baseDirection:{x:0,z:-1},attackPlan:{strength:.5,direction:{x:0,z:-1},clearSprint:true}});
 assert.deepEqual(row.velocity,velocity);assert.equal(row.baseApplied,false);assert.equal(row.extraApplied,false);assert.equal(row.settleAttacker,true);assert.equal(row.clearSprint,true);assert.deepEqual(attackerAfterKnockback(velocity),{x:.12,y:.3,z:-.24});
 assert.throws(()=>meleeKnockbackSequence({velocity,ground:false,resistance:0,baseHurtApplied:undefined}),/SOURCE_HURT_BRANCH_REQUIRED/);
});
test('queued-motion writer supplies final source velocity and never samples the uncommitted native kick',()=>{
 const calls=[],entity={getVelocity(){throw Error('uncommitted Native getter must not be used');},clearVelocity(){calls.push('clear');},applyImpulse(value){calls.push(value);}};
 replaceQueuedVelocity(entity,{x:.1,y:.3,z:.7});assert.deepEqual(calls,['clear',{x:.1,y:.3,z:.7}]);assert.throws(()=>replaceQueuedVelocity(entity,{x:NaN,y:0,z:0}),/SOURCE_VELOCITY_REQUIRED/);assert.equal(calls.length,2);
});
test('real AI buffered-operation evidence retains all controls and six actual ground/resistance source outcomes',()=>{
 assert.equal(evidence.controls.length,10);assert.equal(evidence.source_sequence.length,6);assert.equal(evidence.production_adapter_installed,false);assert.equal(evidence.runtime_changed,false);assert.equal(evidence.real_players,0);assert.equal(evidence.client,false);
 for(const row of evidence.source_sequence){assert.equal(row.before_hurt,1);assert.equal(row.accepted_hurt,1);assert.equal(row.melee_hit,1);assert.ok(row.maximum_absolute_error<.00002);assert.equal(row.ground_before,row.case.includes('/ground/'));}
 for(const row of evidence.controls.filter(r=>r.case.endsWith('/clear')))assert.deepEqual(row.next_tick_velocity,{x:0,y:0,z:0});
 for(const row of evidence.controls.filter(r=>r.case.endsWith('/clear_impulse'))){assert.ok(Math.abs(row.next_tick_velocity.x-.2)<1e-6);assert.ok(Math.abs(row.next_tick_velocity.y-.05)<2e-5);assert.ok(Math.abs(row.next_tick_velocity.z-.7)<1e-6);}
 const text=JSON.stringify(evidence);for(const forbidden of ['/root/','/var/lib/','engine_inputs','source_inputs','bedrock_server'])assert.equal(text.includes(forbidden),false);
});
