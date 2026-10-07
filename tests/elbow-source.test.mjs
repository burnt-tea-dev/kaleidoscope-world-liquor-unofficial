import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {elbowModifier,attackAttribute,attackKnockbackPlan,livingKnockback,attackerAfterKnockback} from '../development/elbow/source.js';
const rows=fs.readFileSync(new URL('./fixtures/java-elbow.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('360 current-source numeric cases agree with independently evaluated Java float/LUT/ground/resistance rules',()=>{
 assert.equal(rows.length,360);
 for(const row of rows){
  const value=attackAttribute({base:0,addValues:[elbowModifier(row.amplifier)]});assert.equal(value,row.attribute);
  const plan=attackKnockbackPlan({actorKind:row.actor,yaw:Math.fround(row.yaw),knockbackAfterEnchantments:Math.fround(value),successfulAttack:true});
  assert.equal(plan.strength,Math.fround(row.strength));assert.deepEqual(plan.direction,row.direction);
  const result=livingKnockback({velocity:{x:.2,y:.3,z:-.4},ground:row.ground,resistance:row.resistance,strength:plan.strength,direction:plan.direction});
  for(const axis of ['x','y','z'])assert.ok(Math.abs(result.velocity[axis]-row.velocity[axis])<1e-14,row.actor+'/'+row.amplifier+'/'+row.yaw+'/'+axis);
 }
});
test('source attribute operation order, cap, sprint threshold and zero-force actor settlement are explicit',()=>{
 assert.equal(attackAttribute({base:1,addValues:[2],addMultipliedBase:[.5],addMultipliedTotal:[-.5]}),2.25);
 const base={actorKind:'player',yaw:0,knockbackAfterEnchantments:1,successfulAttack:true,sprinting:true};
 assert.equal(attackKnockbackPlan({...base,attackStrengthScale:.9}).strength,.5);
 assert.equal(attackKnockbackPlan({...base,attackStrengthScale:1}).strength,1);
 assert.equal(attackKnockbackPlan({...base,actorKind:'mob'}).strength,.5);
 assert.equal(attackKnockbackPlan({...base,successfulAttack:false}),undefined);
 assert.deepEqual(attackerAfterKnockback({x:1,y:-2,z:3}),{x:.6,y:-2,z:1.7999999999999998});
 assert.deepEqual(livingKnockback({velocity:{x:1,y:2,z:3},ground:true,resistance:1,strength:1,direction:{x:0,z:-1}}),{velocity:{x:1,y:2,z:3},applied:false});
});
