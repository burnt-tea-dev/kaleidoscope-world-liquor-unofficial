import test from 'node:test';
import assert from 'node:assert/strict';
import {installBeheading,beheadingChance,sameHead,headFor,BEHEADED_MARKER,BOSSES,beheadingDiagnostics} from '../runtime/BP/scripts/beheading.js';

class Stack{
 constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;this.nameTag=undefined;this.lore=[];}
 clone(){const s=new Stack(this.typeId,this.amount);s.nameTag=this.nameTag;s.lore=[...this.lore];return s;}
 setLore(lore){this.lore=[...lore];} getLore(){return [...this.lore];}
 isStackableWith(other){return other?.typeId===this.typeId&&other.nameTag===this.nameTag&&JSON.stringify(other.lore)===JSON.stringify(this.lore);}
}
const lookup=id=>['minecraft:zombie_head','minecraft:skeleton_skull','minecraft:creeper_head','minecraft:wither_skeleton_skull','minecraft:piglin_head','minecraft:player_head','beasts:otter_head'].includes(id)?{id}:undefined;
const createStack=(id,amount)=>new Stack(id,amount);
function entity(id,typeId,health=20,{name}={}){
 const props=new Map(),calls=[];
 const h={currentValue:health,effectiveMax:20,setCurrentValue(v){calls.push(['health',v]);h.currentValue=v;}};
 const e={id,typeId,name,isValid:true,calls,props,location:{x:1,y:2,z:3},
  getComponent:key=>key==='minecraft:health'?h:undefined,
  getDynamicProperty:key=>props.get(key),setDynamicProperty(key,value){if(value===undefined)props.delete(key);else props.set(key,value);},
  applyDamage(amount,options){calls.push(['damage',amount,options]);h.currentValue-=amount;if(h.currentValue<=0)e.isValid=false;return true;},
  dimension:{spawnItem(stack,at){calls.push(['spawn',stack.typeId,stack.amount,{...at}]);return {id:'item'};}}};
 return e;
}
function harness(random=()=>0){
 const runs=[],timeouts=[],signals={};
 const world={afterEvents:{entityItemDrop:{subscribe:fn=>signals.drop=fn}}};
 const system={run:fn=>runs.push(fn),runTimeout:(fn,ticks)=>timeouts.push({fn,ticks})};
 const beheading=installBeheading(world,system,{createStack,lookup,random});
 return {beheading,runs,timeouts,signals,flush:()=>runs.splice(0).forEach(fn=>fn()),fire:()=>timeouts.splice(0).forEach(row=>row.fn()),drop:(actor,items)=>signals.drop({entity:actor,items:items.map(stack=>({getComponent:key=>key==='minecraft:item'?{itemStack:stack}:undefined}))})};
}
const reset=()=>{Object.assign(beheadingDiagnostics,{beheaded:0,forced:0,heads:0,deduplicated:0});beheadingDiagnostics.errors.length=0;};
const hit=(h,attacker,target,amplifier=0)=>{const event={damage:4,damageSource:{cause:'entityAttack',damagingEntity:attacker}};const beheaded=h.beheading.incoming(event,attacker,target,{amplifier});return {event,beheaded};};

