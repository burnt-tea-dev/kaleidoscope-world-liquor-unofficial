import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {completeBottledDrink,giveGlassBottle} from '../runtime/BP/scripts/bottled-drink.js';
import {payload} from '../runtime/BP/scripts/payload.js';
class Stack{
 constructor(typeId,amount=1,nameTag=''){this.typeId=typeId;this.amount=amount;this.nameTag=nameTag;this.maxAmount=typeId==='minecraft:glass_bottle'?64:16;}
 clone(){return new Stack(this.typeId,this.amount,this.nameTag);}
 isStackableWith(other){return other?.typeId===this.typeId&&other.nameTag===this.nameTag;}
}
const createStack=(id,count)=>new Stack(id,count);
function fixture(id='cola',amount=1){
 const calls=[],slots=Array(9),inventory={size:9,getItem:slot=>slots[slot]?.clone(),setItem(slot,stack){calls.push(['write',slot,stack?.typeId,stack?.amount]);slots[slot]=stack?.clone();}};
 const equipment={offhand:undefined,getEquipment(){return this.offhand?.clone();},setEquipment(slot,item){calls.push(['offhand',slot]);this.offhand=item.clone();return true;}};
 const player={typeId:'minecraft:player',selectedSlotIndex:4,mode:'Survival',location:{x:1,y:80,z:2},getGameMode(){calls.push(['mode']);return this.mode;},getComponent:id=>id==='minecraft:inventory'?{container:inventory}:id==='minecraft:equippable'?equipment:undefined,addEffect(...args){calls.push(['effect',...args]);},dimension:{spawnItem(item,at){calls.push(['drop',item.typeId,item.amount,{...at}]);return {};}}};
 slots[4]=new Stack('kaleidoscope_world_liquor:'+id,amount,'retained source name');
 const event={source:player,itemStack:slots[4].clone()};let draws=0;
 return {player,slots,inventory,equipment,event,calls,options:{createStack,rng:()=>{draws++;return .5;}},get draws(){return draws;}};
}
test('registered completed-use callback dispatches original effects before all inventory writes',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 let startup;const registered=new Map(),context=vm.createContext({completeBottledDrink,ItemStack:Stack,NS:'kaleidoscope_world_liquor',registerFurniture(){},system:{beforeEvents:{startup:{subscribe:fn=>startup=fn}}},world:{afterEvents:{worldLoad:{subscribe(){}}}}});vm.runInContext(source,context);
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
