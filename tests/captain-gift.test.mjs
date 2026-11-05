import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {captainWaterStep,applyCaptainWaterStep} from '../runtime/BP/scripts/captain-gift.js';
function fixture({x=.5,y=81,z=.5,width=.6}={}){
 const blocks=new Map(),queried=[],impulses=[];
 const actor={location:{x,y,z},getAABB:()=>({center:{x,y:y+.9,z},extent:{x:width/2,y:.9,z:width/2}}),
  dimension:{getBlock(p){queried.push(p);return blocks.get([p.x,p.y,p.z].join(','));}},getVelocity:()=>({x:.12,y:-.2,z:-.07}),
  getEffect:()=>undefined,applyImpulse:v=>impulses.push(v)};
 const water=(x,y,z,depth=0,typeId='minecraft:water',extra={})=>blocks.set([x,y,z].join(','),{typeId,permutation:{getState:()=>depth},...extra});
 return {actor,water,blocks,queried,impulses};
}
test('source-water clipping lands at Java float surface rather than the block top',()=>{
 const f=fixture();f.water(0,80,0);
 assert.equal(captainWaterStep(f.actor,-.2),-.111114501953125);
 assert.equal(captainWaterStep(f.actor,-.05),undefined);
 assert.equal(f.queried.length,24,'each invocation inspects the original twelve cells');
});
test('flowing, falling and waterlogged fluids use own height; the highest admitted fluid surface wins',()=>{
 for(const [depth,height] of [[7,.111114501953125],[8,.888885498046875],[0,.888885498046875]]){
  const f=fixture({y:80.1});f.water(0,80,0,depth,'minecraft:flowing_water');
  assert.ok(Math.abs(captainWaterStep(f.actor,-.4)-(height-.1))<1e-12);
 }
 const f=fixture();f.water(0,80,0,0,'minecraft:oak_fence',{isWaterlogged:true});f.water(0,81,0);
 assert.equal(captainWaterStep(f.actor,-.2),.888885498046875);
});
test('the original cross reaches shore edges through the inflated entity box',()=>{
 const narrow=fixture({x:.1,z:.5});narrow.water(-1,80,0);assert.equal(captainWaterStep(narrow.actor,-.2),-.111114501953125);
 const away=fixture({x:.9,z:.5,width:.2});away.water(-1,80,0);assert.equal(captainWaterStep(away.actor,-.2),undefined);
 const wide=fixture({x:.9,z:.5,width:1.4});wide.water(-1,80,0);assert.equal(captainWaterStep(wide.actor,-.2),-.111114501953125);
 const diagonal=fixture({x:.1,z:.1});diagonal.water(-1,80,-1);assert.equal(captainWaterStep(diagonal.actor,-.2),undefined,'lower diagonals are absent from the Java offsets');
});
test('rising, crouching and submerged entities are unchanged; missing chunks do not hide another loaded surface',()=>{
 for(const mode of ['rising','crouching','submerged']){
  const f=fixture();f.water(0,80,0);f.actor.isSneaking=mode==='crouching';
  assert.equal(captainWaterStep(f.actor,mode==='rising'?.1:-.2,mode==='submerged'),undefined);assert.equal(f.queried.length,0);
 }
 const f=fixture();f.water(0,80,0);const read=f.actor.dimension.getBlock;f.actor.dimension.getBlock=p=>{if(p.x===1)throw Error('unloaded');return read(p);};
 assert.equal(captainWaterStep(f.actor,-.2),-.111114501953125);
});
test('native correction preserves horizontal momentum and composes known jump/reverse impulses',()=>{
 const f=fixture();f.water(0,80,0);assert.equal(applyCaptainWaterStep(f.actor),true);
 assert.deepEqual(f.impulses,[{x:0,y:-.111114501953125-(-.28*.98),z:0}]);
 f.impulses.length=0;assert.equal(applyCaptainWaterStep(f.actor,{pendingImpulseY:.4}),false);assert.deepEqual(f.impulses,[]);
});

test('real effect tick dispatches Captain Gift to living recipients and stops on expiry',()=>{
 const player=fixture(),mob=fixture();player.actor.id='player';player.actor.typeId='minecraft:player';mob.actor.id='cow';mob.actor.typeId='minecraft:cow';
 for(const f of [player,mob])f.water(0,80,0);
 let active=true;
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const context=vm.createContext({applyCaptainWaterStep,eyesUnderWater:()=>false,
  getTavernEffectEntities:()=>[player.actor,mob.actor],readTavernEffects:()=>active?{captain_gift:{amplifier:0}}:{},
  AcceptedHurtFeedback:class{},CriticalFeedback:class{},JavaKillCredit:class{prune(){}},MolangVariableMap:class{},
  system:{currentTick:1},world:{getAllPlayers(){throw Error('Must use effect recipients');}}});
 vm.runInContext(source,context);vm.runInContext('tick()',context);
 assert.equal(player.impulses.length,1);assert.equal(mob.impulses.length,1);
 active=false;vm.runInContext('tick()',context);assert.equal(player.impulses.length,1);assert.equal(mob.impulses.length,1);
});

test('shallow native water uses its measured drag and gravity instead of air compensation',()=>{
 const f=fixture();f.actor.isInWater=true;f.water(0,80,0);assert.equal(applyCaptainWaterStep(f.actor),true);
 assert.deepEqual(f.impulses,[{x:0,y:-.111114501953125-(-.2*.8-.02),z:0}]);
});

test('native Player liquid gravity preserves the original surface instead of a 0.015-block offset',()=>{
 const f=fixture();f.actor.typeId='minecraft:player';f.actor.isInWater=true;f.water(0,80,0);assert.equal(applyCaptainWaterStep(f.actor),true);
 assert.deepEqual(f.impulses,[{x:0,y:-.111114501953125-(-.2*.8-.005),z:0}]);
});
