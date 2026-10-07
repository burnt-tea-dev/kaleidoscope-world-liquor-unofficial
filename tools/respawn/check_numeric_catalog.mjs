/** Necessary catalog/key and source-counterexample checks; no runtime/client claim. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JAVA_BLOCK_CATALOG as C,JAVA_BLOCK_FLAGS as F,javaSourceStateKey,javaStaticStateFacts as lookup,javaDynamicStateObservation as dynamic} from '../../development/respawn/java-vanilla-block-catalog-1.21.1.js';
let checked=0;
for(const [blockId,block] of Object.entries(C.blocks)){
 const names=Object.keys(block.properties).sort(),category=block.dynamic_shape?C.dynamic_states:C.static_states;
 let count=0;
 function enumerate(at,properties){
  if(at===names.length){const key=javaSourceStateKey(blockId,properties),row=category[key];assert(row,'missing '+key);assert.equal(!!(row[1]&F.dynamic_shape),block.dynamic_shape);assert(row[0]>=0&&row[0]<C.shapes.length);assert(row[2]>=0&&row[2]<C.fluids.length);count++;return;}
  const name=names[at];for(const value of block.properties[name])enumerate(at+1,{...properties,[name]:value});
 }
 enumerate(0,{});assert.equal(count,block.state_count);assert(category[block.default_key]);checked+=count;
}
assert.equal(checked,26684);assert.equal(Object.keys(C.static_states).length+Object.keys(C.dynamic_states).length,checked);assert.equal(C.scope.blocks,1060);assert.equal(C.errors.length,0);
const observations=[];
function observed(blockId,properties={}){const row=lookup(blockId,properties);assert(row);const record={block:blockId,properties,boxes:row.collisionBoxes,sturdy_up:!!(row.flags&F.sturdy_up),is_solid:!!(row.flags&F.is_solid),motion_blocking:!!(row.flags&F.motion_blocking),nonempty_fluid:!!(row.flags&F.nonempty_fluid),climbable:!!(row.flags&F.climbable),danger:!!(row.flags&F.player_block_dangerous),invalid_spawn:!!(row.flags&F.invalid_spawn_inside)};observations.push(record);return row;}
const fence=observed('minecraft:oak_fence',{east:false,north:false,south:false,waterlogged:false,west:false});assert.equal(fence.collisionBoxes[0][4],1.5);assert(!(fence.flags&F.sturdy_up));
const carpet=observed('minecraft:white_carpet');assert.equal(carpet.collisionBoxes[0][4],.0625);
const cactus=observed('minecraft:cactus',{age:0});assert.equal(cactus.collisionBoxes[0][4],.9375);assert(cactus.flags&F.player_block_dangerous);
const bottom=observed('minecraft:oak_slab',{type:'bottom',waterlogged:false}),top=observed('minecraft:oak_slab',{type:'top',waterlogged:false});assert.equal(bottom.collisionBoxes[0][4],.5);assert(!(bottom.flags&F.sturdy_up));assert(top.flags&F.sturdy_up);
const water=observed('minecraft:water',{level:0});assert.equal(water.collisionBoxes.length,0);assert(water.flags&F.nonempty_fluid);assert(water.flags&F.motion_blocking);
const ladder=observed('minecraft:ladder',{facing:'north',waterlogged:false});assert(ladder.flags&F.climbable);
const portal=observed('minecraft:end_portal');assert(portal.flags&F.invalid_spawn_inside);
assert.equal(lookup('minecraft:oak_slab'),undefined);assert.equal(lookup('minecraft:oak_slab',{type:'bottom',waterlogged:false,unknown:true}),undefined);assert.equal(lookup('addon:unknown'),undefined);assert.equal(lookup('constructor'),undefined);assert.equal(dynamic('__proto__'),undefined);
const powdered=C.blocks['minecraft:powder_snow'];assert.equal(lookup('minecraft:powder_snow'),undefined);assert(dynamic('minecraft:powder_snow'));assert(powdered.dynamic_shape);
const bed=observed('minecraft:red_bed',{facing:'north',occupied:false,part:'foot'});assert.equal(Math.max(...bed.collisionBoxes.map(b=>b[4])),.5625);
console.log(JSON.stringify({all_state_keys_resolved:checked,static_state_count:C.scope.static_states,dynamic_state_count:C.scope.dynamic_states,source_counterexamples:observations,unknown_block_and_incomplete_properties:'unresolved, no fallback',dynamic_shapes:'excluded from static lookup'},null,2));
console.log(JSON.stringify({keys_resolved:checked,counterexamples:observations.length,unknown_and_dynamic_policy:'passed'}));
