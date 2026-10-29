import test from 'node:test';
import assert from 'node:assert/strict';
import {installTreasureDrops,treasureDropChance,treasureDropDiagnostics} from '../runtime/BP/scripts/treasure-drops.js';

class Stack{constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;} clone(){return new Stack(this.typeId,this.amount);}}
function harness({effects=new Map(),random=()=>0}={}){
 const timeouts=[],signals={},spawned=[];
 const dimension={spawnItem(stack,at){spawned.push([stack.typeId,stack.amount,{...at}]);return {id:'copy'};}};
 const world={afterEvents:{entityItemDrop:{subscribe:fn=>signals.drop=fn}}};
 const system={runTimeout:(fn,ticks)=>timeouts.push({fn,ticks})};
 const runtime=installTreasureDrops(world,system,{read:entity=>effects.get(entity)??{},random});
 const actor=id=>({id,typeId:'minecraft:zombie',dimension,location:{x:1,y:2,z:3}});
 const item=(typeId,amount,location)=>({location,getComponent:key=>key==='minecraft:item'?{itemStack:new Stack(typeId,amount)}:undefined});
 return {runtime,timeouts,spawned,dimension,effects,actor,item,fire:()=>timeouts.splice(0).forEach(row=>row.fn()),drop:(entity,items)=>signals.drop({entity,items})};
}
const reset=()=>{Object.assign(treasureDropDiagnostics,{deaths:0,duplicated:0});treasureDropDiagnostics.errors.length=0;};

test('chance is the Java double expression without a cap',()=>{
 for(const amplifier of [0,1,5,17,255])assert.equal(treasureDropChance(amplifier),.15+amplifier*.05);
});
test('death without a source owner, without the effect, or with a failed roll schedules nothing',()=>{
 reset();const attacker={id:'a'},h=harness({random:()=>.15});h.effects.set(attacker,{treasure_guide:{amplifier:0}});
 assert.equal(h.runtime.death({deadEntity:h.actor('m'),damageSource:{cause:'fall'}}),false);
 assert.equal(h.runtime.death({deadEntity:h.actor('m'),damageSource:{damagingEntity:{id:'plain'}}}),false);
 assert.equal(h.runtime.death({deadEntity:h.actor('m'),damageSource:{damagingEntity:attacker}}),false,'nextDouble() < 0.15 is strict');
 assert.equal(h.timeouts.length,0);assert.equal(treasureDropDiagnostics.deaths,0);
 const lucky=harness({random:()=>.1999,effects:new Map([[attacker,{treasure_guide:{amplifier:1}}]])});
 assert.equal(lucky.runtime.death({deadEntity:lucky.actor('m'),damageSource:{damagingEntity:attacker}}),true,'amplifier 1 raises the chance to 0.20');
});
test('the native drop list is copied entry by entry at each item position; copies are not copied again',()=>{
 reset();const attacker={id:'a'},h=harness();h.effects.set(attacker,{treasure_guide:{amplifier:0}});const m=h.actor('m');
 assert.equal(h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker,damagingProjectile:{id:'arrow'}}}),true,'the source owner, not the projectile, holds the effect');
 const items=[h.item('minecraft:rotten_flesh',2,{x:1.2,y:2,z:3.4}),h.item('minecraft:carrot',1,{x:.9,y:2.1,z:2.8}),h.item('minecraft:air',1,{x:0,y:0,z:0})];
 h.dimension.spawnItem=(stack,at)=>{h.spawned.push([stack.typeId,stack.amount,{...at}]);items.push(h.item(stack.typeId,stack.amount,at));return {id:'copy'};};
 h.drop(m,items);
 assert.deepEqual(h.spawned,[['minecraft:rotten_flesh',2,{x:1.2,y:2,z:3.4}],['minecraft:carrot',1,{x:.9,y:2.1,z:2.8}]]);
 assert.equal(treasureDropDiagnostics.duplicated,2);h.fire();assert.equal(h.spawned.length,2);
});
test('an item without a readable position falls back to the death position',()=>{
 const attacker={id:'a'},h=harness();h.effects.set(attacker,{treasure_guide:{amplifier:0}});const m=h.actor('m');
 h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}});h.drop(m,[h.item('minecraft:bone',1,undefined)]);
 assert.deepEqual(h.spawned,[['minecraft:bone',1,{x:1,y:2,z:3}]]);
});
test('a death that never produces a drop list expires after two ticks; a late or unrelated list is ignored',()=>{
 const attacker={id:'a'},h=harness();h.effects.set(attacker,{treasure_guide:{amplifier:0}});const m=h.actor('m');
 h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}});assert.equal(h.timeouts[0].ticks,2);h.fire();
 h.drop(m,[h.item('minecraft:bone',1,{x:0,y:0,z:0})]);h.drop(h.actor('other'),[h.item('minecraft:bone',1,{x:0,y:0,z:0})]);
 assert.equal(h.spawned.length,0);
});
test('one roll per death: the whole list is duplicated or nothing is',()=>{
 const attacker={id:'a'};let draws=0;const h=harness({random:()=>{draws++;return 0;}});h.effects.set(attacker,{treasure_guide:{amplifier:0}});const m=h.actor('m');
 h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}});h.drop(m,[h.item('minecraft:a',1,{x:0,y:0,z:0}),h.item('minecraft:b',3,{x:0,y:0,z:0}),h.item('minecraft:c',1,{x:0,y:0,z:0})]);
 assert.equal(draws,1);assert.equal(h.spawned.length,3);
});
test('a rejected copy stops the list, is recorded once and is never retried',()=>{
 reset();const attacker={id:'a'},h=harness();h.effects.set(attacker,{treasure_guide:{amplifier:0}});const m=h.actor('m');
 h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}});h.dimension.spawnItem=()=>undefined;
 h.drop(m,[h.item('minecraft:a',1,{x:0,y:0,z:0}),h.item('minecraft:b',1,{x:0,y:0,z:0})]);
 assert.equal(treasureDropDiagnostics.errors.length,1);assert.match(treasureDropDiagnostics.errors[0].error,/TREASURE_DROP_REJECTED/);
 h.fire();h.drop(m,[h.item('minecraft:a',1,{x:0,y:0,z:0})]);assert.equal(treasureDropDiagnostics.errors.length,1);
});
