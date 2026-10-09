import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as rules from '../runtime/BP/scripts/combat-source.js';
import {useSoundPulse} from '../runtime/BP/scripts/drink-audio.js';
import {beheadingHeadId} from '../runtime/BP/scripts/beheading-head.js';

test('beheading resolves foreign registry heads in author order without an addon allowlist',()=>{
 const registered=new Map(['beasts:otter_head','beasts:otter_skull','beasts:skull_otter','beasts:head_otter','beasts:dead_otter','beasts:otter_item'].map(id=>[id,{id}]));
 const lookup=id=>registered.get(id);
 for(const expected of [...registered.keys()]){
  assert.equal(beheadingHeadId('beasts:otter',lookup),expected);
  registered.delete(expected);
 }
 assert.equal(beheadingHeadId('beasts:otter',lookup),undefined);
 registered.set('different:otter_head',{id:'different:otter_head'});
 registered.set('beasts:otter_head',{id:'minecraft:air'});
 assert.equal(beheadingHeadId('beasts:otter',lookup),undefined);
 // Vanilla class-specific results take precedence over generic registry names.
 assert.equal(beheadingHeadId('minecraft:skeleton',()=>{throw Error('unexpected registry fallback');}),'minecraft:skeleton_skull');
 assert.equal(beheadingHeadId('minecraft:player',lookup),'minecraft:player_head');
});
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

