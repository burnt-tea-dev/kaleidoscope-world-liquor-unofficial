import {readTavernEffects,getTavernEffectEntities} from './sdk/tavern-effects.js';
import {isVanillaCrit,doubleDamageChance,javaFloatRoll,javaDamageProduct,tequilaDamageCap,isMeleeSource} from './combat-source.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from './kill-credit.js';
import {boatingVelocity,reverseGravityImpulse,multiJumpStep,sourceJumpVelocity,nativeJumpImpulse} from './motion-source.js';
import {lavaContact} from './liquid-contact.js';
import {CriticalFeedback} from './critical-feedback.js';
import {AcceptedHurtFeedback} from './accepted-hurt-feedback.js';
import {freezeWater} from './frost-water.js';
import {addTreasureBlockDrops} from './treasure-block.js';
/** World Liquor effect rules, with current Java 1.1.11 repairs.
 * Tavern owns persistent online time; this module supplies effect behaviour only.
 */
import {world,system,EffectTypes,ItemStack,MolangVariableMap} from '@minecraft/server';
export const NS='kaleidoscope_world_liquor';
const jumps=new Map(),headDrops=new Map();
const killCredit=new JavaKillCredit({now:()=>system.currentTick,resolve:id=>{try{return world.getEntity(id);}catch{return undefined;}}});
const acceptedFeedback=new AcceptedHurtFeedback(system);
const criticalFeedback=new CriticalFeedback(system,{delivery:acceptedFeedback,variables:()=>new MolangVariableMap()});
const read=p=>readTavernEffects(p,NS);
const active=(p,name)=>read(p)[name];
function play(p,s,options={volume:1,pitch:1}){try{p.dimension.playSound(s,p.location,options);}catch{}}
function combatSound(event,p,id,options){
 const dimension=p.dimension,at={...p.location};
 // Before-event mutations are deferred, but use the original source position.
 acceptedFeedback.queue(event,accepted=>{if(accepted)dimension.playSound(id,at,options);});
}
function safeRespawn(p){play(p,NS+'.java.respawn');const spawn=p.getSpawnPoint()??{...world.getDefaultSpawnLocation(),dimension:world.getDimension('overworld')},d=spawn.dimension;
 for(let radius=0;radius<=3;radius++)for(let dy=0;dy<=6;dy++)for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++)try{const at={x:Math.floor(spawn.x)+x+.5,y:Math.floor(spawn.y)+dy,z:Math.floor(spawn.z)+z+.5},b=d.getBlock(at),up=d.getBlock({...at,y:at.y+1}),floor=d.getBlock({...at,y:at.y-1});if(b?.isAir&&up?.isAir&&floor?.isSolid){p.teleport(at,{dimension:d});p.addEffect('hunger',300);play(p,NS+'.java.respawn');return;}}catch{}
}
export function applyEffect(p,effect,duration,amplifier=0){
 const name=effect.split(':')[1];if(!Number.isFinite(duration)||duration<0||duration>1e6||!Number.isInteger(amplifier)||amplifier<0||amplifier>255)return;
 switch(name){
 case 'explosion':p.dimension.createExplosion(p.location,3+amplifier,{breaksBlocks:world.gameRules.tntExplodes!==false,causesFire:false,source:p});return;
 case 'level_boost':if(p.typeId==='minecraft:player')p.addLevels(3+amplifier*3);return;
 case 'respawn':if(p.typeId==='minecraft:player')safeRespawn(p);return;
 case 'crazy':for(const type of EffectTypes.getAll())try{p.addEffect(type,200,{amplifier,showParticles:false});}catch{}play(p,NS+'.java.crazy',{volume:1,pitch:1.5});return;
 }
 system.sendScriptEvent('kaleidoscope_tavern:effect_apply',JSON.stringify({entity:p.id,effect,duration,amplifier}));
}
function hurt(e){const target=e.hurtEntity,attacker=e.damageSource.damagingEntity,melee=isMeleeSource(e.damageSource);
 if(e.cancel===true||!isLivingCombatEntity(target))return;
 // Java reverse gravity's calculateFallDamage injection is Player-only;
 // MultiJumpFallDamageMixin applies to every LivingEntity.
 if(e.damageSource.cause==='fall'&&(target.typeId==='minecraft:player'&&active(target,'reverse_gravity')||active(target,'multi_jump'))){e.cancel=true;return;}
 const credited=killCredit.previous(target.id),double=credited&&active(credited,'double_damage');
 if(double&&javaFloatRoll(Math.random())<doubleDamageChance(double.amplifier)){e.damage=javaDamageProduct(e.damage,2);combatSound(e,credited,NS+'.java.critical',{volume:1,pitch:1.5});if(credited.typeId==='minecraft:player')criticalFeedback.queue(e,credited);}
 if(attacker){
  const crit=active(attacker,'ground_crit');if(melee&&attacker.typeId==='minecraft:player'&&crit&&!isVanillaCrit(attacker)&&Math.random()<.2+.1*crit.amplifier){e.damage=javaDamageProduct(e.damage,1.5);criticalFeedback.queue(e,attacker);}
  const behead=active(attacker,'beheading');if(melee&&behead&&!['minecraft:ender_dragon','minecraft:wither','minecraft:warden'].includes(target.typeId)&&Math.random()<.04+.03*behead.amplifier){e.damage=10000;headDrops.set(target.id,true);}
  if(!e.damageSource.damagingProjectile&&e.damageSource.cause!=='projectile'&&active(attacker,'elbow_strike'))combatSound(e,attacker,NS+'.ice_tea_eat',{volume:.6,pitch:1});
 }
 const tequila=active(target,'tequila');if(tequila)e.damage=Math.min(e.damage,tequilaDamageCap(target.getComponent('minecraft:health')?.effectiveMax??20,tequila.amplifier));
 const pending=killCredit.begin(target.id,e,damageCreditMutation(e.damageSource));
 if(pending)system.run(()=>killCredit.complete(pending));
}
function doubleFreshDrops(dimension,position,chance){
 if(Math.random()>=chance)return;
 const options={type:'minecraft:item',location:position,maxDistance:1.5},before=new Set(dimension.getEntities(options).map(e=>e.id));
 system.runTimeout(()=>{try{for(const entity of dimension.getEntities(options)){
  if(before.has(entity.id))continue;
  const stack=entity.getComponent('minecraft:item')?.itemStack;if(stack)dimension.spawnItem(stack.clone(),entity.location);
 }}catch(e){console.warn('[World Liquor treasure guide] '+e);}},1);
}
function motion(p,state){
 const v=p.getVelocity(),lava=(state.reverse_gravity||state.multi_jump)?lavaContact(p):false;
 let jumped=false;
 if(state.multi_jump){const row=multiJumpStep(jumps.get(p.id),{effect:true,amplifier:state.multi_jump.amplifier,ground:p.isOnGround,climbing:p.isClimbing,elytra:wearingUsableElytra(p),gliding:p.isGliding,riding:!!p.getComponent('minecraft:riding')?.entityRidingOn,water:p.isInWater,levitation:!!p.getEffect('levitation'),reverse:!!state.reverse_gravity,velocityY:v.y,pressed:p.inputInfo.getButtonState('Jump')==='Pressed',flying:p.isFlying});jumps.set(p.id,row);if(row.jump){jump(p,!!state.reverse_gravity,lava);jumped=true;}}
 if(state.reverse_gravity&&!jumped){const impulse=reverseGravityImpulse({velocityY:v.y,flying:p.isFlying,water:p.isInWater,lava,levitation:p.getEffect('levitation')?.amplifier,slowFalling:!!p.getEffect('slow_falling')});if(impulse!==undefined)p.applyImpulse({x:0,y:impulse,z:0});}
 if(state.captain_gift&&!p.isSneaking&&v.y<=0){const y=Math.floor(p.location.y),b=p.dimension.getBlock({x:Math.floor(p.location.x),y:y-1,z:Math.floor(p.location.z)});if(b?.typeId==='minecraft:water'&&(b.permutation.getState('liquid_depth')??0)===0&&p.location.y-y<.3)p.applyImpulse({x:0,y:-v.y+.08,z:0});}
 if(state.boating_master){const boat=p.getComponent('minecraft:riding')?.entityRidingOn,ride=boat?.getComponent('minecraft:rideable');if(boat?.getComponent('minecraft:type_family')?.hasTypeFamily('boat')&&ride?.getRiders()[ride.controllingSeat]?.id===p.id){const velocity=boat.getVelocity(),next=boatingVelocity(velocity,state.boating_master.amplifier,p.inputInfo.getMovementVector().y>0);boat.applyImpulse({x:next.x-velocity.x,y:0,z:next.z-velocity.z});}}
}
function jump(p,reverse,lava=lavaContact(p)){
 const at={x:Math.floor(p.location.x),y:Math.floor(p.location.y),z:Math.floor(p.location.z)},factor=b=>b?.typeId==='minecraft:honey_block'?.5:1,foot=factor(p.dimension.getBlock(at)),other=factor(p.dimension.getBlock({...at,y:reverse?at.y+1:Math.floor(p.location.y-.2)}));
 const target=sourceJumpVelocity({reverse,jumpFactor:foot===1?other:foot,jumpBoost:p.getEffect('jump_boost')?.amplifier,sprinting:p.isSprinting,yaw:p.getRotation().y}),velocity=p.getVelocity();p.applyImpulse(nativeJumpImpulse(velocity,target,{slowFalling:!!p.getEffect('slow_falling'),lava}));
}
export function tick(){if(system.currentTick%20===0)killCredit.prune();const entities=new Map(world.getAllPlayers().map(p=>[p.id,p]));for(const entity of getTavernEffectEntities(world,NS))entities.set(entity.id,entity);for(const p of entities.values())try{
 const state=read(p);if(!state.multi_jump)jumps.delete(p.id);
 if(!Object.keys(state).length)continue;
 const heal=state.continuous_heal;if(heal){const h=p.getComponent('minecraft:health');if(h&&h.currentValue>0&&h.currentValue<h.effectiveMax)h.setCurrentValue(Math.min(h.effectiveMax,Math.fround(Math.fround(h.currentValue)+Math.fround(heal.amplifier+1))));}
 if(p.typeId==='minecraft:player'){motion(p,state);if(state.frost_walker)freezeWater(p,state.frost_walker.amplifier);}
 }catch(e){console.warn('[World Liquor effect behaviour] '+e);}
}
function wearingUsableElytra(p){
 const chest=p.getComponent('minecraft:equippable')?.getEquipment('Chest');
 if(chest?.typeId!=='minecraft:elytra')return false;
 const durability=chest.getComponent('minecraft:durability');
 return !durability||durability.damage<durability.maxDurability-1;
}
export function installEffects(){
 system.afterEvents.scriptEventReceive.subscribe(e=>{if(e.sourceType!=='Server'||e.id!==NS+':apply_effect')return;try{const row=JSON.parse(e.message),p=world.getEntity(row.entity);if(isLivingCombatEntity(p)&&[NS+':explosion',NS+':level_boost',NS+':respawn',NS+':crazy'].includes(row.effect))applyEffect(p,row.effect,row.duration,row.amplifier);}catch(e){console.warn('[World Liquor effects] '+e);}},{namespaces:[NS]});
 world.beforeEvents.entityHurt.subscribe(hurt);
 world.afterEvents.entityHurt.subscribe(e=>{killCredit.applied(e);acceptedFeedback.applied(e);});
 world.afterEvents.entityRemove.subscribe(e=>killCredit.forget(e.removedEntityId));
 world.afterEvents.playerSpawn.subscribe(({player})=>{jumps.delete(player.id);killCredit.forget(player.id);});
 world.afterEvents.playerLeave.subscribe(e=>{jumps.delete(e.playerId);killCredit.forget(e.playerId);});
 world.afterEvents.playerButtonInput.subscribe(e=>{if(e.button==='Jump'&&e.newButtonState==='Pressed'&&active(e.player,'reverse_gravity')&&e.player.isOnGround)jump(e.player,true);});
 world.afterEvents.entityDie.subscribe(e=>{if(headDrops.delete(e.deadEntity.id)){const id={'minecraft:zombie':'minecraft:zombie_head','minecraft:skeleton':'minecraft:skeleton_skull','minecraft:creeper':'minecraft:creeper_head','minecraft:wither_skeleton':'minecraft:wither_skeleton_skull','minecraft:piglin':'minecraft:piglin_head','minecraft:player':'minecraft:player_head'}[e.deadEntity.typeId];if(id)try{e.deadEntity.dimension.spawnItem(new ItemStack(id),e.deadEntity.location);}catch{}}
  const attacker=e.damageSource?.damagingEntity,row=attacker&&active(attacker,'treasure_guide');if(row)doubleFreshDrops(e.deadEntity.dimension,e.deadEntity.location,.15+.05*row.amplifier);
 });
 world.afterEvents.playerBreakBlock.subscribe(e=>{const row=active(e.player,'treasure_guide');if(!row)return;try{addTreasureBlockDrops(e,row.amplifier,world.getLootTableManager());}catch(error){console.warn('[World Liquor treasure block] '+error);}});
 system.runInterval(tick,1);
}
