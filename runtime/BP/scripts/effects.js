/** World Liquor effect rules transcribed from pinned Java 1.1.8.
 * Persistent time uses world ticks; client-only outlines/camera roll are documented gaps.
 */
import {world,system,EffectTypes,ItemStack} from '@minecraft/server';
export const NS='kaleidoscope_world_liquor';
const KEY=NS+':effects',tracked=new Map(),jumps=new Map(),headDrops=new Map();
const now=()=>world.getAbsoluteTime();
const read=p=>{try{return JSON.parse(p.getDynamicProperty(KEY)??'{}');}catch{return {};}};
const active=(p,name)=>{const row=tracked.get(p.id)?.state?.[name]??read(p)[name];return row&&row.end>now()?row:undefined;};
function persist(p,state){p.setDynamicProperty(KEY,Object.keys(state).length?JSON.stringify(state):undefined);tracked.set(p.id,{entity:p,state});}
function play(p,s){try{p.dimension.playSound(s,p.location);}catch{}}
function safeRespawn(p){const spawn=p.getSpawnPoint()??{...world.getDefaultSpawnLocation(),dimension:world.getDimension('overworld')},d=spawn.dimension;
 for(let radius=0;radius<=3;radius++)for(let dy=0;dy<=6;dy++)for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++)try{const at={x:Math.floor(spawn.x)+x+.5,y:Math.floor(spawn.y)+dy,z:Math.floor(spawn.z)+z+.5},b=d.getBlock(at),up=d.getBlock({...at,y:at.y+1}),floor=d.getBlock({...at,y:at.y-1});if(b?.isAir&&up?.isAir&&floor?.isSolid){p.teleport(at,{dimension:d});p.addEffect('hunger',300);play(p,'mob.endermen.portal');return;}}catch{}
}
export function applyEffect(p,effect,duration,amplifier=0){
 const name=effect.split(':')[1];if(!Number.isFinite(duration)||duration<0||duration>1e6||!Number.isInteger(amplifier)||amplifier<0||amplifier>255)return;
 switch(name){
 case 'explosion':p.dimension.createExplosion(p.location,3+amplifier,{breaksBlocks:world.gameRules.tntExplodes!==false,causesFire:false,source:p});return;
 case 'level_boost':p.addLevels(3+amplifier*3);return;
 case 'respawn':safeRespawn(p);return;
 case 'crazy':for(const type of EffectTypes.getAll())try{p.addEffect(type,200,{amplifier,showParticles:false});}catch{}play(p,'beacon.activate');return;
 }
 const state=read(p),old=state[name],end=now()+duration*20;if(!old||old.end<=now()||amplifier>old.amplifier||amplifier===old.amplifier&&end>old.end)state[name]={amplifier,end};persist(p,state);
}
function hurt(e){const target=e.hurtEntity,attacker=e.damageSource.damagingEntity,melee=e.damageSource.cause==='entityAttack';
 if(e.damageSource.cause==='fall'&&active(target,'reverse_gravity')){e.cancel=true;return;}
 if(attacker){
  const double=active(attacker,'double_damage');if(double&&Math.random()<.2+.2*double.amplifier)e.damage*=2;
  const crit=active(attacker,'ground_crit');if(melee&&crit&&(attacker.isOnGround||attacker.isInWater||attacker.getVelocity().y>=0)&&Math.random()<.2+.1*crit.amplifier)e.damage*=1.5;
  const behead=active(attacker,'beheading');if(melee&&behead&&!['minecraft:ender_dragon','minecraft:wither','minecraft:warden'].includes(target.typeId)&&Math.random()<.04+.03*behead.amplifier){e.damage=10000;headDrops.set(target.id,true);}
  if(melee&&active(attacker,'elbow_strike'))system.run(()=>play(attacker,NS+'.ice_tea_eat'));
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
 if(p.isOnGround)jumps.delete(p.id);
 if(state.boating_master){const riding=p.getComponent('minecraft:riding')?.entityRidingOn;if(riding?.typeId.includes('boat')){const v=riding.getVelocity(),b=p.dimension.getBlock({...riding.location,y:riding.location.y-.2}),water=b?.typeId.includes('water'),ice=b?.typeId.includes('ice'),base=water?.12:ice?.05:.3,max=water?.9:ice?.7:1.2,brake=water?.9:ice?.95:.85,forward=p.inputInfo.getMovementVector().y>0,scale=forward?1+base+.15*state.boating_master.amplifier:brake,speed=Math.hypot(v.x,v.z),factor=speed?Math.min(max,speed*scale)/speed:1;riding.applyImpulse({x:v.x*(factor-1),y:0,z:v.z*(factor-1)});}}
}
function tick(){for(const [id,t] of tracked){const p=t.entity;try{
 let changed=false;for(const [name,row] of Object.entries(t.state))if(row.end<=now()){delete t.state[name];changed=true;}
 if(!Object.keys(t.state).length){p.setDynamicProperty(KEY,undefined);tracked.delete(id);continue;}if(changed)persist(p,t.state);
 const heal=t.state.continuous_heal;if(heal){const h=p.getComponent('minecraft:health');if(h&&h.currentValue<h.effectiveMax)h.setCurrentValue(Math.min(h.effectiveMax,h.currentValue+heal.amplifier+1));}
 motion(p,t.state);if(t.state.frost_walker&&system.currentTick%5===0)freeze(p,t.state.frost_walker.amplifier);
 }catch{tracked.delete(id);}}
}
export function installEffects(){
 system.afterEvents.scriptEventReceive.subscribe(e=>{if(e.sourceType!=='Server'||e.id!==NS+':apply_effect')return;try{const row=JSON.parse(e.message),p=world.getEntity(row.entity);if(p?.typeId==='minecraft:player'&&row.effect.startsWith(NS+':'))applyEffect(p,row.effect,row.duration,row.amplifier);}catch(e){console.warn('[World Liquor effects] '+e);}},{namespaces:[NS]});
 world.beforeEvents.entityHurt.subscribe(hurt);
 world.afterEvents.playerSpawn.subscribe(({player,initialSpawn})=>{if(!initialSpawn)persist(player,{});else tracked.set(player.id,{entity:player,state:read(player)});});
 world.afterEvents.playerLeave.subscribe(e=>{tracked.delete(e.playerId);jumps.delete(e.playerId);});
 world.afterEvents.itemCompleteUse.subscribe(e=>{if(e.itemStack?.typeId==='minecraft:milk_bucket')persist(e.source,{});});
 world.afterEvents.playerButtonInput.subscribe(e=>{if(e.button!=='Jump'||e.newButtonState!=='Pressed')return;const p=e.player,reverse=active(p,'reverse_gravity');if(reverse){const v=p.getVelocity();p.applyImpulse({x:0,y:-.42-v.y,z:0});return;}const row=active(p,'multi_jump'),v=p.getVelocity();if(!row||p.isOnGround||p.isFlying||p.isGliding||p.isInWater||p.isClimbing||p.getEffect('levitation')||p.getComponent('minecraft:riding')||v.y>=0)return;const count=jumps.get(p.id)??0;if(count>=row.amplifier+1)return;jumps.set(p.id,count+1);p.applyImpulse({x:0,y:.42-v.y,z:0});});
 world.afterEvents.entityDie.subscribe(e=>{if(headDrops.delete(e.deadEntity.id)){const id={'minecraft:zombie':'minecraft:zombie_head','minecraft:skeleton':'minecraft:skeleton_skull','minecraft:creeper':'minecraft:creeper_head','minecraft:wither_skeleton':'minecraft:wither_skeleton_skull','minecraft:piglin':'minecraft:piglin_head','minecraft:player':'minecraft:player_head'}[e.deadEntity.typeId];if(id)try{e.deadEntity.dimension.spawnItem(new ItemStack(id),e.deadEntity.location);}catch{}}
  const attacker=e.damageSource?.damagingEntity,row=attacker&&active(attacker,'treasure_guide');if(row)doubleFreshDrops(e.deadEntity.dimension,e.deadEntity.location,.15+.05*row.amplifier);
 });
 world.afterEvents.playerBreakBlock.subscribe(e=>{const row=active(e.player,'treasure_guide');if(!row)return;const id=e.brokenBlockPermutation.type.id,crop=/(_crop|wheat|beetroot|carrots|potatoes|nether_wart|cocoa)/.test(id),ore=/_ore$/.test(id);if(crop||ore)doubleFreshDrops(e.dimension,e.block.location,(crop?.15:.2)+.05*row.amplifier);});
 system.run(()=>{for(const p of world.getAllPlayers())tracked.set(p.id,{entity:p,state:read(p)});});system.runInterval(tick,1);
}
