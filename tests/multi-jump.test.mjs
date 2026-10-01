import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Runs production callbacks against deterministic API fixtures; no simulated players.
const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
function fixture(){
 const events={},impulses=[],state={multi_jump:{amplifier:0}},subscriptions=()=>({subscribe:f=>{}});
 let chest;
 const actor={id:'fixture',isOnGround:false,isClimbing:false,getVelocity:()=>({x:0,y:-.2,z:0}),getEffect:()=>undefined,getComponent:id=>id==='minecraft:equippable'?{getEquipment:()=>chest}:undefined,applyImpulse:i=>impulses.push(i)};
 const world={getAllPlayers:()=>[actor],beforeEvents:{entityHurt:{subscribe:f=>events.hurt=f}},afterEvents:{playerSpawn:subscriptions(),playerLeave:subscriptions(),playerButtonInput:{subscribe:f=>events.jump=f},entityDie:subscriptions(),playerBreakBlock:subscriptions()}};
 const ctx=vm.createContext({world,readTavernEffects:e=>e===actor?state:{},system:{afterEvents:{scriptEventReceive:subscriptions()},runInterval(){},currentTick:1},EffectTypes:{},ItemStack:class{}});vm.runInContext(source+'\ninstallEffects();',ctx);
 const tick=()=>vm.runInContext('tick()',ctx),jump=()=>events.jump({button:'Jump',newButtonState:'Pressed',player:actor});
 return {actor,state,impulses,events,tick,jump,equip:(damage=0)=>chest={typeId:'minecraft:elytra',getComponent:()=>({damage,maxDurability:432})}};
}
test('multi-jump protects falling, not unrelated damage, and expires normally',()=>{const f=fixture();const hit=cause=>({hurtEntity:f.actor,damage:5,damageSource:{cause}});let e=hit('fall');f.events.hurt(e);assert.equal(e.cancel,true);e=hit('fire');f.events.hurt(e);assert.notEqual(e.cancel,true);delete f.state.multi_jump;e=hit('fall');f.events.hurt(e);assert.notEqual(e.cancel,true);});
test('reverse gravity retains fall protection',()=>{const f=fixture();delete f.state.multi_jump;f.state.reverse_gravity={amplifier:0};const e={hurtEntity:f.actor,damageSource:{cause:'fall'}};f.events.hurt(e);assert.equal(e.cancel,true);});
test('airborne acquisition does not grant jumps until ground or climb contact',()=>{const f=fixture();f.jump();assert.equal(f.impulses.length,0);f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.jump();f.jump();assert.equal(f.impulses.length,1);});
test('climbing replenishes the Java jump allowance',()=>{const f=fixture();f.actor.isClimbing=true;f.tick();f.actor.isClimbing=false;f.jump();f.jump();assert.equal(f.impulses.length,1);f.actor.isClimbing=true;f.tick();f.actor.isClimbing=false;f.jump();assert.equal(f.impulses.length,2);});
test('amplifier controls allowance and expiration discards old allowance',()=>{const f=fixture();f.state.multi_jump.amplifier=2;f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;for(let i=0;i<4;i++)f.jump();assert.equal(f.impulses.length,3);delete f.state.multi_jump;f.tick();f.state.multi_jump={amplifier:2};f.jump();assert.equal(f.impulses.length,3);});
test('usable worn elytra suppresses multi-jump even before gliding; broken does not',()=>{const f=fixture();f.actor.isOnGround=true;f.tick();f.actor.isOnGround=false;f.equip(430);f.jump();assert.equal(f.impulses.length,0);f.equip(431);f.jump();assert.equal(f.impulses.length,1);});
