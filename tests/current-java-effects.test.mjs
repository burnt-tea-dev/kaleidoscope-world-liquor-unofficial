import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sourceMultiJumpVelocity} from '../runtime/BP/scripts/motion-source.js';

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
