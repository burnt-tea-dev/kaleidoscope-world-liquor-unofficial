import test from 'node:test';
import assert from 'node:assert/strict';
import {luckBonus,luckHolder,installLuckLoot} from '../runtime/BP/scripts/luck-loot.js';

const stack=(typeId,amount=1,metadata={})=>({typeId,amount,metadata,
 clone(){return stack(this.typeId,this.amount,structuredClone(this.metadata));}});

test('new author Luck adds a new type once and preserves its full native stack data',()=>{
 const original=stack('minecraft:diamond',2,{name:'original'});
 const rare=stack('minecraft:emerald',3,{lore:['keep'],durability:17,custom:{opaque:[0,255,128]}});
 const rolls=[[stack('minecraft:diamond',64),rare,stack('minecraft:emerald',50)],
              [stack('minecraft:emerald',9),stack('minecraft:gold_ingot',2)]];
 const bonus=luckBonus([original],1,()=>rolls.shift(),()=>0);
 assert.deepEqual(bonus.map(row=>[row.typeId,row.amount]),[['minecraft:emerald',3],['minecraft:gold_ingot',2]]);
 assert.deepEqual(bonus[0].metadata,rare.metadata);assert.notEqual(bonus[0],rare);
 assert.equal(original.amount,2);assert.equal(original.metadata.name,'original');
});

test('each level has its own 25 percent roll, capped at five; failed rolls do not query loot',()=>{
 let calls=0;
 assert.deepEqual(luckBonus([],255,()=>{calls++;return [];},()=>0),[]);assert.equal(calls,5);
 calls=0;luckBonus([],4,()=>{calls++;return [];},()=>.25);assert.equal(calls,0);
 const random=[.1,.4,.2,.7,.05];luckBonus([],4,()=>{calls++;return [];},()=>random.shift());assert.equal(calls,3);
});

test('holder selection follows the current Java loot context priority',()=>{
 const context={lastDamagePlayer:{id:'last'},attackingEntity:{id:'attacker'},directAttackingEntity:{id:'direct'},thisEntity:{id:'self'}};
 const effects=new Map([['last',{luck:{amplifier:1}}],['attacker',{luck:{amplifier:4}}]]);
 const read=actor=>effects.get(actor.id)??{};
 assert.equal(luckHolder(context,read).actor.id,'last');effects.delete('last');assert.equal(luckHolder(context,read).actor.id,'attacker');
 effects.clear();assert.equal(luckHolder(context,read),undefined);
});

test('the runtime binds exact native death drops, never a nearby player drop or another source',()=>{
 const events={},scheduled=[],spawned=[],tool=stack('minecraft:iron_sword',1,{enchantments:['looting:3']});
 const signal=name=>({subscribe:handler=>events[name]=handler});
 const attacker={id:'player',getComponent:()=>({getEquipment:()=>tool})};
 const actor={id:'mob',location:{x:1,y:2,z:3},dimension:{spawnItem:(item,at)=>spawned.push({item,at})}};
 const world={afterEvents:{entityItemDrop:signal('drop'),entityRemove:signal('remove')},getEntity:()=>attacker,
  getLootTableManager:()=>({generateLootFromEntity:(source,held)=>{
   assert.equal(source,actor);assert.deepEqual(held.metadata,tool.metadata);
   return {0:stack('minecraft:diamond'),1:stack('minecraft:emerald',2,{lore:['native']}),length:2};
  }})};
 const system={currentTick:50,runTimeout:fn=>scheduled.push(fn)};
 const runtime=installLuckLoot(world,system,p=>p===attacker?{luck:{amplifier:0}}:{},{state:()=>({})},{random:()=>0});
 events.drop({entity:{id:'foreign'}});assert.equal(spawned.length,0);
 runtime.death({deadEntity:actor,damageSource:{damagingEntity:attacker}});
 const initial={getComponent:()=>({itemStack:stack('minecraft:diamond')})};
 events.drop({entity:actor,items:{0:initial,length:1}});
 assert.equal(spawned.length,1);assert.equal(spawned[0].item.typeId,'minecraft:emerald');assert.deepEqual(spawned[0].item.metadata,{lore:['native']});
 assert.deepEqual(spawned[0].at,actor.location);
 events.drop({entity:actor,items:{0:initial,length:1}});assert.equal(spawned.length,1);
 scheduled.forEach(fn=>fn());
});
