import {startFreezerRecipe,freezerPowerTransition,advanceFreezerTick} from './freezer-state.js';
import {WALL_RECORD,wallRecordItem} from './wall-record-state.js';
import {createBreakFeedback} from './sdk/tavern-break-feedback.js';
import {BREAK_FEEDBACK} from './data/break-feedback.js';
const breakFeedback=createBreakFeedback(id=>BREAK_FEEDBACK[id]);
import {reserveRecordSound,playRecord,stopRecord,installRecordCleanup} from './record-audio.js';
import {syncFreezerVisuals} from './freezer-visuals.js';
import {isManagedCabinet,foundationReady,forwardFurnitureTick,forwardNativeUse} from './foundation.js';
import {world,system,ItemStack,BlockPermutation} from '@minecraft/server';
import {FREEZER_RECIPES} from './freezer-recipes.js';
import {LEGACY_FREEZER_RECIPES} from './legacy-freezer-recipes.js';
import {extractFreezerOutput} from './freezer-output.js';
import {fillFreezerMilk} from './freezer-milk.js';
const savedFreezerRecipes=[...FREEZER_RECIPES,...LEGACY_FREEZER_RECIPES];
import {RECORD_MODELS} from './wall-record-models.js';
export const NS='kaleidoscope_world_liquor',KT='kaleidoscope_tavern',FACING=KT+':facing';
const vectors=[{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0}],cooldown=new Map();
const liquids={'minecraft:water_bucket':'minecraft:water','minecraft:lava_bucket':'minecraft:lava','minecraft:milk_bucket':NS+':milk_still',[KT+':grape_bucket']:KT+':grape_juice',[KT+':sweet_berries_bucket']:KT+':sweet_berries_juice'};
const container=player=>player.getComponent('minecraft:inventory').container;
export const hand=player=>container(player).getItem(player.selectedSlotIndex);
const creative=p=>String(p.getGameMode()).toLowerCase()==='creative';
const mutable=p=>!['adventure','spectator'].includes(String(p.getGameMode()).toLowerCase());
const key=b=>NS+':storage/'+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
const center=b=>({x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5});
const plus=(p,v)=>({x:p.x+v.x,y:p.y+(v.y??0),z:p.z+v.z});
// Use Tavern's facing convention: north/east/south/west map to 0/1/2/3.
const rotation=p=>Math.floor((((p.getRotation().y+45)%360)+360)%360/90);
const furniture=id=>!isManagedCabinet(id)&&id?.startsWith(NS+':')&&(/_cabinet$|:freezer$|:bar_stool_|_painting$|:wall_record$/.test(id));
const read=(b,permutation=b.permutation)=>{
 // A wall record's 25 model states encode its item completely. Do not rely on
 // a coordinate DP which old onPlace cleared, or parse a corrupt legacy row.
 if(permutation.type.id===WALL_RECORD)return {record:wallRecordItem(permutation)};
 return JSON.parse(world.getDynamicProperty(key(b))??'null')??{type:b.typeId,slots:Array(b.typeId.includes('cellar_cabinet')?9:2).fill(null),input:[],fluid:null,recipe:null,remaining:0,output:0};
};
const save=(b,s)=>world.setDynamicProperty(key(b),s?JSON.stringify(s):undefined);
const safeBlock=(d,p)=>{try{return d.getBlock(p);}catch{return undefined;}};
// Script removals may schedule onBreak. Suppress only this exact removal token.
const pendingBreaks=new Map();
const breakKey=(b,id)=>b.dimension.id+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z+'/'+id;
function scriptedReplace(b,permutation){
 const old=b.typeId;if(old===permutation.type.id||!old.startsWith(NS+':')){b.setPermutation(permutation);return;}
 const k=breakKey(b,old),token={tick:system.currentTick},q=pendingBreaks.get(k)??[];q.push(token);pendingBreaks.set(k,q);
 const clear=()=>{const rows=pendingBreaks.get(k);if(!rows)return;const i=rows.indexOf(token);if(i>=0)rows.splice(i,1);if(!rows.length)pendingBreaks.delete(k);};
 try{b.setPermutation(permutation);}catch(err){clear();throw err;}system.runTimeout(clear,3);
}
function consumeBreak(b,id){const k=breakKey(b,id),q=(pendingBreaks.get(k)??[]).filter(t=>system.currentTick-t.tick<3);if(!q.length){pendingBreaks.delete(k);return false;}q.shift();if(q.length)pendingBreaks.set(k,q);else pendingBreaks.delete(k);return true;}
function removeUnsupported(b,item){
 const old=world.getDynamicProperty(key(b)),permutation=b.permutation;let spawned;
 return breakFeedback.transaction(b,()=>{
  try{
   if(item&&world.gameRules.doTileDrops!==false){spawned=b.dimension.spawnItem(new ItemStack(item),center(b));if(!spawned)throw Error('SUPPORT_DROP_FAILED');}
   save(b,undefined);scriptedReplace(b,BlockPermutation.resolve('minecraft:air'));
  }catch(err){try{spawned?.remove();}catch{}world.setDynamicProperty(key(b),old);b.setPermutation(permutation);throw err;}
 });
}
function say(p,key,args=[]){p.onScreenDisplay.setActionBar({translate:'kwl.'+key,with:args});}
function managedQualityLore(item){
 if(!/^(kaleidoscope_tavern|kaleidoscope_world_liquor):[a-z_]+_q[1-6]$/.test(item?.typeId??''))return false;
 const raw=item.getRawLore?.();if(!Array.isArray(raw)||!raw.length)return false;
 const rows=raw.map(row=>JSON.stringify(row));
 return rows.some(row=>row.includes('tooltip.kaleidoscope_tavern.bottle_block.brew_level'))
  &&rows.at(-1).includes('item.kaleidoscope_tavern.mod_name');
}
function plain(item){return !item||!item.nameTag&&(!item.getLore().length||managedQualityLore(item))&&!item.getDynamicPropertyIds().length&&!item.getComponent('minecraft:enchantable')?.getEnchantments().length;}
// Plan inventory changes on copies, then commit storage and inventory together.
// A full inventory leaves the machine and held item untouched.
function transaction(p,b,next,{take=0,give=[],permutation}={}){
 const inv=container(p),snapshot=Array.from({length:inv.size},(_,i)=>inv.getItem(i)),after=snapshot.map(x=>x?.clone()),slot=p.selectedSlotIndex,held=after[slot];
 if(take&&!creative(p)){if(!held||held.amount<take)throw Error('Missing held item');if(held.amount===take)after[slot]=undefined;else held.amount-=take;}
 for(const [id,count] of give){let amount=count;const sample=new ItemStack(id);
  for(let i=0;i<after.length&&amount;i++)if(after[i]?.isStackableWith(sample)){const n=Math.min(amount,after[i].maxAmount-after[i].amount);after[i].amount+=n;amount-=n;}
  for(let i=0;i<after.length&&amount;i++)if(!after[i]){const n=Math.min(amount,sample.maxAmount);after[i]=new ItemStack(id,n);amount-=n;}
  if(amount){say(p,'inventory_full');return false;}
 }
 const old=world.getDynamicProperty(key(b)),perm=b.permutation;
 try{save(b,next);if(permutation)scriptedReplace(b,permutation);for(let i=0;i<after.length;i++)inv.setItem(i,after[i]);if(b.typeId===NS+':freezer')try{syncFreezerVisuals(b,next??{},savedFreezerRecipes);}catch(err){console.warn('[World Liquor visuals] '+err);}return true;}
 catch(e){pendingBreaks.delete(breakKey(b,perm.type.id));world.setDynamicProperty(key(b),old);b.setPermutation(perm);for(let i=0;i<snapshot.length;i++)inv.setItem(i,snapshot[i]);throw e;}
}
function freezer(p,b,s,h){
 if(s.remaining>0){say(p,'remaining',[String(Math.max(0,Math.floor(s.remaining/20)))]);return;}
 const open=b.permutation.getState(NS+':open');
 if(p.isSneaking){
  if(!open&&safeBlock(b.dimension,plus(b.location,{x:0,y:1,z:0}))?.isSolid){say(p,'blocked');return;}
  if(open)s=startFreezerRecipe(s,FREEZER_RECIPES);
  transaction(p,b,s,{permutation:b.permutation.withState(NS+':open',!open)});b.dimension.playSound(open?'block.barrel.close':'block.barrel.open',center(b));return;
 }
 if(!open)return;
 if(s.output){
  const raw=world.getDynamicProperty(key(b));
  const result=extractFreezerOutput(p,s,savedFreezerRecipes.find(r=>r.id===s.recipe),{createStack:(id,n)=>new ItemStack(id,n),commit:next=>save(b,next),restore:()=>world.setDynamicProperty(key(b),raw)});
  if(result.status==='NEED_ITEM')say(p,'need_item',{rawtext:[{translate:result.required==='minecraft:bowl'?'item.bowl.name':result.required}]});
  // The original Block.useItemOn/useWithoutItem plays pickup after the BE
  // extraction attempt, including a rejected ingredient. Sound failure is
  // cosmetic and must not undo the settled item/output count.
  try{b.dimension.playSound('kaleidoscope_world_liquor.java.freezer_pickup',center(b),{volume:1,pitch:1});}catch(error){console.warn('[World Liquor freezer audio] '+error);}
  if(result.status==='NEED_ITEM')return;
  if(result.status==='EXTRACTED')try{syncFreezerVisuals(b,result.state,savedFreezerRecipes);}catch(error){console.warn('[World Liquor visuals] '+error);}
  return;
 }
 if(h?.typeId==='minecraft:milk_bucket'&&!s.fluid){
  const raw=world.getDynamicProperty(key(b));
  const result=fillFreezerMilk(p,s,{createStack:(id,n)=>new ItemStack(id,n),commit:next=>save(b,next),restore:()=>world.setDynamicProperty(key(b),raw)});
  if(result.status==='FILLED'){
   try{b.dimension.playSound('kaleidoscope_world_liquor.java.freezer_bucket_empty',center(b),{volume:1,pitch:1});}catch(error){console.warn('[World Liquor freezer audio] '+error);}
   try{syncFreezerVisuals(b,result.state,savedFreezerRecipes);}catch(error){console.warn('[World Liquor visuals] '+error);}
  }
  return;
 }
 if(h?.typeId in liquids&&h.typeId!=='minecraft:milk_bucket'){if(s.fluid)return;s.fluid=liquids[h.typeId];transaction(p,b,s,{take:1,give:creative(p)?[]:[['minecraft:bucket',1]]});return;}
 if(h?.typeId==='minecraft:bucket'&&s.fluid){const filled=Object.keys(liquids).find(x=>liquids[x]===s.fluid);if(filled){s.fluid=null;transaction(p,b,s,{take:1,give:[[filled,1]]});}return;}
 if(h){if(!plain(h)||s.input.length>=4)return;s.input.push(h.typeId);transaction(p,b,s,{take:1});}
 else if(s.input.length){const id=s.input.pop();transaction(p,b,s,{give:[[id,1]]});}
}
function freezerRedstone(event){
 if(event.block?.typeId!==NS+':freezer'||!Number.isFinite(event.powerLevel))return;
 const dimension=event.block.dimension,position={...event.block.location},powered=event.powerLevel>0;
 system.run(()=>{try{
  const block=safeBlock(dimension,position);if(block?.typeId!==NS+':freezer')return;
  const previous=block.permutation,oldRaw=world.getDynamicProperty(key(block));
  const open=previous.getState(NS+':open'),blocked=!!safeBlock(dimension,plus(position,{x:0,y:1,z:0}))?.isSolid;
  const plan=freezerPowerTransition(read(block),open,powered,blocked,FREEZER_RECIPES);if(!plan.changed)return;
  try{save(block,plan.state);if(plan.open!==open)block.setPermutation(previous.withState(NS+':open',plan.open));}
  catch(error){world.setDynamicProperty(key(block),oldRaw);block.setPermutation(previous);throw error;}
  // Cosmetic failure must not roll back a successfully committed craft.
  try{syncFreezerVisuals(block,plan.state,savedFreezerRecipes);if(plan.open!==open)dimension.playSound(plan.open?'block.barrel.open':'block.barrel.close',center(block));}catch(error){console.warn('[World Liquor freezer visuals] '+error);}
 }catch(error){console.warn('[World Liquor freezer redstone] '+error);}});
}
function sit(p,b){const anchor=key(b);let seat=b.dimension.getEntities({type:NS+':seat',location:center(b),maxDistance:1}).find(e=>e.getDynamicProperty(NS+':anchor')===anchor);
 if(!seat){seat=b.dimension.spawnEntity(NS+':seat',plus(b.location,{x:.5,y:0,z:.5}));seat.setDynamicProperty(NS+':anchor',anchor);seat.setDynamicProperty(NS+':position',JSON.stringify(b.location));seat.setDynamicProperty(NS+':block',b.typeId);}
 const yaw=[180,-90,0,90][b.permutation.getState(FACING)??0];seat.setProperty(KT+':seat_yaw',yaw);seat.setRotation({x:0,y:yaw});seat.getComponent('minecraft:rideable').addRider(p);
}
const wallRemovalTicks=new Map();
// One-tick crafting must not turn a corrupt saved row or renderer fault into
// twenty operator log messages per second. Gameplay still retries each tick.
const tickFailureLogs=new Map();
function tickWarning(block,error){
 let id;try{id=key(block);}catch{id='unavailable';}
 const last=tickFailureLogs.get(id);if(last!==undefined&&system.currentTick-last<80)return;
 tickFailureLogs.set(id,system.currentTick);if(tickFailureLogs.size>128)tickFailureLogs.delete(tickFailureLogs.keys().next().value);
 console.warn('[World Liquor] '+error);
}
function recentlyRemovedWall(b){const t=wallRemovalTicks.get(key(b));return t!==undefined&&system.currentTick-t<=2;}
function removeWallRecord(b,{permutation=b.permutation,player,native=false}={}){
 if(recentlyRemovedWall(b))return;
 const storageKey=key(b),old=world.getDynamicProperty(storageKey);let spawned;
 wallRemovalTicks.set(storageKey,system.currentTick);
 try{
  const item=wallRecordItem(permutation);
  if((!player||!creative(player))&&world.gameRules.doTileDrops!==false){
   spawned=b.dimension.spawnItem(new ItemStack(item),center(b));
   if(!spawned)throw Error('Wall record drop was not created');
  }
  if(!native)scriptedReplace(b,BlockPermutation.resolve('minecraft:air'));
  save(b,undefined);
 }catch(err){
  // Keep the disc recoverable on drop/write failure. Do not overwrite a new
  // unrelated block if some other handler replaced this location meanwhile.
  try{if(spawned)spawned.remove();}catch{}
  wallRemovalTicks.delete(storageKey);pendingBreaks.delete(breakKey(b,permutation.type.id));
  try{if(b.isAir||b.typeId===WALL_RECORD)b.setPermutation(permutation);world.setDynamicProperty(storageKey,old);}catch{}
  throw err;
 }
}
function record(p,b,s,h){if(h)return;if(!s.record)return;const k=key(b);wallRemovalTicks.set(k,system.currentTick);try{if(transaction(p,b,undefined,{give:[[s.record,1]],permutation:BlockPermutation.resolve('minecraft:air')}))b.dimension.playSound('itemframe.remove_item',center(b));else wallRemovalTicks.delete(k);}catch(err){wallRemovalTicks.delete(k);throw err;}}
function interact(p,b,face,point){
 if(!furniture(b.typeId)||!mutable(p)&&!(b.typeId===NS+':freezer'&&String(p.getGameMode()).toLowerCase()==='adventure'))return;const stamp=p.id+'/'+key(b);if(system.currentTick-(cooldown.get(stamp)??-100)<5)return;cooldown.set(stamp,system.currentTick);
 const s=read(b),h=hand(p);if(b.typeId.endsWith(':freezer'))freezer(p,b,s,h);else if(b.typeId.endsWith(':wall_record'))record(p,b,s,h);else if(b.typeId.includes(':bar_stool_')&&!h&&!p.isSneaking)sit(p,b);
}
function tick(b){if(b.typeId.endsWith(':freezer')){const plan=advanceFreezerTick(read(b),savedFreezerRecipes);if(plan.changed)save(b,plan.state);if(plan.refresh||!plan.changed&&system.currentTick%80===0)syncFreezerVisuals(b,plan.state,savedFreezerRecipes);}else if(b.typeId.endsWith(':wall_record')||b.typeId.endsWith('_painting')){const f=b.permutation.getState(FACING)??0,attach=b.typeId.endsWith('_painting')?(b.permutation.getState(KT+':attach_face')??0):0,v=attach===1?{x:0,y:-1,z:0}:attach===2?{x:0,y:1,z:0}:vectors[(f+2)%4],support=safeBlock(b.dimension,plus(b.location,v));if(support?.isAir){if(b.typeId===WALL_RECORD){breakFeedback.transaction(b,()=>removeWallRecord(b));return;}removeUnsupported(b,b.typeId);}}}
function drops(b,oldType,p){const s=read(b);save(b,undefined);if((!p||!creative(p))&&world.gameRules.doTileDrops!==false){const out=[[oldType.endsWith(':wall_record')?s.record:oldType,1],...(s.slots??[]).filter(Boolean).map(id=>[id,1]),...(s.input??[]).map(id=>[id,1])];if(s.output){const r=savedFreezerRecipes.find(r=>r.id===s.recipe);if(r)out.push([r.result.id,s.output]);}for(const [id,n] of out)if(id)b.dimension.spawnItem(new ItemStack(id,n),center(b));}
 for(const e of b.dimension.getEntities({families:['kwl_visual'],location:center(b),maxDistance:2}))if(e.getDynamicProperty(NS+':anchor')===key(b))e.remove();
}
export function registerFurniture(e){e.blockComponentRegistry.registerCustomComponent(NS+':freezer_redstone',{onRedstoneUpdate:freezerRedstone});e.blockComponentRegistry.registerCustomComponent(NS+':furniture',{
 beforeOnPlayerPlace:e=>{let perm=e.permutationToPlace;if(perm.type.id===NS+':freezer')perm=perm.withState(FACING,['north','east','south','west'].indexOf(perm.getState('minecraft:cardinal_direction')));else if(e.player)perm=perm.withState(FACING,rotation(e.player));e.permutationToPlace=perm;},
 onPlace:e=>{pendingBreaks.delete(breakKey(e.block,e.block.typeId));if(isManagedCabinet(e.block.typeId)){forwardFurnitureTick(system,e.block);return;}if(e.block.typeId===WALL_RECORD){wallRemovalTicks.delete(key(e.block));save(e.block,read(e.block));return;}save(e.block,undefined);},
 onPlayerInteract:e=>{try{if(isManagedCabinet(e.block.typeId)){forwardNativeUse(e);return;}interact(e.player,e.block,e.face,e.faceLocation);}catch(err){console.warn('[World Liquor] '+err);}},
 onTick:e=>{try{if(isManagedCabinet(e.block.typeId)){forwardFurnitureTick(system,e.block);return;}tick(e.block);}catch(err){tickWarning(e.block,err);}},
 onBreak:e=>{try{if(consumeBreak(e.block,e.brokenBlockPermutation.type.id))return;if(e.brokenBlockPermutation.type.id===WALL_RECORD){removeWallRecord(e.block,{permutation:e.brokenBlockPermutation,player:e.entitySource?.typeId==='minecraft:player'?e.entitySource:undefined,native:true});return;}if(isManagedCabinet(e.brokenBlockPermutation.type.id))return;drops(e.block,e.brokenBlockPermutation.type.id,e.entitySource?.typeId==='minecraft:player'?e.entitySource:undefined);}catch(err){console.warn('[World Liquor] '+err);}}
 });}