function installedEffectsFixture(entities){
 const signal=()=>({subscribe(fn){this.callback=fn;}}),states=new Map(),pending=[],explosions=[],sounds=[];
 const beforeHurt=signal(),afterHurt=signal(),scriptEvent=signal();
 const dimension={createExplosion:(...args)=>explosions.push(args),playSound:(...args)=>sounds.push(args)};
 for(const entity of entities){entity.dimension=dimension;entity.location={x:1,y:2,z:3};}
 const byId=new Map(entities.map(entity=>[entity.id,entity]));
 const world={getEntity:id=>byId.get(id),gameRules:{tntExplodes:true},beforeEvents:{entityHurt:beforeHurt},afterEvents:{entityHurt:afterHurt,entityRemove:signal(),playerSpawn:signal(),playerLeave:signal(),playerButtonInput:signal(),entityDie:signal(),playerBreakBlock:signal()}};
 const system={currentTick:0,run:fn=>pending.push(fn),runInterval(){},afterEvents:{scriptEventReceive:scriptEvent}};
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const ctx=vm.createContext({AcceptedHurtFeedback,CriticalFeedback:class{queue(){}},MolangVariableMap:class{},JavaKillCredit,damageCreditMutation,isLivingCombatEntity,...rules,world,system,readTavernEffects:entity=>states.get(entity)??{},FrostAgingScheduler:class{},setFrostAgingScheduler(){},installJavaRespawn(){},Math:Object.assign(Object.create(Math),{random:()=>0})});
 vm.runInContext(source+'\ninstallEffects();',ctx);
 return {states,explosions,sounds,system,flush:()=>pending.splice(0).forEach(fn=>fn()),before:event=>beforeHurt.callback(event),after:event=>afterHurt.callback(event),script:event=>scriptEvent.callback(event)};
}
function familylessEntity(id,typeId='minecraft:cod'){
 const health={currentValue:3,effectiveMax:3};
 return {id,typeId,isValid:true,getComponent:key=>key==='minecraft:health'?health:key==='minecraft:type_family'?{hasTypeFamily:family=>['aquatic','cod','fish'].includes(family)}:undefined};
}
test('registered fall callback admits familyless cod for MultiJump while retaining source and nonliving guards',()=>{
 const cod=familylessEntity('fall-cod'),boat=familylessEntity('fall-boat','minecraft:boat'),helper=familylessEntity('fall-helper','kaleidoscope_tavern:effect_anchor'),f=installedEffectsFixture([cod,boat,helper]);
 const hurt=target=>{const event={hurtEntity:target,damage:1,damageSource:{cause:'fall'}};f.before(event);return event;};
 assert.equal(hurt(cod).cancel,undefined,'untreated cod must not receive fall immunity');
 f.states.set(cod,{multi_jump:{amplifier:0}});
 assert.equal(hurt(cod).cancel,true,'LivingEntity MultiJumpFallDamageMixin includes cod without mob family');
 f.states.set(cod,{reverse_gravity:{amplifier:0}});
 assert.equal(hurt(cod).cancel,undefined,'reverse gravity retains its Player-only source gate');
 for(const entity of [boat,helper]){f.states.set(entity,{multi_jump:{amplifier:0}});assert.equal(hurt(entity).cancel,undefined,entity.typeId);}
});
test('registered Tequila callback caps familyless fish damage using the source float arithmetic',()=>{
 const cod=familylessEntity('tequila-cod'),boat=familylessEntity('tequila-boat','minecraft:boat'),f=installedEffectsFixture([cod,boat]);
 const hurt=(target,cancel)=>{const event={hurtEntity:target,damage:100,cancel,damageSource:{cause:'fire'}};f.before(event);return event;};
 assert.equal(hurt(cod).damage,100);
 for(const target of [cod,boat])f.states.set(target,{tequila:{amplifier:0}});
 // DamageEvents.onLivingDamagePre in CF9066406: float(3 * 0.4f).
 assert.equal(hurt(cod).damage,1.2000000476837158);
 assert.equal(hurt(boat).damage,100,'health alone does not make a boat LivingEntity');
 assert.equal(hurt(cod,true).damage,100,'an already canceled event stays untouched');
});
test('registered instant-effect routing admits a familyless fish without admitting health-only entities',()=>{
 const cod=familylessEntity('instant-cod'),boat=familylessEntity('instant-boat','minecraft:boat'),helper=familylessEntity('instant-helper','kaleidoscope_tavern:effect_anchor'),removed=familylessEntity('instant-removed');removed.isValid=false;
 const f=installedEffectsFixture([cod,boat,helper,removed]);
 const send=(entity,sourceType='Server')=>f.script({sourceType,id:'kaleidoscope_world_liquor:apply_effect',message:JSON.stringify({entity:entity.id,effect:'kaleidoscope_world_liquor:explosion',duration:1,amplifier:2})});
 send(cod);assert.equal(f.explosions.length,1);assert.equal(f.explosions[0][1],5);assert.equal(f.explosions[0][2].source,cod);assert.equal(f.explosions[0][2].breaksBlocks,true);
 for(const entity of [boat,helper,removed])send(entity);
 send(cod,'Entity');
 assert.equal(f.explosions.length,1,'nonliving, invalid and non-Server inputs must not execute instant effects');
});
test('registered before/after hurt callbacks preserve a fish attacker as previous kill credit',()=>{
 const cod=familylessEntity('attacking-cod'),target=familylessEntity('credit-target','minecraft:zombie'),f=installedEffectsFixture([cod,target]);
 f.states.set(cod,{double_damage:{amplifier:4}});
 const first={hurtEntity:target,damage:1,damageSource:{cause:'entityAttack',damagingEntity:cod}};
 f.before(first);assert.equal(first.damage,1,'fresh first hit has no previous credit');
 f.after(first);f.flush();f.system.currentTick=1;
 const later={hurtEntity:target,damage:1,damageSource:{cause:'fire'}};
 f.before(later);assert.equal(later.damage,2,'accepted fish owner survives into an environmental damage callback');
 f.after(later);f.flush();assert.equal(f.sounds.length,1);
 cod.getComponent('minecraft:health').currentValue=0;
 const afterDeath={hurtEntity:target,damage:1,damageSource:{cause:'fire'}};
 f.before(afterDeath);assert.equal(afterDeath.damage,1,'dead mob cannot supply later kill credit');
});
