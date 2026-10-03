import {readTavernEffects} from './sdk/tavern-effects.js';
/** World Liquor effect rules checked against pinned Java 1.1.9.
 * Tavern owns persistent online time; this module supplies effect behaviour only.
 */
import {world,system,EffectTypes,ItemStack} from '@minecraft/server';
export const NS='kaleidoscope_world_liquor';
const jumps=new Map(),headDrops=new Map();
const read=p=>readTavernEffects(p,NS);
const active=(p,name)=>read(p)[name];
function play(p,s,volume=1,pitch=1){try{p.dimension.playSound(s,p.location,{volume,pitch});}catch{}}
// Java RespawnEffect: center first, then perimeter rings at each height.
// Keep selection independent from the Bedrock collision adapter for regression tests.
export function findRespawnPosition(center,isSafe){
 if(isSafe(center))return center;
 for(const dy of [0,-1,-2,-3,1,2,3])for(let r=1;r<=3;r++){
  const at=(x,z)=>({x:center.x+x,y:center.y+dy,z:center.z+z});
  for(let x=-r;x<=r;x++){const p=at(x,-r);if(isSafe(p))return p;}
  for(let z=-r+1;z<=r;z++){const p=at(r,z);if(isSafe(p))return p;}
  for(let x=r-1;x>=-r;x--){const p=at(x,r);if(isSafe(p))return p;}
  for(let z=r-1;z>=-r+1;z--){const p=at(-r,z);if(isSafe(p))return p;}
 }
 return center;
}
function safeRespawn(p){
 const spawn=p.getSpawnPoint()??{...world.getDefaultSpawnLocation(),dimension:world.getDimension('overworld')},d=spawn.dimension;
 const center={x:Math.floor(spawn.x),y:Math.floor(spawn.y),z:Math.floor(spawn.z)};
 const selected=findRespawnPosition(center,at=>{try{
  const feet=d.getBlock(at),head=d.getBlock({...at,y:at.y+1}),floor=d.getBlock({...at,y:at.y-1});
  // Stable Block API has no collision-shape getter. Air/liquid are known empty
  // shapes; other non-solid blocks (e.g. fences) must not be assumed passable.
  return !!((feet?.isAir||feet?.isLiquid)&&(head?.isAir||head?.isLiquid)&&(floor?.isSolid||floor?.isLiquid));
 }catch{return false;}});
 const at={x:selected.x+.5,y:selected.y,z:selected.z+.5};
 play(p,'entity.player.teleport');
 p.teleport(at,{dimension:d,rotation:p.getRotation(),keepVelocity:p.dimension.id===d.id});
 play(p,'entity.player.teleport');
 p.addEffect('hunger',300,{amplifier:0});
 // Java explicitly clears fallDistance; stable Bedrock has no corresponding setter.
}
function canRollGroundCrit(p){
 return p.isOnGround||p.isClimbing||p.isInWater||!!p.getEffect('blindness')||!!p.getComponent('minecraft:riding')?.entityRidingOn||p.getVelocity().y>=0;
}
export function applyEffect(p,effect,duration,amplifier=0){
 const name=effect.split(':')[1];if(!Number.isFinite(duration)||duration<0||duration>1e6||!Number.isInteger(amplifier)||amplifier<0||amplifier>255)return;
 switch(name){
 case 'explosion':p.dimension.createExplosion(p.location,3+amplifier,{breaksBlocks:world.gameRules.tntExplodes!==false,causesFire:false,source:p});return;
 case 'level_boost':p.addLevels(3+amplifier*3);return;
 case 'respawn':safeRespawn(p);return;
 case 'crazy':for(const type of EffectTypes.getAll())try{p.addEffect(type,200,{amplifier,showParticles:false});}catch{}play(p,'beacon.activate',1,1.5);return;
 }
 system.sendScriptEvent('kaleidoscope_tavern:effect_apply',JSON.stringify({entity:p.id,effect,duration,amplifier}));
}
function hurt(e){const target=e.hurtEntity,attacker=e.damageSource.damagingEntity,melee=e.damageSource.cause==='entityAttack';
 if(e.damageSource.cause==='fall'&&(active(target,'reverse_gravity')||active(target,'multi_jump'))){e.cancel=true;return;}
 if(attacker){
  const double=active(attacker,'double_damage');if(double&&Math.random()<.2+.2*double.amplifier)e.damage*=2;
  const crit=active(attacker,'ground_crit');if(melee&&crit&&canRollGroundCrit(attacker)&&Math.random()<.2+.1*crit.amplifier)e.damage*=1.5;
  const behead=active(attacker,'beheading');if(melee&&behead&&!['minecraft:ender_dragon','minecraft:wither','minecraft:warden'].includes(target.typeId)&&Math.random()<.04+.03*behead.amplifier){e.damage=10000;headDrops.set(target.id,true);}
  if(melee&&active(attacker,'elbow_strike'))system.run(()=>play(attacker,NS+'.ice_tea_eat',.6,1));
 }
 const tequila=active(target,'tequila');if(tequila)e.damage=Math.min(e.damage,(target.getComponent('minecraft:health')?.effectiveMax??20)*Math.max(.05,.4-.05*tequila.amplifier));
}
function freeze(p,amp){if(!p.isOnGround)return;const r=Math.min(7,3+amp),at={x:Math.floor(p.location.x),y:Math.floor(p.location.y)-1,z:Math.floor(p.location.z)};for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++){if(x*x+z*z>r*r)continue;try{const b=p.dimension.getBlock({x:at.x+x,y:at.y,z:at.z+z}),up=p.dimension.getBlock({x:at.x+x,y:at.y+1,z:at.z+z});if(b?.typeId==='minecraft:water'&&(b.permutation.getState('liquid_depth')??0)===0&&up?.isAir)b.setType('minecraft:frosted_ice');}catch{}}}
function doubleFreshDrops(dimension,position,chance){
 if(Math.random()>=chance)return;
 const options={type:'minecraft:item',location:position,maxDistance:1.5},before=new Set(dimension.getEntities(options).map(e=>e.id));
 system.runTimeout(()=>{try{for(const entity of dimension.getEntities(options)){
  if(before.has(entity.id))continue;
  const stack=entity.getComponent('minecraft:item')?.itemStack;if(stack)dimension.spawnItem(stack.clone(),entity.location);
 }}catch(e){console.warn('[World Liquor treasure guide] '+e);}},1);
}
function motion(p,state){
 const v=p.getVelocity();
 if(state.reverse_gravity&&!p.isFlying&&!p.isInWater&&!p.isInLava)p.applyImpulse({x:0,y:.16,z:0});
 if(state.captain_gift&&!p.isSneaking&&v.y<=0){const y=Math.floor(p.location.y),b=p.dimension.getBlock({x:Math.floor(p.location.x),y:y-1,z:Math.floor(p.location.z)});if(b?.typeId==='minecraft:water'&&(b.permutation.getState('liquid_depth')??0)===0&&p.location.y-y<.3)p.applyImpulse({x:0,y:-v.y+.08,z:0});}
 if(state.multi_jump&&(p.isOnGround||p.isClimbing))jumps.set(p.id,state.multi_jump.amplifier+1);
 if(state.boating_master){const riding=p.getComponent('minecraft:riding')?.entityRidingOn;if(riding?.typeId.includes('boat')){const v=riding.getVelocity(),b=p.dimension.getBlock({...riding.location,y:riding.location.y-.2}),water=b?.typeId.includes('water'),ice=b?.typeId.includes('ice'),base=water?.12:ice?.05:.3,max=water?.9:ice?.7:1.2,brake=water?.9:ice?.95:.85,forward=p.inputInfo.getMovementVector().y>0,scale=forward?1+base+.15*state.boating_master.amplifier:brake,speed=Math.hypot(v.x,v.z),factor=speed?Math.min(max,speed*scale)/speed:1;riding.applyImpulse({x:v.x*(factor-1),y:0,z:v.z*(factor-1)});}}
}
export function tick(){for(const p of world.getAllPlayers())try{
 const state=read(p);if(!state.multi_jump)jumps.delete(p.id);
 if(!Object.keys(state).length)continue;
 const heal=state.continuous_heal;if(heal){const h=p.getComponent('minecraft:health');if(h&&h.currentValue<h.effectiveMax)h.setCurrentValue(Math.min(h.effectiveMax,h.currentValue+heal.amplifier+1));}
 motion(p,state);if(state.frost_walker&&system.currentTick%5===0)freeze(p,state.frost_walker.amplifier);
 }catch(e){console.warn('[World Liquor effect behaviour] '+e);}
}
function wearingUsableElytra(p){
 const chest=p.getComponent('minecraft:equippable')?.getEquipment('Chest');
 if(chest?.typeId!=='minecraft:elytra')return false;
 const durability=chest.getComponent('minecraft:durability');
 return !durability||durability.damage<durability.maxDurability-1;
}
export function installEffects(){
 system.afterEvents.scriptEventReceive.subscribe(e=>{if(e.sourceType!=='Server'||e.id!==NS+':apply_effect')return;try{const row=JSON.parse(e.message),p=world.getEntity(row.entity);if(p?.typeId==='minecraft:player'&&[NS+':explosion',NS+':level_boost',NS+':respawn',NS+':crazy'].includes(row.effect))applyEffect(p,row.effect,row.duration,row.amplifier);}catch(e){console.warn('[World Liquor effects] '+e);}},{namespaces:[NS]});
 world.beforeEvents.entityHurt.subscribe(hurt);
 world.afterEvents.playerSpawn.subscribe(({player})=>jumps.delete(player.id));
 world.afterEvents.playerLeave.subscribe(e=>{jumps.delete(e.playerId);});
 world.afterEvents.playerButtonInput.subscribe(e=>{if(e.button!=='Jump'||e.newButtonState!=='Pressed')return;const p=e.player,reverse=active(p,'reverse_gravity');if(reverse){const v=p.getVelocity();p.applyImpulse({x:0,y:-.42-v.y,z:0});return;}const row=active(p,'multi_jump'),v=p.getVelocity();if(!row||p.isOnGround||p.isFlying||p.isGliding||p.isInWater||wearingUsableElytra(p)||p.getEffect('levitation')||p.getComponent('minecraft:riding')||v.y>=0)return;const remaining=jumps.get(p.id)??0;if(remaining<=0)return;jumps.set(p.id,remaining-1);p.applyImpulse({x:0,y:.42-v.y,z:0});});
 world.afterEvents.entityDie.subscribe(e=>{if(headDrops.delete(e.deadEntity.id)){const id={'minecraft:zombie':'minecraft:zombie_head','minecraft:skeleton':'minecraft:skeleton_skull','minecraft:creeper':'minecraft:creeper_head','minecraft:wither_skeleton':'minecraft:wither_skeleton_skull','minecraft:piglin':'minecraft:piglin_head','minecraft:player':'minecraft:player_head'}[e.deadEntity.typeId];if(id)try{e.deadEntity.dimension.spawnItem(new ItemStack(id),e.deadEntity.location);}catch{}}
  const attacker=e.damageSource?.damagingEntity,row=attacker&&active(attacker,'treasure_guide');if(row)doubleFreshDrops(e.deadEntity.dimension,e.deadEntity.location,.15+.05*row.amplifier);
 });
 world.afterEvents.playerBreakBlock.subscribe(e=>{const row=active(e.player,'treasure_guide');if(!row)return;const id=e.brokenBlockPermutation.type.id,crop=/(_crop|wheat|beetroot|carrots|potatoes|nether_wart|cocoa)/.test(id),ore=/_ore$/.test(id);if(crop||ore)doubleFreshDrops(e.dimension,e.block.location,(crop?.15:.2)+.05*row.amplifier);});
 system.runInterval(tick,1);
}
