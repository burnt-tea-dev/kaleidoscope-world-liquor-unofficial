import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import * as motionRules from '../runtime/BP/scripts/motion-source.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
import {installJavaRespawn} from '../runtime/BP/scripts/respawn-adapter.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isVanillaCrit,doubleDamageChance,javaFloatRoll,javaDamageProduct,tequilaDamageCap,isMeleeSource} from '../runtime/BP/scripts/combat-source.js';
// Runs production callbacks against deterministic API fixtures; no simulated players.
const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
function fixture(){
 const events={},impulses=[],state={multi_jump:{amplifier:0}},subscriptions=()=>({subscribe:f=>{}});
 let chest,pressed=false;
 const actor={location:{x:0,y:70,z:0},getRotation:()=>({y:0}),dimension:{getBlock:()=>({typeId:'minecraft:air'})},inputInfo:{getButtonState:()=>pressed?'Pressed':'Released'},id:'fixture',typeId:'minecraft:player',isOnGround:false,isClimbing:false,getVelocity:()=>({x:0,y:-.2,z:0}),getEffect:()=>undefined,getComponent:id=>id==='minecraft:health'?{currentValue:20}:id==='minecraft:equippable'?{getEquipment:()=>chest}:undefined,applyImpulse:i=>impulses.push(i)};
 const world={getAllPlayers:()=>[actor],beforeEvents:{playerInteractWithBlock:subscriptions(),entityHurt:{subscribe:f=>events.hurt=f}},afterEvents:{entityHurt:subscriptions(),entityRemove:subscriptions(),playerSpawn:subscriptions(),playerLeave:subscriptions(),playerButtonInput:{subscribe:f=>events.jump=f},entityDie:subscriptions(),playerBreakBlock:subscriptions()}};
 const ctx=vm.createContext({installJavaRespawn,getTavernEffectEntities:()=>[],AcceptedHurtFeedback,CriticalFeedback:class{queue(){} applied(){}},MolangVariableMap:class{},...motionRules,lavaContact:()=>false,JavaKillCredit,damageCreditMutation,isLivingCombatEntity,world,readTavernEffects:e=>e===actor?state:{},isVanillaCrit,doubleDamageChance,javaFloatRoll,javaDamageProduct,tequilaDamageCap,isMeleeSource,system:{afterEvents:{scriptEventReceive:subscriptions()},runInterval(){},currentTick:1},EffectTypes:{},ItemStack:class{}});vm.runInContext(source+'\ninstallEffects();',ctx);
 const tick=()=>vm.runInContext('tick()',ctx),jump=()=>{pressed=true;tick();pressed=false;tick();};
 return {actor,state,impulses,events,tick,jump,world,press:value=>pressed=value,equip:(damage=0)=>chest={typeId:'minecraft:elytra',getComponent:()=>({damage,maxDurability:432})}};
}
test('multi-jump protects falling, not unrelated damage, and expires normally',()=>{const f=fixture();const hit=cause=>({hurtEntity:f.actor,damage:5,damageSource:{cause}});let e=hit('fall');f.events.hurt(e);assert.equal(e.cancel,true);e=hit('fire');f.events.hurt(e);assert.notEqual(e.cancel,true);delete f.state.multi_jump;e=hit('fall');f.events.hurt(e);assert.notEqual(e.cancel,true);});
test('reverse gravity retains fall protection',()=>{const f=fixture();delete f.state.multi_jump;f.state.reverse_gravity={amplifier:0};const e={hurtEntity:f.actor,damageSource:{cause:'fall'}};f.events.hurt(e);assert.equal(e.cancel,true);});
test('airborne acquisition does not grant jumps until ground or climb contact',()=>{const f=fixture();f.jump();assert.equal(f.impulses.length,0);f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.jump();f.jump();assert.equal(f.impulses.length,1);});
test('climbing replenishes the Java jump allowance',()=>{const f=fixture();f.actor.isClimbing=true;f.tick();f.actor.isClimbing=false;f.jump();f.jump();assert.equal(f.impulses.length,1);f.actor.isClimbing=true;f.tick();f.actor.isClimbing=false;f.jump();assert.equal(f.impulses.length,2);});
test('amplifier controls allowance and expiration discards old allowance',()=>{const f=fixture();f.state.multi_jump.amplifier=2;f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;for(let i=0;i<4;i++)f.jump();assert.equal(f.impulses.length,3);delete f.state.multi_jump;f.tick();f.state.multi_jump={amplifier:2};f.jump();assert.equal(f.impulses.length,3);});
test('usable worn elytra suppresses multi-jump even before gliding; broken does not',()=>{const f=fixture();f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.equip(430);f.jump();assert.equal(f.impulses.length,0);f.equip(431);f.jump();assert.equal(f.impulses.length,1);});
test('unmounted riding component permits multi-jump; an actual passenger cannot jump',()=>{const f=fixture();f.actor.getComponent=id=>id==='minecraft:riding'?{entityRidingOn:undefined}:undefined;f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.jump();assert.equal(f.impulses.length,1);f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.actor.getComponent=id=>id==='minecraft:riding'?{entityRidingOn:{typeId:'minecraft:boat'}}:undefined;f.jump();assert.equal(f.impulses.length,1);});

