import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Deterministic production-function fixtures; not simulated players or client acceptance.
const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
const ctx=vm.createContext({world:{},system:{},EffectTypes:{getAll:()=>['speed','strength']},ItemStack:class{}});
vm.runInContext(source,ctx);
const find=(center,safe)=>ctx.findRespawnPosition(center,safe);
const center={x:10,y:64,z:-8};
const plain=x=>JSON.parse(JSON.stringify(x));
test('respawn center is tested once before rings',()=>{const seen=[];assert.deepEqual(find(center,p=>(seen.push(p),true)),center);assert.equal(seen.length,1);});
test('respawn perimeter order is north east south west without repeated corners',()=>{const seen=[];find(center,p=>(seen.push(plain(p)),false));assert.equal(seen.length,337);assert.equal(new Set(seen.map(p=>JSON.stringify(p))).size,337);assert.deepEqual(seen.slice(1,9).map(p=>[p.x-center.x,p.z-center.z]),[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]);assert.equal(seen.filter(p=>p.x===center.x&&p.z===center.z).length,1);});
test('respawn searches all rings at same height then down before up',()=>{const chosen=find(center,p=>p.x===9&&p.z===-9&&[63,65].includes(p.y));assert.equal(chosen.y,63);const seen=[];find(center,p=>(seen.push(p.y),false));assert.deepEqual([...new Set(seen)],[64,63,62,61,65,66,67]);});
test('respawn returns original center when no candidate is safe, like Java',()=>assert.equal(find(center,()=>false),center));
function respawnFixture({cross=false,liquid=false,failSound=false,unloaded=false}={}){
 const calls=[];
 const destination={id:'minecraft:overworld',getBlock(p){if(unloaded)throw Error('unloaded');return {isAir:p.y>=64,isLiquid:liquid&&p.y===63,isSolid:!liquid&&p.y===63}},playSound(s,at,options){calls.push(['sound',s,{...at},{...options}]);if(failSound)throw Error('sound');}};
 const origin=cross?{id:'minecraft:nether',playSound:destination.playSound}:destination;
 const actor={dimension:origin,location:{x:1,y:5,z:2},getSpawnPoint:()=>({...center,dimension:destination}),getRotation:()=>({x:15,y:40}),teleport(at,options){calls.push(['teleport',{...at},{...options}]);this.dimension=options.dimension;this.location=at;},addEffect(...args){calls.push(['effect',...args]);}};
 return {actor,calls,destination};
}
test('respawn recognizes liquid support and plays both endpoints with hunger',()=>{const f=respawnFixture({liquid:true,cross:true});ctx.safeRespawn(f.actor);assert.deepEqual(f.calls.map(c=>c[0]),['sound','teleport','sound','effect']);assert.equal(f.calls[0][1],'entity.player.teleport');assert.deepEqual(f.calls[0][2],{x:1,y:5,z:2});assert.deepEqual(f.calls[1][1],{x:10.5,y:64,z:-7.5});assert.equal(f.calls[1][2].keepVelocity,false);assert.deepEqual(plain(f.calls[1][2].rotation),{x:15,y:40});assert.deepEqual(plain(f.calls[3]),['effect','hunger',300,{amplifier:0}]);});
test('same-dimension respawn retains velocity; cosmetic sound errors do not cancel teleport',()=>{const f=respawnFixture({failSound:true});ctx.safeRespawn(f.actor);assert.equal(f.calls.find(c=>c[0]==='teleport')[2].keepVelocity,true);assert.equal(f.calls.filter(c=>c[0]==='effect').length,1);});
test('unloaded reads use bounded Java fallback, not unbounded scanning',()=>{const f=respawnFixture({unloaded:true});ctx.safeRespawn(f.actor);assert.deepEqual(f.calls.find(c=>c[0]==='teleport')[1],{x:10.5,y:64,z:-7.5});});
test('ground crit permits climb blindness and riding but excludes normal falling crit',()=>{
 const p={isOnGround:false,isClimbing:false,isInWater:false,getEffect:()=>undefined,getComponent:()=>undefined,getVelocity:()=>({y:-.1})};assert.equal(ctx.canRollGroundCrit(p),false);
 for(const name of ['isOnGround','isClimbing','isInWater']){p[name]=true;assert.equal(ctx.canRollGroundCrit(p),true);p[name]=false;}
 p.getEffect=()=>({});assert.equal(ctx.canRollGroundCrit(p),true);p.getEffect=()=>undefined;p.getComponent=()=>({entityRidingOn:{}});assert.equal(ctx.canRollGroundCrit(p),true);p.getComponent=()=>undefined;p.getVelocity=()=>({y:0});assert.equal(ctx.canRollGroundCrit(p),true);
});
test('crazy keeps 200 ticks and amplifier, with exact Java beacon pitch',()=>{const effects=[],sounds=[];const p={addEffect:(...a)=>effects.push(a),dimension:{playSound:(...a)=>sounds.push(a)},location:{x:0,y:0,z:0}};ctx.applyEffect(p,'kaleidoscope_world_liquor:crazy',1,2);assert.deepEqual(plain(effects),[['speed',200,{amplifier:2,showParticles:false}],['strength',200,{amplifier:2,showParticles:false}]]);assert.deepEqual(plain(sounds[0]),['beacon.activate',{x:0,y:0,z:0},{volume:1,pitch:1.5}]);});
test('production hurt callback applies ground-crit chance only to eligible melee',()=>{
 ctx.readTavernEffects=e=>e.effects??{};ctx.Math=Object.create(Math);let roll=.29;ctx.Math.random=()=>roll;
 const attacker={effects:{ground_crit:{amplifier:1}},getEffect:()=>({}),getComponent:()=>undefined,getVelocity:()=>({y:-.2})};
 const run=cause=>{const e={hurtEntity:{effects:{}},damage:10,damageSource:{damagingEntity:attacker,cause}};ctx.hurt(e);return e.damage;};
 assert.equal(run('entityAttack'),15);assert.equal(run('projectile'),10);roll=.31;assert.equal(run('entityAttack'),10);roll=0;attacker.getEffect=()=>undefined;assert.equal(run('entityAttack'),10);
});
test('production elbow hit queues the Java volume without claiming knockback',()=>{
 const sounds=[];ctx.system.run=f=>f();const attacker={effects:{elbow_strike:{amplifier:0}},location:{x:1,y:2,z:3},dimension:{playSound:(...a)=>sounds.push(a)}};
 ctx.hurt({hurtEntity:{effects:{}},damage:10,damageSource:{damagingEntity:attacker,cause:'entityAttack'}});
 assert.deepEqual(plain(sounds),[['kaleidoscope_world_liquor.ice_tea_eat',{x:1,y:2,z:3},{volume:.6,pitch:1}]]);
});
test('teleport failure never grants hunger or falsely plays the arrival sound',()=>{const f=respawnFixture();f.actor.teleport=()=>{throw Error('rejected')};assert.throws(()=>ctx.safeRespawn(f.actor),/rejected/);assert.equal(f.calls.length,1);});
