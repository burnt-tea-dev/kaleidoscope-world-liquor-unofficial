import test from 'node:test';
import assert from 'node:assert/strict';
import {insertFreezerInput,extractFreezerInput} from '../runtime/BP/scripts/freezer-input.js';
class Stack{
 constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;this.maxAmount=64;}
 clone(){return new Stack(this.typeId,this.amount);}
 isStackableWith(other){return other?.typeId===this.typeId;}
}
function fixture(input=[],amount=2){
 const slots=Array(9),calls=[];if(amount)slots[4]=new Stack('minecraft:sugar',amount);
 let state={input:input.slice(),remaining:0,output:0,fluid:null},original=state;
 const inventory={size:9,getItem:i=>slots[i]?.clone(),setItem(i,value){calls.push(['write',i]);slots[i]=value?.clone();}};
 const equipment={value:undefined,getEquipment:()=>equipment.value?.clone(),setEquipment(slot,value){calls.push(['offhand']);equipment.value=value?.clone();return true;}};
 const player={selectedSlotIndex:4,getGameMode(){throw Error('INPUT_HAS_NO_CREATIVE_GATE');},getComponent:id=>id==='minecraft:inventory'?{container:inventory}:equipment,dimension:{spawnItem(){throw Error('SOURCE_INPUT_MUST_NOT_DROP');}}};
 const options={createStack:(id,n)=>new Stack(id,n),commit:next=>{calls.push(['storage']);state=next;},restore:()=>{calls.push(['restore']);state=original;}};
 return {slots,calls,inventory,equipment,player,options,get state(){return state;},insert:()=>insertFreezerInput(player,state,options),extract:()=>extractFreezerInput(player,state,options)};
}
test('input copy is stored before unconditional captured-hand debit without a mode read',()=>{
 for(const count of [1,2,64]){const f=fixture(['minecraft:ice'],count),original=f.state;assert.equal(f.insert().status,'INSERTED');assert.deepEqual(f.state.input,['minecraft:ice','minecraft:sugar']);assert.deepEqual(original.input,['minecraft:ice']);assert.equal(f.slots[4]?.amount,count===1?undefined:count-1);assert.deepEqual(f.calls.map(c=>c[0]),['storage','write']);}
});
test('busy, ready, four occupied slots and empty-hand insert do not mutate input',()=>{
 for(const delta of [{remaining:1},{output:1},{input:['a:a','b:b','c:c','d:d']}]){const f=fixture();Object.assign(f.state,delta);assert.equal(f.insert().status,'UNAVAILABLE');assert.deepEqual(f.calls,[]);}
 const f=fixture([],0);assert.equal(f.insert().status,'EMPTY_HAND');assert.deepEqual(f.calls,[]);
});
test('extraction commits last-slot removal first then follows Java inventory priority',()=>{
 const f=fixture(['minecraft:ice','minecraft:sugar'],2);assert.equal(f.extract().delivery,'INVENTORY');assert.deepEqual(f.state.input,['minecraft:ice']);assert.equal(f.slots[4].amount,3);assert.equal(f.slots[0],undefined);assert.deepEqual(f.calls.map(c=>c[0]),['storage','write']);
 const empty=fixture(['minecraft:sugar'],0);assert.equal(empty.extract().delivery,'INVENTORY');assert.equal(empty.slots[0].typeId,'minecraft:sugar');assert.equal(empty.slots[4],undefined);
 const offhand=fixture(['minecraft:ice'],0);offhand.equipment.value=new Stack('minecraft:ice',2);assert.equal(offhand.extract().delivery,'OFFHAND');assert.equal(offhand.equipment.value.amount,3);
});
test('full inventory ignores false addItem, removes source slot, emits no drop',()=>{
 const f=fixture(['minecraft:ice'],0);for(let i=0;i<9;i++)f.slots[i]=new Stack('minecraft:stone',64);assert.equal(f.extract().delivery,'UNINSERTED');assert.deepEqual(f.state.input,[]);assert.deepEqual(f.calls,[['storage']]);assert.equal(f.slots[4].typeId,'minecraft:stone');
});
test('empty extraction changes neither storage nor inventory',()=>{const f=fixture([],0);assert.equal(f.extract().status,'EMPTY');assert.deepEqual(f.calls,[]);});
test('commit and write faults restore original input and captured hand',()=>{
 for(const operation of ['insert','extract']){
  const f=fixture(['minecraft:sugar']);const original=f.state;
  const write=f.inventory.setItem;let fail=true;f.inventory.setItem=(...args)=>{if(fail){fail=false;throw Error('WRITE_FAILED');}write(...args);};
  assert.throws(()=>f[operation](),/WRITE_FAILED/);assert.equal(f.state,original);assert.equal(f.slots[4].amount,2);
  const before=fixture(['minecraft:sugar']);before.options.commit=()=>{throw Error('SAVE_FAILED');};assert.throws(()=>before[operation](),/SAVE_FAILED/);assert.equal(before.slots[4].amount,2);
 }
});
test('a changed captured origin is preserved while machine insertion is restored',()=>{
 const f=fixture(),commit=f.options.commit;f.options.commit=next=>{commit(next);f.slots[4]=new Stack('minecraft:diamond',3);};assert.throws(()=>f.insert(),/FREEZER_INPUT_ORIGIN_CHANGED/);assert.deepEqual(f.state.input,[]);assert.equal(f.slots[4].typeId,'minecraft:diamond');assert.equal(f.slots[4].amount,3);
});