test('a rising held press does not become a falling jump until released and pressed again',()=>{
 const f=fixture();f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;
 f.actor.getVelocity=()=>({x:0,y:.2,z:0});f.press(true);f.tick();assert.equal(f.impulses.length,0);
 f.actor.getVelocity=()=>({x:0,y:-.2,z:0});f.tick();assert.equal(f.impulses.length,0);
 f.press(false);f.tick();f.press(true);f.tick();assert.equal(f.impulses.length,1);
});
test('water, levitation and creative flight reject air jumps without spending allowance',()=>{
 for(const flag of ['water','levitation','flying']){const f=fixture();f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;
  if(flag==='water')f.actor.isInWater=true;if(flag==='levitation')f.actor.getEffect=()=>({amplifier:0});if(flag==='flying')f.actor.isFlying=true;
  f.jump();assert.equal(f.impulses.length,0);
  f.actor.isInWater=false;f.actor.getEffect=()=>undefined;f.actor.isFlying=false;f.jump();assert.equal(f.impulses.length,1);
 }
});
test('reverse multi-jump uses rising motion as source falling and replaces the vertical velocity',()=>{
 const f=fixture();f.state.reverse_gravity={amplifier:0};f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;
 f.actor.getVelocity=()=>({x:0,y:.2,z:0});f.impulses.length=0;f.press(true);f.tick();assert.equal(f.impulses.length,1);assert.ok(f.impulses[0].y<-.5);
});
test('a passenger effect and forward input cannot apply a second boating multiplier',()=>{
 const f=fixture();delete f.state.multi_jump;f.state.boating_master={amplifier:0};const impulses=[];
 const passenger={id:'passenger',getVelocity:()=>({x:0,y:0,z:0}),getEffect:()=>undefined,inputInfo:{getMovementVector:()=>({x:0,y:1})}};
 const boat={getVelocity:()=>({x:.3,y:.17,z:0}),applyImpulse:i=>impulses.push(i),getComponent:id=>id==='minecraft:type_family'?{hasTypeFamily:family=>family==='boat'}:{controllingSeat:0,getRiders:()=>[f.actor,passenger]}};
 f.actor.getComponent=passenger.getComponent=()=>({entityRidingOn:boat});f.actor.inputInfo.getMovementVector=()=>({x:0,y:1});
 f.world.getAllPlayers=()=>[f.actor,passenger];f.tick();assert.equal(impulses.length,1);assert.equal(impulses[0].y,0);assert.equal(impulses[0].x,.3*Math.fround(1.3)-.3);
});
