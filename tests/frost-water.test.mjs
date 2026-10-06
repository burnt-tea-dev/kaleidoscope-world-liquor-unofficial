import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {freezeWater} from '../runtime/BP/scripts/frost-water.js';

function surface({location={x:.5,y:81,z:.5},overrides=new Map()}={}){
 const changed=[],queried=[];
 const entity={location,isOnGround:true,dimension:{getBlock(at){
  const key=`${at.x},${at.y},${at.z}`;queried.push(key);
  const row=overrides.get(key);
  if(row instanceof Error)throw row;
  if(row)return row;
  return {typeId:at.y===Math.floor(location.y)-1?'minecraft:water':'minecraft:air',isAir:at.y===Math.floor(location.y),permutation:{getState:()=>0},setType:id=>changed.push({at:{...at},id})};
 }}};
 return {entity,changed,queried};
}
test('grounded circle includes the source radius boundary, without the old radius-seven cap',()=>{
 const small=surface();assert.equal(freezeWater(small.entity,0),29);
 const large=surface();assert.equal(freezeWater(large.entity,5),197);
 const keys=new Set(large.changed.map(row=>`${row.at.x},${row.at.z}`));
 assert.ok(keys.has('8,0'));assert.ok(keys.has('-8,0'));assert.ok(keys.has('0,8'));
 assert.ok(!keys.has('8,1'));assert.ok(!keys.has('9,0'));
 assert.ok(large.changed.every(row=>row.id==='minecraft:frosted_ice'&&row.at.y===80));
});
test('airborne entities do not query or change water; block position uses floor for negative coordinates',()=>{
 const airborne=surface();airborne.entity.isOnGround=false;assert.equal(freezeWater(airborne.entity,0),0);assert.equal(airborne.queried.length,0);
 const negative=surface({location:{x:-.1,y:-.1,z:-.1}});assert.equal(freezeWater(negative.entity,0),29);
 assert.ok(negative.changed.some(row=>row.at.x===-1&&row.at.y===-2&&row.at.z===-1));
});
test('flowing/falling water, missing source state, nonwater and covered source water remain intact',()=>{
 const water=depth=>({typeId:'minecraft:water',permutation:{getState:()=>depth},setType(){throw Error('must not replace rejected water');}});
 const overrides=new Map([['0,80,0',water(1)],['1,80,0',water(8)],['2,80,0',water(undefined)],['0,80,1',{typeId:'minecraft:lava'}],['0,81,-1',{isAir:false}]]);
 const f=surface({overrides});assert.equal(freezeWater(f.entity,0),24);
 const keys=new Set(f.changed.map(row=>`${row.at.x},${row.at.z}`));
 for(const key of ['0,0','1,0','2,0','0,1','0,-1'])assert.ok(!keys.has(key),key);
});
test('an unavailable native block does not suppress reachable source water',()=>{
 const f=surface({overrides:new Map([['-3,80,0',new Error('unloaded chunk')]])});assert.equal(freezeWater(f.entity,0),28);
});
test('production player tick executes frost every tick and stops immediately on effect expiry',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const actor={id:'source tick API snapshot',typeId:'minecraft:player',getVelocity:()=>({x:0,y:0,z:0})},state={frost_walker:{amplifier:5}},calls=[];
 const ctx=vm.createContext({getTavernEffectEntities:()=>[],AcceptedHurtFeedback:class{},CriticalFeedback:class{},JavaKillCredit:class{prune(){}},MolangVariableMap:class{},world:{getAllPlayers:()=>[actor]},system:{currentTick:1},readTavernEffects:()=>state,freezeWater:(entity,amp)=>calls.push({entity,amp,tick:ctx.system.currentTick})});
 vm.runInContext(source,ctx);
 for(let tick=1;tick<=6;tick++){ctx.system.currentTick=tick;vm.runInContext('tick()',ctx);}
 assert.deepEqual(calls.map(row=>row.tick),[1,2,3,4,5,6]);assert.ok(calls.every(row=>row.entity===actor&&row.amp===5));
 delete state.frost_walker;ctx.system.currentTick=7;vm.runInContext('tick()',ctx);assert.equal(calls.length,6);
});
