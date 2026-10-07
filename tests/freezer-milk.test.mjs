import test from 'node:test';
import assert from 'node:assert/strict';
import {fillFreezerMilk} from '../runtime/BP/scripts/freezer-milk.js';
class Stack{
 constructor(typeId,amount=1,nameTag=''){this.typeId=typeId;this.amount=amount;this.nameTag=nameTag;this.maxAmount=64;}
 clone(){const result=new Stack(this.typeId,this.amount,this.nameTag);result.maxAmount=this.maxAmount;return result;}
 isStackableWith(other){return this.maxAmount>1&&this.typeId===other?.typeId&&this.nameTag===other.nameTag;}
}
function fixture(amount=1,mode='Survival'){
 const slots=Array(9),calls=[];slots[4]=new Stack('minecraft:milk_bucket',amount,'source milk name');let state={input:[],fluid:null,remaining:0,output:0};const original={...state};
 const inventory={size:9,getItem:i=>slots[i]?.clone(),setItem(i,value){calls.push(['write',i,value?.typeId,value?.amount]);slots[i]=value?.clone();}};
 const equipment={value:undefined,getEquipment:()=>equipment.value?.clone(),setEquipment(slot,value){calls.push(['offhand']);equipment.value=value?.clone();return true;}};
 const player={mode,selectedSlotIndex:4,getGameMode(){calls.push(['mode']);return this.mode;},getComponent:id=>id==='minecraft:inventory'?{container:inventory}:equipment,dimension:{spawnItem(){throw Error('SOURCE_MILK_MUST_NOT_DROP');}}};
 const options={createStack:(id,n)=>new Stack(id,n),commit:next=>{calls.push(['fill']);state=next;},restore:()=>{calls.push(['restore']);state=original;}};
 return {slots,calls,inventory,equipment,player,options,get state(){return state;},fill:()=>fillFreezerMilk(player,state,options)};
}
test('one milk bucket fills before mode/debit and leaves the empty bucket in its original hand',()=>{
 const f=fixture();assert.equal(f.fill().delivery,'HAND');assert.equal(f.state.fluid,'kaleidoscope_world_liquor:milk_still');assert.equal(f.slots[4].typeId,'minecraft:bucket');assert.equal(f.slots[4].nameTag,'');assert.equal(f.slots[0],undefined);assert.deepEqual(f.calls.map(r=>r[0]),['fill','mode','write']);
});
test('real milk maxAmount1 semantics do not confuse stack compatibility with identity',()=>{const f=fixture();f.slots[4].maxAmount=1;assert.equal(f.slots[4].isStackableWith(f.slots[4].clone()),false);assert.equal(f.fill().delivery,'HAND');assert.equal(f.slots[4].typeId,'minecraft:bucket');});
test('Creative fills without consuming milk or producing an empty bucket',()=>{
 const f=fixture(1,'Creative');assert.equal(f.fill().delivery,'CREATIVE');assert.equal(f.slots[4].typeId,'minecraft:milk_bucket');assert.equal(f.slots[4].nameTag,'source milk name');assert.equal(f.slots[0],undefined);assert.deepEqual(f.calls.map(r=>r[0]),['fill','mode']);
});
test('nonstandard stacked milk follows addItem priority and ignores a full-inventory failure without a drop',()=>{
 const f=fixture(2);f.equipment.value=new Stack('minecraft:bucket',4);assert.equal(f.fill().delivery,'OFFHAND');assert.equal(f.slots[4].amount,1);assert.equal(f.slots[4].nameTag,'source milk name');assert.equal(f.equipment.value.amount,5);assert.equal(f.slots[0],undefined);
 const full=fixture(2);for(let i=0;i<9;i++)if(i!==4)full.slots[i]=new Stack('minecraft:stone',64);assert.equal(full.fill().delivery,'UNINSERTED');assert.equal(full.slots[4].amount,1);assert.equal(full.state.fluid,'kaleidoscope_world_liquor:milk_still');
});
test('source mode is sampled after the tank operation',()=>{
 for(const [before,after]of [['Survival','Creative'],['Creative','Survival']]){const f=fixture(1,before),commit=f.options.commit;f.options.commit=next=>{commit(next);f.player.mode=after;};assert.equal(f.fill().delivery,after==='Creative'?'CREATIVE':'HAND');}
});
test('full, working, ready and nonmilk states do not perform the special fill',()=>{
 for(const delta of [{fluid:'minecraft:water'},{remaining:1},{output:1}]){const f=fixture();Object.assign(f.state,delta);assert.equal(f.fill().status,'NOT_EMPTY_IDLE_TANK');assert.equal(f.calls.length,0);}
 const other=fixture();other.slots[4]=new Stack('minecraft:water_bucket');assert.equal(other.fill().status,'NOT_MILK');assert.equal(other.calls.length,0);
});
test('fill or hand-write failure restores the tank and owned inventory',()=>{
 const before=fixture();before.options.commit=()=>{throw Error('FILL_FAILED');};assert.throws(()=>before.fill(),/FILL_FAILED/);assert.equal(before.state.fluid,null);assert.equal(before.slots[4].typeId,'minecraft:milk_bucket');
 const after=fixture();let fail=true;const write=after.inventory.setItem;after.inventory.setItem=(...args)=>{if(fail){fail=false;throw Error('HAND_WRITE_FAILED');}write(...args);};assert.throws(()=>after.fill(),/HAND_WRITE_FAILED/);assert.equal(after.state.fluid,null);assert.equal(after.slots[4].typeId,'minecraft:milk_bucket');assert.equal(after.slots[4].amount,1);
});
test('changed origin after fill does not overwrite a foreign item and restores the tank',()=>{
 const f=fixture(),commit=f.options.commit;f.options.commit=next=>{commit(next);f.slots[4]=new Stack('minecraft:diamond',3);};assert.throws(()=>f.fill(),/MILK_ORIGINAL_STACK_CHANGED/);assert.equal(f.state.fluid,null);assert.equal(f.slots[4].typeId,'minecraft:diamond');assert.equal(f.slots[4].amount,3);
});
