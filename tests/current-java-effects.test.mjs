import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sourceMultiJumpVelocity} from '../runtime/BP/scripts/motion-source.js';
import {applyCaptainWaterStep} from '../runtime/BP/scripts/captain-gift.js';

test('the current author air jump uses 0.5 vertical speed plus Jump Boost and preserves horizontal motion',()=>{
 assert.deepEqual(sourceMultiJumpVelocity({reverse:false}),{x:0,y:.5,z:0});
 assert.deepEqual(sourceMultiJumpVelocity({reverse:true,jumpBoost:2}),{x:0,y:-.8,z:0});
});

test('water walking excludes submerged eyes, including flowing water, without rejecting feet in water',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/liquid-contact.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replaceAll('export function','function');
 const context=vm.createContext({});vm.runInContext(source,context);const under=vm.runInContext('eyesUnderWater',context);
 let type='minecraft:water',above='minecraft:air',depth=0,headY=10.85;
 const entity={getHeadLocation:()=>({x:.5,y:headY,z:.5}),dimension:{getBlock:at=>({
  typeId:at.y===11?above:type,permutation:{getState:()=>depth}})}};
 assert.equal(under(entity),true);headY=10.9;assert.equal(under(entity),false);
 above='minecraft:water';assert.equal(under(entity),true);
 above='minecraft:air';depth=7;headY=10.2;assert.equal(under(entity),false);
 depth=0;type='minecraft:flowing_water';headY=10.8;assert.equal(under(entity),true);
 type='minecraft:air';assert.equal(under(entity),false);
});

test('submersion reads native waterlogged blocks at the eyes and above the water surface',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/liquid-contact.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replaceAll('export function','function');
 const context=vm.createContext({});vm.runInContext(source,context);const under=vm.runInContext('eyesUnderWater',context);
 let eyes=true,above=false,y=10.8;
 const entity={getHeadLocation:()=>({x:.5,y,z:.5}),dimension:{getBlock:at=>({typeId:'minecraft:oak_fence',isWaterlogged:at.y===10?eyes:above,permutation:{getState:()=>undefined}})}};
 assert.equal(under(entity),true);y=10.9;assert.equal(under(entity),false);
 above=true;assert.equal(under(entity),true);eyes=false;assert.equal(under(entity),false);
});

// Java Entity.updateFluidOnEyes adds the block Y and height as float before
// comparing to the double eye Y. These boundaries were checked in a JVM.
test('Java float waterline excludes eyes exactly at the surface and admits eyes just below negative-Y water',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/liquid-contact.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replaceAll('export function','function');
 const context=vm.createContext({});vm.runInContext(source,context);const under=vm.runInContext('eyesUnderWater',context);
 for(const [blockY,eyeY,expected,depth=0] of [[80,80.888885498046875,false],[80,80.888885,true],[-10,-9.11111068725586,false],[-10,-9.1111107,true],[80,80.44444274902344,false,4]]){
  const entity={getHeadLocation:()=>({x:.5,y:eyeY,z:.5}),dimension:{getBlock:at=>({typeId:at.y===blockY?'minecraft:water':'minecraft:air',permutation:{getState:()=>depth}})}};
  assert.equal(under(entity),expected,`water at Y=${blockY}, eyes at ${eyeY}`);
 }
 const impulses=[],entity={typeId:'minecraft:cod',location:{x:.5,y:80.4,z:.5},isInWater:true,
  getHeadLocation:()=>({x:.5,y:80.888885498046875,z:.5}),
  getAABB:()=>({center:{x:.5,y:80.7,z:.5},extent:{x:.2,y:.3,z:.2}}),
  getVelocity:()=>({x:.1,y:-.1,z:0}),getEffect:()=>undefined,applyImpulse:value=>impulses.push(value),
  dimension:{getBlock:at=>({typeId:at.y===80?'minecraft:water':'minecraft:air',permutation:{getState:()=>0}})}};
 assert.equal(applyCaptainWaterStep(entity,{underWater:under(entity)}),true,'an eye exactly at the Java surface must not suppress water walking');
 assert.equal(impulses.length,1);assert.equal(impulses[0].x,0);assert.equal(impulses[0].z,0);
});
