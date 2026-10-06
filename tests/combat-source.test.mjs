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
   const p={isOnGround:!!(r.flags&1),isClimbing:!!(r.flags&2),isInWater:!!(r.flags&4),getEffect:()=>r.flags&8,getComponent:()=>r.flags&16,getVelocity:()=>({y:r.y})};
   assert.equal(rules.isVanillaCrit(p),r.expected,JSON.stringify(r));
  }else if(r.kind==='damage'){
   assert.equal(rules.tequilaDamageCap(Math.fround(r.health),r.amplifier),Math.fround(r.cap));
   assert.equal(rules.doubleDamageChance(r.amplifier),Math.fround(r.chance));
  }else assert.equal(useSoundPulse(r.duration,r.remaining),r.expected);
 }
 assert.equal(rows.filter(r=>r.kind==='crit').length,96);
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
 const target={id:'damage API fixture',getComponent:()=>({effectiveMax:20})};states.set(actor,{ground_crit:{amplifier:0},elbow_strike:{amplifier:0}});
 const ctx=vm.createContext({...rules,readTavernEffects:e=>states.get(e)??{},world:{},system:{run:fn=>pending.push(fn)},EffectTypes:{},ItemStack:class{},Math:Object.assign(Object.create(Math),{random:()=>0})});
 vm.runInContext(source,ctx);const event={hurtEntity:target,damage:4,damageSource:{cause:'entityAttack',damagingEntity:actor}};
 ctx.event=event;vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,6);pending.splice(0).forEach(fn=>fn());assert.equal(sounds.length,1);assert.equal(sounds[0][2].volume,.6);assert.equal(sounds[0][2].pitch,1);
 actor.isClimbing=false;event.damage=4;vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,4);
 actor.isClimbing=true;event.damage=4;event.damageSource.damagingProjectile={};vm.runInContext('hurt(event)',ctx);assert.equal(event.damage,4);
});
