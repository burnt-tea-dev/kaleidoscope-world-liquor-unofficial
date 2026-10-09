import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
import * as rules from '../runtime/BP/scripts/combat-source.js';
const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
function production(){
 const pending=[],sounds=[],initial={id:'overworld',playSound:(...args)=>sounds.push(args)},actor={id:'source',typeId:'minecraft:player',location:{x:1,y:2,z:3},dimension:initial,getComponent:id=>id==='minecraft:health'?{currentValue:20}:undefined},target={id:'target',typeId:'minecraft:player',getComponent:()=>({currentValue:20})};
 const ctx=vm.createContext({...rules,AcceptedHurtFeedback,JavaKillCredit,damageCreditMutation,isLivingCombatEntity,CriticalFeedback:class{queue(){}},MolangVariableMap:class{},world:{getEntity:()=>actor},system:{currentTick:0,run:fn=>pending.push(fn)},readTavernEffects:e=>e===actor?{elbow_strike:{amplifier:0}}:{},EffectTypes:{},ItemStack:class{}});vm.runInContext(source,ctx);
 const event={hurtEntity:target,damage:4,cancel:false,damageSource:{cause:'entityAttack',damagingEntity:actor}};ctx.event=event;vm.runInContext('hurt(event)',ctx);
 return {ctx,event,actor,sounds,ack:()=>vm.runInContext('acceptedFeedback.applied(event)',ctx),settle:()=>pending.splice(0).forEach(fn=>fn())};
}
test('production elbow sound remains silent after later cancellation or native rejection',()=>{
 for(const mode of ['later-cancel','native-reject']){const f=production();if(mode==='later-cancel'){f.ack();f.event.cancel=true;}f.settle();assert.equal(f.sounds.length,0);assert.equal(vm.runInContext('acceptedFeedback.pending.size',f.ctx),0);}
});
test('accepted sound preserves source position, dimension and exact options after the actor moves',()=>{
 const f=production();f.ack();f.actor.location={x:20,y:30,z:40};f.actor.dimension={id:'nether',playSound(){throw Error('wrong dimension');}};f.settle();assert.equal(f.sounds.length,1);assert.equal(f.sounds[0][0],'kaleidoscope_world_liquor.ice_tea_eat');assert.deepEqual({...f.sounds[0][1]},{x:1,y:2,z:3});assert.deepEqual({...f.sounds[0][2]},{volume:.6,pitch:1});
});
test('shared native acknowledgement delivers all source callbacks and isolates a cosmetic failure',()=>{
 const run=[],calls=[],errors=[],queue=new AcceptedHurtFeedback({run:fn=>run.push(fn)},{report:error=>errors.push(String(error))}),event={hurtEntity:{id:'victim'},damage:3,cancel:false,damageSource:{cause:'entityAttack',damagingEntity:{id:'A'}}};
 queue.queue(event,ok=>{if(ok)calls.push('sound');});queue.queue(event,()=>{throw Error('effect failure');});queue.queue(event,ok=>{if(ok)calls.push('particle');});assert.equal(run.length,1);
 queue.applied({...event,damageSource:{...event.damageSource,damagingEntity:{id:'B'}}});assert.equal(queue.pending.get('victim')[0].accepted,false);
 event.damage=6;queue.applied({...event,damage:6});run.splice(0).forEach(fn=>fn());assert.deepEqual(calls,['sound','particle']);assert.equal(errors.length,1);assert.equal(queue.pending.size,0);
});
