import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {completeBottledDrink,giveGlassBottle,burpPitch,eatingPitch,bottledCompletionAudio} from '../runtime/BP/scripts/bottled-drink.js';
import {payload} from '../runtime/BP/scripts/payload.js';
import {traceFoodPhase} from '../runtime/BP/scripts/food-phase-trace.js';
class Stack{
 constructor(typeId,amount=1,nameTag=''){this.typeId=typeId;this.amount=amount;this.nameTag=nameTag;this.maxAmount=typeId==='minecraft:glass_bottle'?64:16;}
 clone(){return new Stack(this.typeId,this.amount,this.nameTag);}
 isStackableWith(other){return other?.typeId===this.typeId&&other.nameTag===this.nameTag;}
}
const createStack=(id,count)=>new Stack(id,count);
test('completion pitch matches independently executed JVM float expressions',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-bottled-audio.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.length,42);
 for(const row of rows){const first=Math.fround(row.first),expected=Math.fround(row.expected);assert.equal(row.kind==='burp'?burpPitch(first):eatingPitch(first,Math.fround(row.second)),expected,JSON.stringify(row));}
});
function fixture(id='cola',amount=1){
 const calls=[],slots=Array(9),inventory={size:9,getItem:slot=>slots[slot]?.clone(),setItem(slot,stack){calls.push(['write',slot,stack?.typeId,stack?.amount]);slots[slot]=stack?.clone();}};
 const equipment={offhand:undefined,getEquipment(){return this.offhand?.clone();},setEquipment(slot,item){calls.push(['offhand',slot]);this.offhand=item.clone();return true;}};
 const player={typeId:'minecraft:player',selectedSlotIndex:4,mode:'Survival',location:{x:1,y:80,z:2},getGameMode(){calls.push(['mode']);return this.mode;},getComponent:id=>id==='minecraft:inventory'?{container:inventory}:id==='minecraft:equippable'?equipment:undefined,addEffect(...args){calls.push(['effect',...args]);},dimension:{playSound(...args){calls.push(['sound',...args]);},spawnItem(item,at){calls.push(['drop',item.typeId,item.amount,{...at}]);return {};}}};
 slots[4]=new Stack('kaleidoscope_world_liquor:'+id,amount,'retained source name');
 const event={source:player,itemStack:slots[4].clone()};let draws=0;
 return {player,slots,inventory,equipment,event,calls,options:{createStack,rng:()=>{draws++;return .5;},worldRng:()=>.5},get draws(){return draws;}};
}
test('completion emits the source two sounds before effects, with three world draws separate from entity draws',()=>{
 const f=fixture(),trace=[],rolls=[0,.75,.25];f.options.worldRng=()=>{trace.push('world');return rolls.shift();};f.options.rng=()=>{trace.push('entity');return .5;};completeBottledDrink(f.event,f.options);
 assert.deepEqual(trace,['world','world','world','entity','entity']);assert.deepEqual(f.calls.slice(0,2),[
  ['sound','kaleidoscope_world_liquor.java.burp',{x:1,y:80,z:2},{volume:.5,pitch:Math.fround(.9)}],
  ['sound','kaleidoscope_world_liquor.java.eating',{x:1,y:80,z:2},{volume:1,pitch:Math.fround(1.2)}],
 ]);assert.equal(f.calls[2][0],'effect');
});
test('second sound keeps the original world but observes fresh coordinates; cosmetic errors do not cancel consumption',()=>{
 const f=fixture(),original=f.player.dimension;original.playSound=(id,at)=>{f.calls.push([id,{...at}]);f.player.location={x:2,y:90,z:3};f.player.dimension={playSound(){throw Error('wrong world');}};};bottledCompletionAudio(f.player,original,()=>.5);assert.deepEqual(f.calls[1][1],{x:2,y:90,z:3});
 const rejected=fixture();rejected.player.dimension.playSound=()=>{throw Error('sound transport rejected');};assert.equal(completeBottledDrink(rejected.event,rejected.options).status,'COMPLETED');assert.equal(rejected.slots[0].typeId,'minecraft:glass_bottle');
 assert.equal(burpPitch(0),Math.fround(.9));assert.equal(eatingPitch(0,0),1);assert.throws(()=>eatingPitch(1,0),/INVALID_RNG/);
});
test('registered completed-use callback dispatches original effects before all inventory writes',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 let startup;const registered=new Map(),context=vm.createContext({completeBottledDrink,traceFoodPhase,ItemStack:Stack,NS:'kaleidoscope_world_liquor',registerFurniture(){},system:{beforeEvents:{startup:{subscribe:fn=>startup=fn}}},world:{afterEvents:{worldLoad:{subscribe(){}}}}});vm.runInContext(source,context);
 startup({itemComponentRegistry:{registerCustomComponent:(id,handlers)=>registered.set(id,handlers)}});
 for(const [id,expected]of [['cola',['haste','speed']],['tonic_water',['regeneration']]]){
  const f=fixture(id);registered.get('kaleidoscope_world_liquor:consume').onCompleteUse(f.event);
  assert.deepEqual(f.calls.filter(row=>row[0]==='effect').map(row=>row.slice(1)),expected.map(effect=>[effect,300,{amplifier:0,showParticles:true}]));
  const lastEffect=f.calls.findLastIndex(row=>row[0]==='effect'),firstWrite=f.calls.findIndex(row=>row[0]==='write');assert.ok(lastEffect<firstWrite);
  assert.equal(f.slots[4],undefined);assert.equal(f.slots[0].typeId,'minecraft:glass_bottle');
 }
});
test('each food effect still consumes one source nextFloat draw, including probability one',()=>{
 for(const [id,n]of [['cola',2],['tonic_water',1]]){const f=fixture(id);assert.equal(completeBottledDrink(f.event,f.options).status,'COMPLETED');assert.equal(f.draws,n);}
});
test('shaker input carries every original cola/tonic food effect into mixed drinks',()=>{
 for(const [id,effects]of [['cola',['minecraft:haste','minecraft:speed']],['tonic_water',['minecraft:regeneration']]]){
  const input=payload.shakerInputs.find(row=>row.item==='kaleidoscope_world_liquor:'+id);
  assert.deepEqual(input.effects,effects.map(effect=>({effect,duration:15,amplifier:0,probability:1})));
 }
});
test('Creative receives effects but neither consumes the bottle nor creates an empty one',()=>{
 const f=fixture();f.player.mode='Creative';const result=completeBottledDrink(f.event,f.options);
 assert.equal(result.delivery,'CREATIVE');assert.equal(f.slots[4].amount,1);assert.equal(f.calls.some(row=>['write','offhand','drop'].includes(row[0])),false);assert.equal(f.draws,2);
});
test('effect-side mode and selected-hand changes are read at their actual later phases',()=>{
 const f=fixture('cola',3);f.player.addEffect=(...args)=>{f.calls.push(['effect',...args]);f.player.selectedSlotIndex=2;f.slots[2]=new Stack('minecraft:glass_bottle',10);};
 completeBottledDrink(f.event,f.options);assert.equal(f.slots[4].amount,2);assert.equal(f.slots[4].nameTag,'retained source name');assert.equal(f.slots[2].amount,11);
 for(const [before,after]of [['Creative','Survival'],['Survival','Creative']]){const f=fixture();f.player.mode=before;f.player.addEffect=()=>f.player.mode=after;completeBottledDrink(f.event,f.options);assert.equal(f.slots[4]?.amount,after==='Creative'?1:undefined);assert.equal(f.slots[0]?.typeId,after==='Survival'?'minecraft:glass_bottle':undefined);}
});
test('bottle insertion follows selected/offhand/main merge priority before a free main slot',()=>{
 const selected=fixture();selected.slots[4]=new Stack('minecraft:glass_bottle',4);selected.equipment.offhand=new Stack('minecraft:glass_bottle',5);selected.slots[0]=new Stack('minecraft:glass_bottle',6);giveGlassBottle(selected.player,createStack);assert.equal(selected.slots[4].amount,5);assert.equal(selected.equipment.offhand.amount,5);
 const offhand=fixture();offhand.equipment.offhand=new Stack('minecraft:glass_bottle',5);offhand.slots[0]=new Stack('minecraft:glass_bottle',6);giveGlassBottle(offhand.player,createStack);assert.equal(offhand.equipment.offhand.amount,6);assert.equal(offhand.slots[0].amount,6);
 const main=fixture();main.slots[7]=new Stack('minecraft:glass_bottle',5);giveGlassBottle(main.player,createStack);assert.equal(main.slots[7].amount,6);assert.equal(main.slots[0],undefined);
 const custom=fixture();custom.slots[0]=new Stack('minecraft:glass_bottle',5,'foreign name');giveGlassBottle(custom.player,createStack);assert.equal(custom.slots[0].amount,5);assert.equal(custom.slots[1].typeId,'minecraft:glass_bottle');
});
test('full inventory preserves one debit and one dropped remainder, while a last bottle frees a slot',()=>{
 for(const amount of [1,2]){const f=fixture('cola',amount);for(let slot=0;slot<9;slot++)if(slot!==4)f.slots[slot]=new Stack('minecraft:stone',64);completeBottledDrink(f.event,f.options);assert.equal(f.calls.filter(row=>row[0]==='drop').length,amount===1?0:1);assert.equal(f.slots[4]?.typeId,amount===1?'minecraft:glass_bottle':'kaleidoscope_world_liquor:cola');if(amount===2)assert.equal(f.slots[4].amount,1);}
});
test('changed completion entry is rejected before effects; changed origin after effects is not overwritten',()=>{
 const entry=fixture();entry.slots[4].amount=2;assert.equal(completeBottledDrink(entry.event,entry.options).status,'UNRESOLVED_ENTRY');assert.equal(entry.calls.length,0);
 const origin=fixture();origin.player.addEffect=()=>origin.slots[4]=new Stack('minecraft:diamond',3);assert.equal(completeBottledDrink(origin.event,origin.options).status,'UNRESOLVED_ORIGINAL_STACK');assert.equal(origin.slots[4].typeId,'minecraft:diamond');assert.equal(origin.calls.some(row=>row[0]==='write'),false);
});
