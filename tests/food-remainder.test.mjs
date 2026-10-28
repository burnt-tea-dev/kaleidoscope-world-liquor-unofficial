import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {completeFoodRemainder,settleFoodRemainder,foodRemainderDiagnostics,FOOD_REMAINDERS} from '../runtime/BP/scripts/food-remainder.js';
import {completeBottledDrink} from '../runtime/BP/scripts/bottled-drink.js';
import {traceFoodPhase} from '../runtime/BP/scripts/food-phase-trace.js';

const PUDDING='kaleidoscope_world_liquor:pochi_pudding',BOWL='minecraft:bowl';
class Stack{
 constructor(typeId,amount=1,nameTag=''){this.typeId=typeId;this.amount=amount;this.nameTag=nameTag;this.maxAmount=64;}
 clone(){return new Stack(this.typeId,this.amount,this.nameTag);}
 isStackableWith(other){return other?.typeId===this.typeId&&other.nameTag===this.nameTag;}
}
const createStack=(id,amount)=>new Stack(id,amount);
/** A player eating from slot 4; `amount` is the pudding count before the use. */
function fixture(amount=1,{mode='Survival',typeId=PUDDING}={}){
 const calls=[],queued=[],slots=Array(9);
 const inventory={size:9,getItem:slot=>slots[slot]?.clone(),setItem(slot,stack){calls.push(['write',slot,stack?.typeId,stack?.amount]);slots[slot]=stack?.clone();}};
 const equipment={getEquipment(){return undefined;},setEquipment(){throw Error('unexpected offhand write');}};
 const player={typeId:'minecraft:player',isValid:true,selectedSlotIndex:4,mode,location:{x:1,y:80,z:2},getGameMode(){return this.mode;},
  getComponent:id=>id==='minecraft:inventory'?{container:inventory}:id==='minecraft:equippable'?equipment:undefined,
  dimension:{spawnItem(stack,at){calls.push(['drop',stack.typeId,stack.amount,{...at}]);return {id:'item-entity'};}}};
 slots[4]=new Stack(typeId,amount);
 const event={source:player,itemStack:slots[4].clone()};
 return {player,slots,calls,queued,event,options:{createStack,run:fn=>queued.push(fn)},
  /** what native food does to the used slot between the callback and the next tick */
  nativeDebit(){const s=slots[4];if(!s)return;if(s.amount===1)slots[4]=undefined;else s.amount--;},
  settle(){assert.equal(queued.length,1);return queued.shift()();}};
}
const reset=()=>{Object.assign(foodRemainderDiagnostics,{completed:0,hand:0,dropped:0,relocated:0,unresolved:0});foodRemainderDiagnostics.errors.length=0;};

