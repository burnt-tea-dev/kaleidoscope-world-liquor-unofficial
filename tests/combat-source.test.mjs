import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as rules from '../runtime/BP/scripts/combat-source.js';
import {useSoundPulse} from '../runtime/BP/scripts/drink-audio.js';
const rows=fs.readFileSync(new URL('./fixtures/java-use-combat.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('ground crit eligibility, damage caps and use pulses agree with Java source evaluation',()=>{
 for(const r of rows){
  if(r.kind==='crit'){
   const p={isOnGround:!!(r.flags&1),isClimbing:!!(r.flags&2),isInWater:!!(r.flags&4),getEffect:()=>r.flags&8,getComponent:()=>({entityRidingOn:r.flags&16?{}:undefined}),getVelocity:()=>({y:r.y})};
   assert.equal(rules.isVanillaCrit(p),r.expected,JSON.stringify(r));
  }else if(r.kind==='damage'){
   assert.equal(rules.tequilaDamageCap(Math.fround(r.health),r.amplifier),Math.fround(r.cap));
   assert.equal(rules.doubleDamageChance(r.amplifier),Math.fround(r.chance));
  }else assert.equal(useSoundPulse(r.duration,r.remaining),r.expected);
 }
 assert.equal(rows.filter(r=>r.kind==='crit').length,96);
});
test('an exposed unmounted riding component is not a Java passenger',()=>{
 const p={isOnGround:false,isClimbing:false,isInWater:false,getEffect:()=>undefined,getComponent:()=>({entityRidingOn:undefined}),getVelocity:()=>({y:-.1})};
 assert.equal(rules.isVanillaCrit(p),true);p.getComponent=()=>({entityRidingOn:{}});assert.equal(rules.isVanillaCrit(p),false);
});
test('projectile owners and explosions are excluded from the original melee predicate',()=>{
 const actor={};assert.equal(rules.isMeleeSource({damagingEntity:actor,cause:'entityAttack'}),true);
 for(const cause of ['projectile','entityExplosion','blockExplosion','fireworks'])assert.equal(rules.isMeleeSource({damagingEntity:actor,cause}),false);
 assert.equal(rules.isMeleeSource({damagingEntity:actor,cause:'entityAttack',damagingProjectile:{}}),false);
 assert.equal(rules.isMeleeSource({cause:'entityAttack'}),false);
});
test('production callback applies source conditions and the 0.6-volume elbow sound',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const states=new Map(),sounds=[],pending=[];
 const actor={id:'numeric API fixture',typeId:'minecraft:player',isOnGround:false,isClimbing:true,isInWater:false,getEffect:()=>undefined,getComponent:()=>undefined,getVelocity:()=>({y:-.2}),location:{x:1,y:2,z:3},dimension:{playSound:(...args)=>sounds.push(args)}};
 const target={id:'damage API fixture',typeId:'minecraft:player',getComponent:()=>({effectiveMax:20})};states.set(actor,{ground_crit:{amplifier:0},elbow_strike:{amplifier:0}});
 const ctx=vm.createContext({AcceptedHurtFeedback,CriticalFeedback:class{queue(){} applied(){}},MolangVariableMap:class{},JavaKillCredit,damageCreditMutation,isLivingCombatEntity,...rules,readTavernEffects:e=>states.get(e)??{},world:{},system:{run:fn=>pending.push(fn)},EffectTypes:{},ItemStack:class{},Math:Object.assign(Object.create(Math),{random:()=>0})});
 vm.runInContext(source,ctx);const event={hurtEntity:target,damage:4,damageSource:{cause:'entityAttack',damagingEntity:actor}};
 ctx.event=event;vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,6);vm.runInContext('acceptedFeedback.applied(event)',ctx);pending.splice(0).forEach(fn=>fn());assert.equal(sounds.length,1);assert.equal(sounds[0][2].volume,.6);assert.equal(sounds[0][2].pitch,1);
 actor.isClimbing=false;event.damage=4;vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,4);
 actor.isClimbing=true;event.damage=4;event.damageSource.damagingProjectile={};vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,4);
});
test('respawn emits its source sound once before searching, including an unavailable destination',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const calls=[];let available=false;
 const dimension={id:'minecraft:nether',playSound:(id,at)=>calls.push(['sound',id,{...at}]),getBlock:at=>{calls.push(['search']);if(!available)return undefined;const anchor=at.x===1&&at.y===10&&at.z===3;return {typeId:anchor?'minecraft:respawn_anchor':at.y<10?'minecraft:stone':'minecraft:air',location:{...at},isWaterlogged:false,permutation:{getAllStates:()=>anchor?{respawn_anchor_charge:2}:{}}};}};
 const actor={id:'respawn API fixture',typeId:'minecraft:player',location:{x:30,y:40,z:50},dimension,getSpawnPoint:()=>({x:1,y:10,z:3,dimension}),teleport:at=>{calls.push(['teleport']);actor.location={...at};},addEffect:(...args)=>calls.push(['effect',...args])};
 const ctx=vm.createContext({applyJavaRespawn,AcceptedHurtFeedback,CriticalFeedback:class{queue(){} applied(){}},MolangVariableMap:class{},JavaKillCredit,damageCreditMutation,isLivingCombatEntity,...rules,readTavernEffects:()=>({}),world:{gameRules:{keepInventory:true}},system:{},EffectTypes:{},ItemStack:class{}});vm.runInContext(source,ctx);ctx.actor=actor;
 vm.runInContext("applyEffect(actor,'kaleidoscope_world_liquor:respawn',1)",ctx);
 assert.equal(calls[0][0],'sound');assert.equal(calls.filter(c=>c[0]==='sound').length,1);assert.equal(calls.some(c=>c[0]==='teleport'),false);
 calls.length=0;available=true;vm.runInContext("applyEffect(actor,'kaleidoscope_world_liquor:respawn',1)",ctx);
 const sounds=calls.filter(c=>c[0]==='sound');assert.equal(sounds.length,2);assert.deepEqual(sounds[0][2],{x:30,y:40,z:50});assert.deepEqual(sounds[1][2],{x:1.5,y:10,z:2.5});assert.deepEqual(calls.find(c=>c[0]==='effect'),['effect','hunger',300,{amplifier:0}]);
});
test('actual fall callback follows Player-only reverse gravity and LivingEntity multi-jump sources',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const states=new Map(),ctx=vm.createContext({AcceptedHurtFeedback,CriticalFeedback:class{},MolangVariableMap:class{},JavaKillCredit,damageCreditMutation,isLivingCombatEntity,...rules,readTavernEffects:e=>states.get(e)??{},world:{},system:{run(){}},EffectTypes:{},ItemStack:class{}});vm.runInContext(source,ctx);
 for(const type of ['minecraft:player','minecraft:zombie'])for(const effect of ['reverse_gravity','multi_jump']){
  const entity={id:type,typeId:type,getComponent:id=>id==='minecraft:health'?{currentValue:20,effectiveMax:20}:id==='minecraft:type_family'?{hasTypeFamily:family=>family==='mob'}:undefined};states.set(entity,{[effect]:{amplifier:0}});
  const event={hurtEntity:entity,damage:4,damageSource:{cause:'fall'}};ctx.event=event;vm.runInContext('hurt(event)',ctx);assert.equal(event.cancel===true,type==='minecraft:player'||effect==='multi_jump',type+'/'+effect);
 }
});
import {applyJavaRespawn} from '../runtime/BP/scripts/respawn-adapter.js';
