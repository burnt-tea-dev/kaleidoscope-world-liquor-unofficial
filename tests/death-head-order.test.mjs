import test from 'node:test';
import assert from 'node:assert/strict';
import {BEHEADED_MARKER} from '../runtime/BP/scripts/beheading.js';
import {installDeathDrops} from '../runtime/BP/scripts/treasure-drops.js';

class Stack{
 constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;this.lore=[];}
 clone(){const row=new Stack(this.typeId,this.amount);row.nameTag=this.nameTag;row.lore=[...this.lore];return row;}
 setLore(lore){this.lore=[...lore];}getLore(){return [...this.lore];}
 isStackableWith(other){return this.typeId===other.typeId&&this.nameTag===other.nameTag&&JSON.stringify(this.lore)===JSON.stringify(other.lore);}
}
function fixture({treasure=false,renamed=false}={}){
 const callbacks=[],timeouts=[],spawned=[];
 const world={afterEvents:{entityItemDrop:{subscribe:fn=>callbacks.push(fn)},entityRemove:{subscribe(){}}},getLootTableManager:()=>({generateLootFromEntity:()=>[head]})};
 const system={run(){},runTimeout:fn=>timeouts.push(fn)};
 const head=new Stack('minecraft:wither_skeleton_skull');if(renamed){head.nameTag='Luck trophy';head.setLore(['Keep source metadata']);}
 const source={id:'source',getComponent:()=>undefined},properties=new Map([[BEHEADED_MARKER,true]]);
 const target={id:'target',typeId:'minecraft:wither_skeleton',location:{x:1,y:2,z:3},getDynamicProperty:key=>properties.get(key),setDynamicProperty:(key,value)=>properties.set(key,value),dimension:{spawnItem(stack,at){spawned.push({stack,at});return {id:'item'};}}};
 const drops=installDeathDrops(world,system,{read:actor=>actor===source?{luck:{amplifier:0},...(treasure?{treasure_guide:{amplifier:0}}:{})}:{},killCredit:{state:()=>({})},createStack:(id,amount)=>new Stack(id,amount),lookup:()=>undefined,random:()=>0});
 const death={deadEntity:target,damageSource:{damagingEntity:source}};
 drops.death(death);
 const original={entity:target,items:{0:{location:target.location,getComponent:()=>({itemStack:new Stack('minecraft:bone',2)})},length:1}};
 for(const callback of callbacks)callback(original);
 for(const callback of callbacks)callback(original);
 timeouts.forEach(fn=>fn());
 return {spawned,head};
}
test('a matching skull added by the real Luck drop callback prevents another beheading skull',()=>{
 const {spawned}=fixture();
 assert.deepEqual(spawned.map(({stack})=>[stack.typeId,stack.amount]),[['minecraft:wither_skeleton_skull',1]]);
});
test('Treasure copies the Luck skull once and beheading sees that matching skull',()=>{
 const {spawned}=fixture({treasure:true});
 assert.equal(spawned.filter(({stack})=>stack.typeId==='minecraft:wither_skeleton_skull').reduce((sum,{stack})=>sum+stack.amount,0),2);
});
test('a renamed Luck skull keeps its metadata and does not suppress the distinct default beheading skull',()=>{
 const {spawned,head}=fixture({renamed:true}),skulls=spawned.filter(({stack})=>stack.typeId==='minecraft:wither_skeleton_skull');
 assert.equal(skulls.length,2);const trophy=skulls.find(({stack})=>stack.nameTag==='Luck trophy');assert.deepEqual(trophy.stack.getLore(),head.getLore());
 assert.equal(skulls.filter(({stack})=>stack.nameTag===undefined).length,1);
});
