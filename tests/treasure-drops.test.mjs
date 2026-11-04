import test from 'node:test';
import assert from 'node:assert/strict';
import {installDeathDrops,treasureDropChance,treasureDropDiagnostics} from '../runtime/BP/scripts/treasure-drops.js';

class Stack{constructor(typeId,amount=1,metadata={}){this.typeId=typeId;this.amount=amount;this.metadata=metadata;} clone(){return new Stack(this.typeId,this.amount,structuredClone(this.metadata));}}
function harness({effects=new Map(),random=()=>0,reroll}={}){
 const timeouts=[],signals={},spawned=[];
 const dimension={spawnItem(stack,at){spawned.push([stack.typeId,stack.amount,{...at}]);return {id:'copy'};}};
 const world={afterEvents:{entityItemDrop:{subscribe:fn=>signals.drop=fn},entityRemove:{subscribe:fn=>signals.remove=fn}},getLootTableManager:()=>({generateLootFromEntity:reroll})};
 const system={runTimeout:(fn,ticks)=>timeouts.push({fn,ticks})};
 const runtime=installDeathDrops(world,system,{read:entity=>effects.get(entity)??{},killCredit:{state:()=>({})},random});
 const actor=id=>({id,typeId:'minecraft:zombie',dimension,location:{x:1,y:2,z:3}});
 const item=(typeId,amount,location,metadata)=>({location,getComponent:key=>key==='minecraft:item'?{itemStack:new Stack(typeId,amount,metadata)}:undefined});
 return {runtime,timeouts,spawned,dimension,effects,actor,item,fire:()=>timeouts.splice(0).forEach(row=>row.fn()),drop:(entity,items)=>signals.drop({entity,items})};
}
const reset=()=>{Object.assign(treasureDropDiagnostics,{deaths:0,duplicated:0});treasureDropDiagnostics.errors.length=0;};

test('chance follows the current Java double expression capped at one',()=>{
 for(const [amplifier,chance] of [[0,.15],[1,.2],[5,.4],[17,1],[255,1]])assert.equal(treasureDropChance(amplifier),chance);
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

test('Luck extends the same death list before Treasure snapshots it, including complete metadata and each original position',()=>{
 reset();const attacker={id:'both-effects',getComponent:()=>undefined},originalAt={x:1.2,y:2.3,z:3.4},spawned=[];
 let draws=0,rolls=0;
 const h=harness({random:()=>{draws++;return 0;},reroll:source=>{
  assert.equal(source,m);rolls++;
  return {0:new Stack('minecraft:diamond',64),1:new Stack('minecraft:emerald',3,{name:'Luck item',lore:['opaque data'],custom:{bytes:[0,255]}}),length:2};
 }}),m=h.actor('combined');
 h.effects.set(attacker,{luck:{amplifier:4},treasure_guide:{amplifier:0}});
 const original=h.item('minecraft:diamond',2,originalAt,{lore:['original data']}),native={0:original,length:1};
 h.dimension.spawnItem=(stack,at)=>{
  spawned.push({stack,at:{...at}});
  // A synchronous nested drop event must not reroll or double this death again.
  h.drop(m,native);return {id:'copy'};
 };
 assert.equal(h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}}),true);
 h.drop(m,native);h.drop(m,native);h.fire();
 assert.equal(draws,6,'one Treasure chance plus five capped Luck chances');assert.equal(rolls,5);
 assert.deepEqual(spawned.map(({stack,at})=>[stack.typeId,stack.amount,at]),[
  ['minecraft:emerald',3,m.location],['minecraft:diamond',2,originalAt],['minecraft:emerald',3,m.location],
 ]);
 assert.deepEqual(spawned[1].stack.metadata,{lore:['original data']});
 assert.deepEqual(spawned[2].stack.metadata,spawned[0].stack.metadata);assert.notEqual(spawned[2].stack,spawned[0].stack);
 assert.equal(treasureDropDiagnostics.duplicated,2);assert.deepEqual(treasureDropDiagnostics.errors,[]);
});

test('a rejected Luck draw still lets Treasure copy the original cohort once',()=>{
 reset();const attacker={id:'both-effects',getComponent:()=>undefined},h=harness({reroll:()=>{throw Error('Native loot unavailable');}}),m=h.actor('luck-failure');
 h.effects.set(attacker,{luck:{amplifier:0},treasure_guide:{amplifier:0}});
 h.runtime.death({deadEntity:m,damageSource:{damagingEntity:attacker}});
 h.drop(m,[h.item('minecraft:bone',2,{x:2,y:3,z:4})]);
 assert.deepEqual(h.spawned,[['minecraft:bone',2,{x:2,y:3,z:4}]]);
 assert.equal(treasureDropDiagnostics.errors.length,1);assert.match(treasureDropDiagnostics.errors[0].error,/Native loot unavailable/);
});
