/** Pure production registration data; no engine, entities, inventory or players. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {payload} from '../runtime/BP/scripts/payload.js';
import {withFoundation} from '../runtime/BP/scripts/foundation.js';
import {preparePacketsFor} from '../runtime/BP/scripts/sdk/protocol.js';
import {canonical,digest} from '../runtime/BP/scripts/sdk/util.js';
import fs from 'node:fs';
import vm from 'node:vm';
import {createFoundationClient,readTavernEffects,getTavernEffectEntities} from '../runtime/BP/scripts/sdk/tavern-foundation-client.js';
import * as motion from '../runtime/BP/scripts/motion-source.js';

test('bounded preparation preserves the complete W125 registration wire and current revision',()=>{
 // This repair changes preparation and release identity; no gameplay data changes.
 // The complete unmodified W125 packet set is an independent predecessor oracle.
 const current=withFoundation(payload),before={...current,version:'0.1.125'};
 function finish(job){let result,yields=0;do{result=job.next();if(!result.done)yields++;}while(!result.done);return {value:result.value,yields};}
 const baseline=finish(preparePacketsFor(before,'baseline_wire'));
 assert.ok(baseline.yields>100);assert.equal(baseline.value.packets.length,175);
 assert.equal(createHash('sha256').update(JSON.stringify(baseline.value.packets)).digest('hex'),'4b177d50639383244d459f662c5f3ffb7ba8e0e45195815bbfde0ef937789185');
 const actual=finish(preparePacketsFor(current));assert.equal(actual.value.revision,'r'+digest(canonical(current)));
 const raw=actual.value.packets.filter(row=>row.id.endsWith(':extension_chunk')).map(row=>JSON.parse(row.message).data).join('');
 assert.equal(raw,canonical(current));assert.ok(actual.value.packets.every(row=>Buffer.byteLength(row.message)<=1900));
});

const source='kaleidoscope_world_liquor';
function recipientFixture(){
 const signal=()=>({handlers:[],subscribe(fn){this.handlers.push(fn);},emit(event){for(const fn of this.handlers)fn(event);}});
 const entities=new Map(),operations={allPlayers:0,resolve:0,velocity:0},warnings=[];
 const system={currentTick:1,afterEvents:{scriptEventReceive:signal()},runInterval(){}};
 const world={getAllPlayers(){operations.allPlayers++;return Array.from({length:200},(_,i)=>({id:'idle'+i}));},getEntity(id){operations.resolve++;return entities.get(id);},afterEvents:Object.fromEntries(['itemCompleteUse','entityDie','entityRemove','playerLeave'].map(name=>[name,signal()]))};
 createFoundationClient(system,world,{source,furniture:[],legacyEffectKey:source+':effects'},()=>true);
 const code=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const context=vm.createContext({...motion,lavaContact:()=>false,readTavernEffects,getTavernEffectEntities,world,system,AcceptedHurtFeedback:class{},CriticalFeedback:class{},JavaKillCredit:class{prune(){}},MolangVariableMap:class{},console:{warn:row=>warnings.push(row)}});
 vm.runInContext(code,context);
 const actor=(id,typeId='minecraft:player')=>{
  const health={currentValue:1,effectiveMax:1000,setCurrentValue(n){this.currentValue=n;}},dp=new Map();
  const entity={id,typeId,isValid:true,isOnGround:true,inputInfo:{getButtonState:()=> 'Released'},getVelocity(){operations.velocity++;return {x:0,y:-.2,z:0};},getComponent:name=>name==='minecraft:health'?health:undefined,getEffect:()=>undefined,getDynamicProperty:key=>dp.get(key),setDynamicProperty:(key,value)=>dp.set(key,value),health};
  entities.set(id,entity);return entity;
 };
 const snapshot=(entity,rows,sequence=system.currentTick,packSource=source)=>system.afterEvents.scriptEventReceive.emit({sourceType:'Server',id:'kaleidoscope_tavern:effect_snapshot',message:JSON.stringify({source:packSource,entity:entity.id,sequence,part:0,parts:1,rows:rows.map(name=>({id:packSource+':'+name,ticks:100,amplifier:0}))})});
 return {world,system,operations,actor,snapshot,tick(n){system.currentTick=n;vm.runInContext('tick()',context);},jumpCount:()=>vm.runInContext('jumps.size',context),jumpRemaining:id=>vm.runInContext('jumps.get('+JSON.stringify(id)+')?.remaining',context),warnings};
}
test('production tick scales with fresh effect recipients, not 200 idle players; passive effects do not read velocity',()=>{
 const f=recipientFixture();for(let i=1;i<=20;i++)f.tick(i);
 assert.deepEqual(f.operations,{allPlayers:0,resolve:0,velocity:0});
 const player=f.actor('recipient-player'),mob=f.actor('recipient-mob','minecraft:cow');
 f.snapshot(player,['continuous_heal','beheading']);f.snapshot(mob,['continuous_heal']);
 for(let i=21;i<=25;i++)f.tick(i);
 assert.equal(player.health.currentValue,6);assert.equal(mob.health.currentValue,6);
 assert.deepEqual(f.operations,{allPlayers:0,resolve:10,velocity:0});assert.deepEqual(f.warnings,[]);
 f.world.afterEvents.playerLeave.emit({playerId:player.id});f.world.afterEvents.entityRemove.emit({removedEntityId:mob.id});
 f.tick(26);assert.equal(f.operations.resolve,10);
});
test('empty snapshot revokes immediately without empty heartbeats; TTL expiry discards old jump allowance',()=>{
 const f=recipientFixture(),player=f.actor('jump-recipient');
 f.snapshot(player,['multi_jump']);f.tick(1);assert.equal(f.jumpRemaining(player.id),1);
 player.isOnGround=false;f.snapshot(player,[],2);f.tick(2);assert.equal(f.jumpCount(),0);
 f.snapshot(player,['multi_jump'],3);f.tick(3);assert.equal(f.jumpRemaining(player.id),0);
 player.isOnGround=true;f.tick(4);assert.equal(f.jumpRemaining(player.id),1);
 f.tick(23);assert.equal(f.jumpCount(),1,'snapshot remains fresh at exactly 20 ticks');
 f.tick(24);assert.equal(f.jumpCount(),0,'missing host renewal must expire at 21 ticks');
 player.isOnGround=false;f.snapshot(player,['multi_jump'],25);f.tick(25);assert.equal(f.jumpRemaining(player.id),0);
 f.world.afterEvents.playerLeave.emit({playerId:player.id});assert.deepEqual(f.warnings,[]);
});
test('other pack snapshots cannot enroll W recipients; milk and removal revoke the real SDK snapshot',()=>{
 const f=recipientFixture(),player=f.actor('milk-recipient');
 f.snapshot(player,['continuous_heal'],1,'foreign_addon');f.tick(1);assert.equal(player.health.currentValue,1);
 f.snapshot(player,['continuous_heal']);f.tick(2);assert.equal(player.health.currentValue,2);
 f.world.afterEvents.itemCompleteUse.emit({source:player,itemStack:{typeId:'minecraft:milk_bucket'}});f.tick(3);assert.equal(player.health.currentValue,2);
 f.snapshot(player,['continuous_heal'],4);f.world.afterEvents.entityRemove.emit({removedEntityId:player.id});f.tick(4);assert.equal(player.health.currentValue,2);
 assert.equal(f.operations.allPlayers,0);assert.deepEqual(f.warnings,[]);
});
