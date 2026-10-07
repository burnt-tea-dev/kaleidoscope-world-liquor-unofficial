import test from 'node:test';
import assert from 'node:assert/strict';
import {extractFreezerOutput} from '../runtime/BP/scripts/freezer-output.js';
class Stack{
 constructor(typeId,amount=1,nameTag=''){this.typeId=typeId;this.amount=amount;this.nameTag=nameTag;this.maxAmount=64;}
 clone(){return new Stack(this.typeId,this.amount,this.nameTag);}
 isStackableWith(other){return this.typeId===other?.typeId&&this.nameTag===other.nameTag;}
}
const recipe={result:{id:'kaleidoscope_world_liquor:pochi_pudding'},extract_condition:{item:'minecraft:bowl'}};
function fixture(amount=1,mode='Survival'){
 const slots=Array(9),calls=[],drops=[];let state={recipe:'kaleidoscope_world_liquor:freezer/pochi_pudding',output:1,remaining:0};slots[4]=new Stack('minecraft:bowl',amount,'source bowl name');
 const inventory={size:9,getItem:i=>slots[i]?.clone(),setItem(i,value){calls.push(['write',i,value?.typeId,value?.amount]);slots[i]=value?.clone();}};
 const equipment={value:undefined,getEquipment:()=>equipment.value?.clone(),setEquipment(slot,value){calls.push(['offhand']);equipment.value=value?.clone();return true;}};
 const player={selectedSlotIndex:4,getGameMode:()=>mode,getComponent:id=>id==='minecraft:inventory'?{container:inventory}:equipment,location:{x:1,y:80,z:2},dimension:{spawnItem(item){calls.push(['drop']);const entity={stack:item.clone(),removed:false,remove(){this.removed=true;}};drops.push(entity);return entity;}}};
 const original={...state};const options={createStack:(id,n)=>new Stack(id,n),commit:next=>{calls.push(['commit']);state=next;},restore:()=>{calls.push(['restore']);state=original;}};
 return {slots,calls,drops,inventory,equipment,player,options,get state(){return state;},extract:r=>extractFreezerOutput(player,state,r??recipe,options)};
}
test('last Survival bowl returns the product in the hand even with an earlier empty slot',()=>{
 const f=fixture();assert.equal(f.extract().delivery,'HAND');assert.equal(f.slots[4].typeId,recipe.result.id);assert.equal(f.slots[4].nameTag,'');assert.equal(f.slots[0],undefined);assert.deepEqual(f.calls.map(r=>r[0]),['write','commit']);assert.equal(f.state.output,0);
});
test('stacked bowls settle before inventory insertion and retain original metadata',()=>{
 const f=fixture(2);assert.equal(f.extract().delivery,'INVENTORY');assert.equal(f.slots[4].amount,1);assert.equal(f.slots[4].nameTag,'source bowl name');assert.equal(f.slots[0].typeId,recipe.result.id);assert.deepEqual(f.calls.map(r=>r[0]),['write','write','commit']);
});
test('Creative requires the bowl but neither consumes it nor replaces the hand',()=>{
 const f=fixture(1,'Creative');assert.equal(f.extract().delivery,'INVENTORY');assert.equal(f.slots[4].typeId,'minecraft:bowl');assert.equal(f.slots[4].amount,1);assert.equal(f.slots[0].typeId,recipe.result.id);assert.equal(f.state.output,0);
 const absent=fixture(1,'Creative');absent.slots[4]=undefined;assert.equal(absent.extract().status,'NEED_ITEM');assert.equal(absent.calls.length,0);assert.equal(absent.state.output,1);
});
test('full inventory drops exactly one output after stacked debit or Creative no debit',()=>{
 for(const mode of ['Survival','Creative']){
  const f=fixture(2,mode);for(let i=0;i<9;i++)if(i!==4)f.slots[i]=new Stack('minecraft:stone',64);
  assert.equal(f.extract().delivery,'DROP');assert.equal(f.drops.length,1);assert.equal(f.drops[0].stack.amount,1);assert.equal(f.slots[4].amount,mode==='Creative'?2:1);assert.equal(f.state.output,0);assert.equal(f.calls.at(-1)[0],'commit');
 }
});
test('unconditional outputs follow selected then offhand then main merge before free slots',()=>{
 const r={result:{id:'minecraft:ice'}};
 const selected=fixture();selected.slots[4]=new Stack('minecraft:ice',3);selected.equipment.value=new Stack('minecraft:ice',5);assert.equal(selected.extract(r).delivery,'INVENTORY');assert.equal(selected.slots[4].amount,4);assert.equal(selected.slots[0],undefined);
 const offhand=fixture();offhand.equipment.value=new Stack('minecraft:ice',5);offhand.slots[7]=new Stack('minecraft:ice',6);assert.equal(offhand.extract(r).delivery,'OFFHAND');assert.equal(offhand.equipment.value.amount,6);assert.equal(offhand.slots[7].amount,6);
 const main=fixture();main.slots[7]=new Stack('minecraft:ice',6);assert.equal(main.extract(r).delivery,'INVENTORY');assert.equal(main.slots[7].amount,7);assert.equal(main.slots[0],undefined);assert.equal(main.slots[4].amount,1);
});
test('wrong ingredient and repeated exhausted extraction never deliver or change the batch',()=>{
 const wrong=fixture();wrong.slots[4]=new Stack('minecraft:stone');assert.equal(wrong.extract().status,'NEED_ITEM');assert.equal(wrong.calls.length,0);assert.equal(wrong.state.output,1);
 const done=fixture();done.extract();const writes=done.calls.length;assert.equal(done.extract().status,'NO_OUTPUT');assert.equal(done.calls.length,writes);
});
test('a saved-state failure restores owned hand/main/offhand writes and removes emitted output',()=>{
 for(const kind of ['hand','main','offhand','drop']){
  const f=fixture(kind==='hand'?1:2);if(kind==='offhand')f.equipment.value=new Stack(recipe.result.id,7);
  if(kind==='drop')for(let i=0;i<9;i++)if(i!==4)f.slots[i]=new Stack('minecraft:stone',64);
  const before=Array.from(f.slots,s=>s?.clone());f.options.commit=next=>{throw Error('SAVE_FAILED');};
  assert.throws(()=>f.extract(),/SAVE_FAILED/);assert.deepEqual(Array.from(f.slots),before);assert.equal(f.state.output,1);if(kind==='offhand')assert.equal(f.equipment.value.amount,7);if(kind==='drop')assert.equal(f.drops.length,1);assert.ok(f.drops.every(e=>e.removed));
 }
});