test('chance is the Java double expression and the bosses tag is the three vanilla members',()=>{
 for(const amplifier of [0,1,2,4,9])assert.equal(beheadingChance(amplifier),.04+amplifier*.03);
 assert.deepEqual([...BOSSES],['minecraft:ender_dragon','minecraft:wither','minecraft:warden']);
});
test('incoming: boss, dead target and a failed roll leave the hit, the marker and the scheduler untouched',()=>{
 reset();const attacker=entity('a','minecraft:player');
 const h=harness(()=>.0399);
 for(const target of [entity('boss','minecraft:warden'),entity('dead','minecraft:zombie',0)]){const {event,beheaded}=hit(h,attacker,target);assert.equal(beheaded,false);assert.equal(event.damage,4);assert.equal(target.props.has(BEHEADED_MARKER),false);}
 const unlucky=harness(()=>.04),target=entity('t','minecraft:zombie');
 assert.equal(hit(unlucky,attacker,target).beheaded,false,'nextDouble() < 0.04 is strict');assert.equal(unlucky.runs.length,0);
 assert.equal(hit(harness(()=>.0699),attacker,target,1).beheaded,true,'amplifier 1 raises the chance to 0.07');
});
test('incoming success: persistent marker, attacker-attributed 10000 on the same hit, fallback scheduled once',()=>{
 reset();const attacker=entity('a','minecraft:player'),target=entity('t','minecraft:zombie'),h=harness();
 const {event,beheaded}=hit(h,attacker,target);
 assert.equal(beheaded,true);assert.equal(event.damage,10000);assert.equal(event.damageSource.damagingEntity,attacker);
 assert.equal(target.props.get(BEHEADED_MARKER),true);assert.equal(h.runs.length,1);assert.equal(beheadingDiagnostics.beheaded,1);
 assert.equal(target.calls.length,0,'nothing is written in the before-event itself');
});
test('fallback: a target that died needs nothing; a blocked hit is set to 1, hurt 2 by the attacker, then set to 0 if still alive',()=>{
 reset();const attacker=entity('a','minecraft:player');
 const dead=entity('dead','minecraft:zombie'),h=harness();hit(h,attacker,dead);dead.isValid=false;h.flush();assert.equal(dead.calls.length,0);
 const blocked=entity('blocked','minecraft:zombie'),g=harness();hit(g,attacker,blocked);
 blocked.applyDamage=(amount,options)=>{blocked.calls.push(['damage',amount,options]);return true;};   // the 2 damage is also blocked
 g.flush();
 assert.deepEqual(blocked.calls,[['health',1],['damage',2,{cause:'entityAttack',damagingEntity:attacker}],['health',0]]);
 assert.equal(beheadingDiagnostics.forced,1);
 const lowered=entity('lowered','minecraft:zombie'),k=harness();hit(k,attacker,lowered);lowered.getComponent('minecraft:health').currentValue=1;k.flush();
 assert.equal(lowered.calls.length,0,'health that dropped (totem) is left alone');assert.equal(lowered.props.get(BEHEADED_MARKER),true,'Java keeps the marker on a survivor');
});
test('fallback: the inner hurt cannot roll a second beheading on the same target (BEHEADING_PROCESSING)',()=>{
 const attacker=entity('a','minecraft:player'),target=entity('t','minecraft:zombie'),h=harness();
 hit(h,attacker,target);
 target.applyDamage=(amount,options)=>{target.calls.push(['damage',amount,options]);const inner={damage:amount,damageSource:options};const again=h.beheading.incoming(inner,attacker,target,{amplifier:9});target.calls.push(['reentry',again,inner.damage]);return true;};
 h.flush();
 assert.deepEqual(target.calls.find(row=>row[0]==='reentry'),['reentry',false,2]);
 assert.equal(h.runs.length,0,'no second fallback was scheduled');
 const after=entity('u','minecraft:zombie');assert.equal(hit(h,attacker,after).beheaded,true,'other targets roll normally afterwards');
});
test('death without the marker does nothing; a marked death clears the marker and waits for the native drop list',()=>{
 reset();const h=harness(),plain=entity('p','minecraft:zombie');
 assert.equal(h.beheading.death({deadEntity:plain}),false);assert.equal(h.timeouts.length,0);
 const marked=entity('m','minecraft:zombie');marked.props.set(BEHEADED_MARKER,true);
 assert.equal(h.beheading.death({deadEntity:marked}),true);assert.equal(marked.props.has(BEHEADED_MARKER),false);
 assert.equal(h.timeouts.length,1);assert.equal(h.timeouts[0].ticks,2);assert.equal(marked.calls.length,0);
});
test('drop list without a head: one head is spawned at the death position; the later timeout does not add another',()=>{
 reset();const h=harness(),m=entity('m','minecraft:zombie');m.props.set(BEHEADED_MARKER,true);h.beheading.death({deadEntity:m});m.location={x:9,y:9,z:9};
 h.drop(m,[new Stack('minecraft:rotten_flesh',2)]);
 assert.deepEqual(m.calls,[['spawn','minecraft:zombie_head',1,{x:1,y:2,z:3}]]);
 h.fire();assert.equal(m.calls.length,1);assert.equal(beheadingDiagnostics.heads,1);
});
test('drop list already holding the same head: nothing is added (isSameItemSameComponents); a renamed head does not count',()=>{
 reset();const h=harness(),m=entity('m','minecraft:wither_skeleton');m.props.set(BEHEADED_MARKER,true);h.beheading.death({deadEntity:m});
 h.drop(m,[new Stack('minecraft:bone'),new Stack('minecraft:wither_skeleton_skull')]);h.fire();
 assert.equal(m.calls.length,0);assert.equal(beheadingDiagnostics.deduplicated,1);
 const r=entity('r','minecraft:wither_skeleton');r.props.set(BEHEADED_MARKER,true);h.beheading.death({deadEntity:r});
 const renamed=new Stack('minecraft:wither_skeleton_skull');renamed.nameTag='trophy';h.drop(r,[renamed]);
 assert.equal(r.calls.length,1);assert.equal(sameHead(renamed,new Stack('minecraft:wither_skeleton_skull')),false);
});
test('no drop list at all (entity with no drops): the head is spawned two ticks later; a late drop list is ignored',()=>{
 reset();const h=harness(),m=entity('m','minecraft:zombie');m.props.set(BEHEADED_MARKER,true);h.beheading.death({deadEntity:m});
 h.fire();assert.equal(m.calls.length,1);
 h.drop(m,[new Stack('minecraft:rotten_flesh')]);assert.equal(m.calls.length,1);
 h.drop(entity('x','minecraft:zombie'),[]);assert.equal(m.calls.length,1,'unrelated drop lists are ignored');
});
test('player victims drop a player head carrying the owner as name and lore; mobs without any head drop nothing',()=>{
 const h=harness(),player=entity('p','minecraft:player',20,{name:'Steve'});player.props.set(BEHEADED_MARKER,true);
 assert.equal(h.beheading.death({deadEntity:player}),true);h.fire();
 const [,typeId]=player.calls[0];assert.equal(typeId,'minecraft:player_head');
 const head=headFor(player,{createStack,lookup});assert.equal(head.nameTag,"Steve's Head");assert.deepEqual(head.getLore(),['SkullOwner: Steve']);
 const pig=entity('pig','minecraft:pig');pig.props.set(BEHEADED_MARKER,true);
 assert.equal(h.beheading.death({deadEntity:pig}),false);assert.equal(pig.props.has(BEHEADED_MARKER),false);h.fire();assert.equal(pig.calls.length,0);
 const otter=entity('o','beasts:otter');otter.props.set(BEHEADED_MARKER,true);assert.equal(h.beheading.death({deadEntity:otter}),true);h.fire();assert.equal(otter.calls[0][1],'beasts:otter_head');
});
test('the marker survives a restart: a fresh install still drops the head for an entity marked earlier',()=>{
 const attacker=entity('a','minecraft:player'),target=entity('t','minecraft:creeper'),first=harness();
 hit(first,attacker,target);target.isValid=false;first.flush();
 const later=harness();later.beheading.death({deadEntity:target});later.drop(target,[new Stack('minecraft:gunpowder')]);
 assert.deepEqual(target.calls.at(-1),['spawn','minecraft:creeper_head',1,{x:1,y:2,z:3}]);
});
test('a rejected head spawn is recorded once and never retried',()=>{
 reset();const h=harness(),m=entity('m','minecraft:zombie');m.props.set(BEHEADED_MARKER,true);m.dimension.spawnItem=()=>undefined;
 h.beheading.death({deadEntity:m});h.drop(m,[]);h.fire();
 assert.equal(beheadingDiagnostics.errors.length,1);assert.match(beheadingDiagnostics.errors[0].error,/HEAD_DROP_REJECTED/);assert.equal(beheadingDiagnostics.heads,0);
});