export function installFurniture(){
 installRecordCleanup();
 // Missing/old host: preserve legacy contents rather than falling back to a
 // second storage engine or allowing a native break to destroy saved contents.
 const unavailable=player=>system.run(()=>{try{player.sendMessage('§e[World Liquor] 需要配套的酒館共用底層版本；酒櫃內容已保留。');}catch{}});
 world.beforeEvents.playerBreakBlock.subscribe(e=>{if(isManagedCabinet(e.block.typeId)&&!foundationReady()){e.cancel=true;unavailable(e.player);}});
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(!foundationReady()&&(isManagedCabinet(e.block.typeId)||isManagedCabinet(e.itemStack?.typeId))){e.cancel=true;if(e.isFirstEvent!==false)unavailable(e.player);return;}
  if(e.block.typeId==='minecraft:jukebox'&&(e.itemStack?.typeId===NS+':custom_record'||read(e.block).record)){
   e.cancel=true;if(e.isFirstEvent===false)return;const p=e.player,b=e.block;system.run(()=>{try{if(!mutable(p)||b.typeId!=='minecraft:jukebox')return;const h=hand(p),s=read(b);if(s.record&&!h){if(transaction(p,b,undefined,{give:[[s.record,1]]}))stopRecord(b,s);return;}if(h?.typeId!==NS+':custom_record'||s.record||b.getComponent('minecraft:record_player')?.getRecord())return;s.record=h.typeId;s.recordSound=reserveRecordSound();if(transaction(p,b,s,{take:1})){playRecord(b,s);say(p,'now_playing');}}catch(err){console.warn('[World Liquor] '+err);}});return;
  }
  if(furniture(e.block.typeId)){
   const id=e.block.typeId,held=e.itemStack?.typeId;
   const wantsUse=id.endsWith(':freezer')
    ||id.endsWith(':wall_record')&&!held
    ||id.includes(':bar_stool_')&&!held&&!e.player.isSneaking;
   if(wantsUse){
    e.cancel=true;if(e.isFirstEvent===false)return;
    const p=e.player,b=e.block,face=e.blockFace,point=e.faceLocation;
    system.run(()=>{try{if(furniture(b.typeId))interact(p,b,face,point);}catch(err){console.warn('[World Liquor] '+err);}});
    return;
   }
  }
  const disc=e.itemStack?.typeId;
  if(e.player.isSneaking&&(disc===NS+':custom_record'||disc in RECORD_MODELS)&&['north','east','south','west'].includes(String(e.blockFace).toLowerCase())){
   e.cancel=true;if(e.isFirstEvent===false)return;const p=e.player,d=e.block.dimension,face=String(e.blockFace).toLowerCase(),f=['north','east','south','west'].indexOf(face),pos=plus(e.block.location,vectors[f]),supportPos={...e.block.location},supportType=e.block.typeId,slot=p.selectedSlotIndex;
   system.run(()=>{try{const b=safeBlock(d,pos),h=hand(p);if(!mutable(p)||p.dimension.id!==d.id||p.selectedSlotIndex!==slot||safeBlock(d,supportPos)?.typeId!==supportType||!b?.isAir||h?.typeId!==disc)return;const index=RECORD_MODELS[disc]??19+Math.floor(Math.random()*6),perm=BlockPermutation.resolve(NS+':wall_record',{[FACING]:f,[NS+':model_group']:Math.floor(index/5),[NS+':model_variant']:index%5});if(transaction(p,b,{record:disc},{take:1,permutation:perm}))d.playSound('itemframe.add_item',center(b));}catch(err){console.warn('[World Liquor] '+err);}});return;
  }
  const id=e.itemStack?.typeId;if(!id?.startsWith(NS+':')||!id.endsWith('_painting'))return;e.cancel=true;if(e.isFirstEvent===false)return;
  const p=e.player,d=e.block.dimension,face=String(e.blockFace).toLowerCase(),v={north:vectors[0],east:vectors[1],south:vectors[2],west:vectors[3],up:{x:0,y:1,z:0},down:{x:0,y:-1,z:0}}[face],pos=plus(e.block.location,v);
  system.run(()=>{try{if(!mutable(p)||hand(p)?.typeId!==id)return;const b=safeBlock(d,pos);if(!b?.isAir)return;const f=['north','east','south','west'].indexOf(face),perm=BlockPermutation.resolve(id,{[FACING]:f<0?rotation(p):f,[KT+':attach_face']:face==='up'?1:face==='down'?2:0});transaction(p,b,undefined,{take:1,permutation:perm});}catch(err){console.warn('[World Liquor] '+err);}});
 });
 const clean=e=>{try{if(!e.typeId.startsWith(NS+':')||!e.getDynamicProperty(NS+':position'))return;const b=safeBlock(e.dimension,JSON.parse(e.getDynamicProperty(NS+':position')));if(b&&b.typeId!==e.getDynamicProperty(NS+':block'))e.remove();}catch{}};
 world.afterEvents.entityLoad.subscribe(e=>system.run(()=>clean(e.entity)));
 world.afterEvents.playerBreakBlock.subscribe(e=>{if(e.brokenBlockPermutation.type.id!=='minecraft:jukebox')return;const s=read(e.block);if(!s.record)return;stopRecord(e.block,s);save(e.block,undefined);if(e.player.getGameMode()!=='Creative')e.dimension.spawnItem(new ItemStack(s.record),center(e.block));});
 system.runInterval(()=>{cooldown.clear();for(const [k,t] of wallRemovalTicks)if(system.currentTick-t>2)wallRemovalTicks.delete(k);for(const p of world.getAllPlayers())for(const e of p.dimension.getEntities({families:['kwl_visual'],location:p.location,maxDistance:24}))clean(e);},600);
}
