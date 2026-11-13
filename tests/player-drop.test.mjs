import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {giveJavaInventoryItem} from '../runtime/BP/scripts/java-player-inventory.js';
import {extractFreezerOutput} from '../runtime/BP/scripts/freezer-output.js';
import {completeBottledDrink} from '../runtime/BP/scripts/bottled-drink.js';

class Stack{
 constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;this.maxAmount=64;this.nameTag='source metadata';}
 clone(){return Object.assign(new Stack(this.typeId,this.amount),this);}
 isStackableWith(other){return this.typeId===other.typeId&&this.nameTag===other.nameTag;}
}
function fixture({mode='survival',headY=65.62,failMotion,failSave=false}={}){
 const slots=Array.from({length:9},()=>new Stack('minecraft:stone',64)),events=[],drops=[];let state={output:1};
 const inventory={size:slots.length,getItem:i=>slots[i]?.clone(),setItem(i,item){slots[i]=item?.clone();}};
 const equipment={item:undefined,getEquipment(){return this.item?.clone();},setEquipment(_,item){this.item=item?.clone();return true;}};
 const player={typeId:'minecraft:player',selectedSlotIndex:4,location:{x:-3.25,y:64,z:7.75},
  getGameMode:()=>mode,getComponent:id=>id==='minecraft:inventory'?{container:inventory}:equipment,
  getHeadLocation(){events.push('head');return {x:999,y:headY,z:999};},getRotation(){events.push('rotation');return {x:0,y:0};},addEffect(){},
  dimension:{playSound(){},spawnItem(item,at){
   events.push('spawn');const entity={item:item.clone(),at:{...at},velocity:{x:.07,y:.2,z:-.04},removed:false,
    clearVelocity(){events.push('clear');if(failMotion==='clear')throw Error('MOTION_REJECTED');this.velocity={x:0,y:0,z:0};},
    applyImpulse(v){events.push('impulse');if(failMotion==='impulse')throw Error('MOTION_REJECTED');this.velocity={x:this.velocity.x+v.x,y:this.velocity.y+v.y,z:this.velocity.z+v.z};},
    remove(){this.removed=true;events.push('remove');}};drops.push(entity);return entity;
  }}};
 const random=()=>{events.push('random');return 0;},options={random,recordDrop(){events.push('record');}};
 const extract=()=>extractFreezerOutput(player,state,{result:{id:'minecraft:ice'}},{createStack:(id,n)=>new Stack(id,n),commit(next){if(failSave)throw Error('SAVE_FAILED');state=next;},restore(){}});
 return {player,slots,inventory,equipment,drops,events,options,extract,get state(){return state;}};
}

test('directional drop matches 280 independently executed JVM float/LUT cases',async()=>{
 const {sourcePlayerDropVelocity}=await import('../runtime/BP/scripts/motion-source.js');
 const rows=fs.readFileSync(new URL('./fixtures/java-player-drop.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.length,280);
 for(const row of rows){const actual=sourcePlayerDropVelocity(row);for(const axis of ['x','y','z'])assert.ok(Math.abs(actual[axis]-row.expected[axis])<1e-15,JSON.stringify({row,actual,axis}));}
});
for(const headY of [65.62,65.27,64.4])test('full inventory drops one intact item at source eye-relative height '+headY,()=>{
 const f=fixture({headY}),item=new Stack('minecraft:glass_bottle'),snapshot=f.slots.map(s=>s.clone());
 assert.equal(giveJavaInventoryItem(f.player,item,f.options),'DROP');assert.equal(f.drops.length,1);
 assert.deepEqual(f.drops[0].at,{x:-3.25,y:headY-Math.fround(.3),z:7.75});assert.deepEqual(f.drops[0].item,item);assert.deepEqual(f.slots,snapshot);
 assert.deepEqual(f.drops[0].velocity,{x:0,y:Math.fround(.1),z:Math.fround(.3)});
 assert.deepEqual(f.events,['head','spawn','record','rotation','random','random','random','random','clear','impulse']);
});
test('non-drop routes never read pose or consume drop RNG',()=>{
 for(const route of ['selected','offhand','main','empty','creative','no-drop']){
  const f=fixture({mode:route==='creative'?'creative':'survival'}),item=new Stack('minecraft:glass_bottle');
  if(route==='selected')f.slots[4]=new Stack(item.typeId,2);
  if(route==='offhand')f.equipment.item=new Stack(item.typeId,2);
  if(route==='main')f.slots[7]=new Stack(item.typeId,2);
  if(route==='empty')f.slots[7]=undefined;
  assert.notEqual(giveJavaInventoryItem(f.player,item,{...f.options,allowDrop:route!=='no-drop'}),'DROP');assert.deepEqual(f.events,[],route);
 }
});
for(const failMotion of ['clear','impulse'])test('motion failure retains the single settled item: '+failMotion,()=>{
 const f=fixture({failMotion});assert.equal(giveJavaInventoryItem(f.player,new Stack('minecraft:glass_bottle'),f.options),'DROP');
 assert.equal(f.drops.length,1);assert.equal(f.drops[0].removed,false);assert.equal(f.drops[0].item.amount,1);
});
test('failed spawn preserves the previous rejected-drop signal',()=>{
 const f=fixture();f.player.dimension.spawnItem=()=>undefined;assert.throws(()=>giveJavaInventoryItem(f.player,new Stack('minecraft:glass_bottle'),f.options),/PLAYER_ITEM_DROP_REJECTED/);
});
test('actual bottled completion consumes once and drops one bottle at the corrected height',()=>{
 const f=fixture();f.slots[4]=new Stack('kaleidoscope_world_liquor:cola',2);
 const result=completeBottledDrink({source:f.player,itemStack:f.slots[4].clone()},{createStack:(id,n)=>new Stack(id,n),rng:()=>0,worldRng:()=>0});
 assert.equal(result.status,'COMPLETED');assert.equal(result.delivery,'DROP');assert.equal(f.slots[4].amount,1);assert.equal(f.drops.length,1);assert.equal(f.drops[0].item.typeId,'minecraft:glass_bottle');assert.equal(f.drops[0].at.y,65.62-Math.fround(.3));assert.ok(f.events.indexOf('clear')<f.events.indexOf('impulse'));
});
test('actual freezer output settles once and its existing rollback removes the moving item',()=>{
 for(const failSave of [false,true]){
  const f=fixture({failSave});if(failSave)assert.throws(f.extract,/SAVE_FAILED/);else assert.equal(f.extract().delivery,'DROP');
  assert.equal(f.drops.length,1);assert.equal(f.drops[0].item.typeId,'minecraft:ice');assert.equal(f.drops[0].at.y,65.62-Math.fround(.3));assert.equal(f.drops[0].removed,failSave);assert.equal(f.state.output,failSave?1:0);
 }
});