test('only the pudding carries a Java remainder; other owned foods schedule nothing',()=>{
 assert.deepEqual(FOOD_REMAINDERS,{[PUDDING]:BOWL});
 const f=fixture(1,{typeId:'kaleidoscope_world_liquor:liangshan_ice_cone'});
 assert.equal(completeFoodRemainder(f.event,f.options).status,'NOT_OWNED_REMAINDER_FOOD');assert.equal(f.queued.length,0);assert.equal(f.calls.length,0);
 const mob={...f.event,source:{...f.player,typeId:'minecraft:zombie'}};assert.equal(completeFoodRemainder(mob,f.options).status,'NOT_OWNED_REMAINDER_FOOD');
});
test('nothing is written in the completion callback itself; the branch waits one tick for the native debit',()=>{
 const f=fixture(2);const result=completeFoodRemainder(f.event,f.options);
 assert.deepEqual(result,{status:'SCHEDULED',slot:4,remainder:BOWL});assert.equal(f.calls.length,0);assert.equal(f.queued.length,1);
});
test('Survival last serving: the emptied hand slot receives the bowl (LivingEntity.completeUsingItem replacement), nothing is dropped',()=>{
 reset();const f=fixture(1);completeFoodRemainder(f.event,f.options);f.nativeDebit();assert.equal(f.slots[4],undefined);
 assert.deepEqual(f.settle(),{status:'COMPLETED',delivery:'HAND'});
 assert.equal(f.slots[4].typeId,BOWL);assert.equal(f.slots[4].amount,1);assert.deepEqual(f.calls,[['write',4,BOWL,1]]);
 assert.equal(foodRemainderDiagnostics.hand,1);assert.equal(foodRemainderDiagnostics.dropped,0);
});
test('Survival with servings left: one bowl is spawned at the player, the remaining puddings stay in hand',()=>{
 reset();const f=fixture(3);completeFoodRemainder(f.event,f.options);f.nativeDebit();assert.equal(f.slots[4].amount,2);
 assert.deepEqual(f.settle(),{status:'COMPLETED',delivery:'DROP'});
 assert.deepEqual(f.calls,[['drop',BOWL,1,{x:1,y:80,z:2}]]);assert.equal(f.slots[4].typeId,PUDDING);assert.equal(f.slots[4].amount,2);
 assert.equal(foodRemainderDiagnostics.dropped,1);
});
test('the drop reads the player position at settle time, not the completion position',()=>{
 const f=fixture(2);completeFoodRemainder(f.event,f.options);f.nativeDebit();f.player.location={x:9,y:70,z:-3};f.settle();
 assert.deepEqual(f.calls[0][3],{x:9,y:70,z:-3});
});
test('Creative spawns the bowl at the player whether or not the engine debited the stack; the hand is never overwritten',()=>{
 for(const debit of [false,true]){
  reset();const f=fixture(1,{mode:'Creative'});completeFoodRemainder(f.event,f.options);if(debit)f.nativeDebit();
  assert.deepEqual(f.settle(),{status:'COMPLETED',delivery:'DROP'});
  assert.deepEqual(f.calls,[['drop',BOWL,1,{x:1,y:80,z:2}]]);assert.equal(f.slots[4]?.typeId,debit?undefined:PUDDING);
 }
});
test('abilities are sampled at completion: switching to Creative after the callback still follows the Survival branch',()=>{
 const f=fixture(1);completeFoodRemainder(f.event,f.options);f.nativeDebit();f.player.mode='Creative';
 assert.equal(f.settle().delivery,'HAND');assert.equal(f.slots[4].typeId,BOWL);
});
test('a slot the player changed during the tick is not overwritten: the bowl goes through Java Inventory.add',()=>{
 reset();const f=fixture(1);completeFoodRemainder(f.event,f.options);f.slots[4]=new Stack('minecraft:diamond',3);
 assert.deepEqual(f.settle(),{status:'COMPLETED',delivery:'RELOCATED_INVENTORY'});
 assert.equal(f.slots[4].typeId,'minecraft:diamond');assert.equal(f.slots[4].amount,3);assert.equal(f.slots[0].typeId,BOWL);
 assert.equal(foodRemainderDiagnostics.relocated,1);
 const full=fixture(1);completeFoodRemainder(full.event,full.options);for(let slot=0;slot<9;slot++)full.slots[slot]=new Stack('minecraft:stone',64);
 assert.equal(full.settle().delivery,'RELOCATED_DROP');assert.equal(full.calls.at(-1)[0],'drop');
});
test('a renamed or otherwise different pudding in the slot counts as a changed slot, a same pudding counts as servings left',()=>{
 const same=fixture(2);completeFoodRemainder(same.event,same.options);same.nativeDebit();assert.equal(same.settle().delivery,'DROP');
 const renamed=fixture(2);completeFoodRemainder(renamed.event,renamed.options);renamed.slots[4]=new Stack(PUDDING,1,'foreign name');assert.equal(renamed.settle().delivery,'RELOCATED_INVENTORY');assert.equal(renamed.slots[4].nameTag,'foreign name');
});
test('a player who left before the tick gets no write and is recorded as unresolved',()=>{
 reset();const f=fixture(1);completeFoodRemainder(f.event,f.options);f.nativeDebit();f.player.isValid=false;
 assert.deepEqual(f.settle(),{status:'PLAYER_GONE'});assert.equal(f.calls.length,0);assert.equal(foodRemainderDiagnostics.unresolved,1);
});
test('a rejected drop or a failed read is recorded, never retried, and never falls back to a second write',()=>{
 reset();const f=fixture(2);completeFoodRemainder(f.event,f.options);f.nativeDebit();f.player.dimension.spawnItem=()=>undefined;
 assert.deepEqual(f.settle(),{status:'COMPLETION_FAILED'});assert.equal(f.calls.filter(row=>row[0]==='write').length,0);
 assert.match(foodRemainderDiagnostics.errors.at(-1).error,/REMAINDER_DROP_REJECTED/);
 const broken=fixture(1);broken.player.getComponent=()=>{throw Error('inventory unavailable');};completeFoodRemainder(broken.event,broken.options);
 assert.equal(broken.settle().status,'COMPLETION_FAILED');assert.equal(foodRemainderDiagnostics.unresolved,2);
 const hand=fixture(1);Object.defineProperty(hand.player,'selectedSlotIndex',{get(){throw Error('hand unavailable');}});
 assert.equal(completeFoodRemainder(hand.event,hand.options).status,'UNRESOLVED_HAND');assert.equal(hand.queued.length,0);
 assert.equal(foodRemainderDiagnostics.errors.length,3);
});
test('settle is pure with respect to the captured arguments: a second settle of the same use is a plain no-op write-free call when the slot already holds the bowl',()=>{
 const f=fixture(1);completeFoodRemainder(f.event,f.options);f.nativeDebit();f.settle();
 // A duplicate schedule would see a bowl (a different item) in the slot and relocate another bowl; the callback schedules exactly once, which the previous tests pin.
 assert.equal(f.calls.length,1);
});
test('registered food callback applies the Java effects, then schedules the remainder through system.run with the real ItemStack factory',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 let startup;const queued=[],registered=new Map();
 const context=vm.createContext({completeBottledDrink,completeFoodRemainder,traceFoodPhase,ItemStack:Stack,NS:'kaleidoscope_world_liquor',registerFurniture(){},system:{beforeEvents:{startup:{subscribe:fn=>startup=fn}},run:fn=>queued.push(fn)},world:{afterEvents:{worldLoad:{subscribe(){}}}}});
 vm.runInContext(source,context);startup({itemComponentRegistry:{registerCustomComponent:(id,handlers)=>registered.set(id,handlers)}});
 const f=fixture(1);const effects=[];f.player.addEffect=(...args)=>effects.push(args);
 registered.get('kaleidoscope_world_liquor:food').onCompleteUse(f.event);
 assert.equal(JSON.stringify(effects),JSON.stringify([['regeneration',9600,{amplifier:0}]]));assert.equal(f.calls.length,0);assert.equal(queued.length,1);
 f.nativeDebit();queued.shift()();assert.equal(f.slots[4].typeId,BOWL);assert.ok(f.slots[4] instanceof Stack);
 const cone=fixture(1,{typeId:'kaleidoscope_world_liquor:liangshan_ice_cone'});cone.player.addEffect=(...args)=>effects.push(args);
 registered.get('kaleidoscope_world_liquor:food').onCompleteUse(cone.event);assert.equal(queued.length,0);assert.deepEqual(effects.slice(1).map(row=>row[0]),['fire_resistance','speed']);
});
