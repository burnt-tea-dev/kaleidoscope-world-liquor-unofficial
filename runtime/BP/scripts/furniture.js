import {world,system,ItemStack,BlockPermutation} from '@minecraft/server';
import {FREEZER_RECIPES} from './freezer-recipes.js';
import {VISUAL_ITEMS} from './visual-items.js';
import {COMPACT_ITEMS} from './compact-items.js';
import {RECORD_MODELS} from './wall-record-models.js';
export const NS='kaleidoscope_world_liquor',KT='kaleidoscope_tavern',FACING=KT+':facing';
const vectors=[{x:0,y:0,z:-1},{x:1,y:0,z:0},{x:0,y:0,z:1},{x:-1,y:0,z:0}], compact=new Set(COMPACT_ITEMS),cooldown=new Map();
const liquids={'minecraft:water_bucket':'minecraft:water','minecraft:lava_bucket':'minecraft:lava','minecraft:milk_bucket':NS+':milk_still',[KT+':grape_bucket']:KT+':grape_juice',[KT+':sweet_berries_bucket']:KT+':sweet_berries_juice'};
const container=player=>player.getComponent('minecraft:inventory').container;
export const hand=player=>container(player).getItem(player.selectedSlotIndex);
const creative=p=>p.getGameMode()==='Creative';
const mutable=p=>!['Adventure','Spectator'].includes(p.getGameMode());
const key=b=>NS+':storage/'+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
const center=b=>({x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5});
const plus=(p,v)=>({x:p.x+v.x,y:p.y+(v.y??0),z:p.z+v.z});
const rotation=p=>(Math.round(p.getRotation().y/90)+2+4)%4;
const furniture=id=>id?.startsWith(NS+':')&&(/_cabinet$|:freezer$|:bar_stool_|_painting$|:wall_record$/.test(id));
const read=b=>JSON.parse(world.getDynamicProperty(key(b))??'null')??{type:b.typeId,slots:Array(b.typeId.includes('cellar_cabinet')?9:2).fill(null),input:[],fluid:null,recipe:null,remaining:0,output:0};
const save=(b,s)=>world.setDynamicProperty(key(b),s?JSON.stringify(s):undefined);
const safeBlock=(d,p)=>{try{return d.getBlock(p);}catch{return undefined;}};
function say(p,key,args=[]){p.onScreenDisplay.setActionBar({translate:'kwl.'+key,with:args});}
function plain(item){return !item||!item.nameTag&&!item.getLore().length&&!item.getDynamicPropertyIds().length&&!item.getComponent('minecraft:enchantable')?.getEnchantments().length;}
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
 try{save(b,next);if(permutation)b.setPermutation(permutation);for(let i=0;i<after.length;i++)inv.setItem(i,after[i]);return true;}
 catch(e){world.setDynamicProperty(key(b),old);b.setPermutation(perm);for(let i=0;i<snapshot.length;i++)inv.setItem(i,snapshot[i]);throw e;}
}
function freezer(p,b,s,h){
 if(s.remaining>0){say(p,'remaining',[String(Math.ceil(s.remaining/20))]);return;}
 const open=b.permutation.getState(NS+':open');
 if(p.isSneaking){
  if(!open&&safeBlock(b.dimension,plus(b.location,{x:0,y:1,z:0}))?.isSolid){say(p,'blocked');return;}
  if(open&&!s.output){const r=FREEZER_RECIPES.find(r=>r.fluid===s.fluid&&r.ingredients.length===s.input.length&&r.ingredients.every((opts,i)=>opts.includes(s.input[i])));if(r){s.recipe=r.id;s.remaining=r.craft_time;s.fluid=null;s.input=[];}}
  transaction(p,b,s,{permutation:b.permutation.withState(NS+':open',!open)});b.dimension.playSound(open?'block.barrel.close':'block.barrel.open',center(b));return;
 }
 if(!open)return;
 if(s.output){const r=FREEZER_RECIPES.find(r=>r.id===s.recipe),required=r?.extract_condition?.item;if(!r)return;if(required&&h?.typeId!==required){say(p,'need_item',[required]);return;}s.output--;transaction(p,b,s,{take:required?1:0,give:[[r.result.id,1]]});return;}
 if(h?.typeId in liquids){if(s.fluid)return;s.fluid=liquids[h.typeId];transaction(p,b,s,{take:1,give:creative(p)?[]:[['minecraft:bucket',1]]});return;}
 if(h?.typeId==='minecraft:bucket'&&s.fluid){const filled=Object.keys(liquids).find(x=>liquids[x]===s.fluid);if(filled){s.fluid=null;transaction(p,b,s,{take:1,give:[[filled,1]]});}return;}
 if(h){if(!plain(h)||s.input.length>=4)return;s.input.push(h.typeId);transaction(p,b,s,{take:1});}
 else if(s.input.length){const id=s.input.pop();transaction(p,b,s,{give:[[id,1]]});}
}
function neighbor(b,f,side){return safeBlock(b.dimension,plus(b.location,vectors[(f+side+4)%4]));}
function connect(b){const f=b.permutation.getState(FACING)??0,match=x=>x?.typeId===b.typeId&&x.permutation.getState(FACING)===f,l=match(neighbor(b,f,1)),r=match(neighbor(b,f,3)),pos=l&&r?'middle':l?'right':r?'left':'single';if(b.permutation.getState(NS+':position')!==pos)b.setPermutation(b.permutation.withState(NS+':position',pos));}
function localPoint(b,point){if(!point)return {x:.5,y:.5,z:.5};return {x:Math.min(1,Math.max(0,point.x)),y:Math.min(1,Math.max(0,point.y)),z:Math.min(1,Math.max(0,point.z))};}
function cabinet(p,b,s,h,face,point){
 const f=b.permutation.getState(FACING)??0,cellar=b.typeId.includes('cellar_cabinet'),v=localPoint(b,point);let slot;
 if(cellar){if(String(face).toLowerCase()!==['north','east','south','west'][f])return;const x=f===0?1-v.x:f===2?v.x:f===1?1-v.z:v.z;slot=Math.min(2,Math.floor(x*3))+(2-Math.min(2,Math.floor(v.y*3)))*3;}
 else {const left=f===0?v.x>.5:f===2?v.x<.5:f===1?v.z<.5:v.z>.5;slot=left?0:1;if(s.single)slot=0;else if(h&&s.slots[slot]&&!s.slots[1-slot])slot=1-slot;else if(!h&&!s.slots[slot]&&s.slots[1-slot])slot=1-slot;}
 if(!h){const id=s.slots[slot];if(!id)return;s.slots[slot]=null;s.single=false;if(transaction(p,b,s,{give:[[id,1]]}))syncVisuals(b,s);return;}
 if(!(h.typeId in VISUAL_ITEMS)||!plain(h)||s.slots[slot]||s.single)return;
 if(cellar&&!compact.has(h.typeId))return;
 if(!cellar&&/^kaleidoscope_tavern:(brandy|carignan)_q/.test(h.typeId)){if(s.slots.some(Boolean))return;s.single=true;slot=0;}
 s.slots[slot]=h.typeId;if(transaction(p,b,s,{take:1}))syncVisuals(b,s);
}
function rotate(x,z,f){return f===0?{x,z}:f===1?{x:-z,z:x}:f===2?{x:-x,z:-z}:{x:z,z:-x};}
function syncVisuals(b,s){const anchor=key(b),cellar=b.typeId.includes('cellar_cabinet'),f=b.permutation.getState(FACING)??0,existing=b.dimension.getEntities({location:center(b),maxDistance:2,families:['kwl_visual']}).filter(e=>e.getDynamicProperty(NS+':anchor')===anchor);
 for(let slot=0;slot<s.slots.length;slot++){
  const item=s.slots[slot],all=existing.filter(e=>e.getDynamicProperty(NS+':slot')===slot);let e=all.shift();for(const dup of all)dup.remove();
  if(!item){e?.remove();continue;}
  const row=Math.floor(slot/3),col=slot%3,dx=cellar?.325-col*.325:s.single?0:(slot===0?1:-1)*((f===0||f===2)?.25:-.25),r=rotate(dx,cellar?.375:0,f),at=plus(b.location,{x:.5+r.x,y:cellar?.78-row*.29:.0625,z:.5+r.z});
  if(!e){e=b.dimension.spawnEntity(NS+':cabinet_'+(cellar?'cellar':'bar'),at);e.setDynamicProperty(NS+':anchor',anchor);e.setDynamicProperty(NS+':position',JSON.stringify(b.location));e.setDynamicProperty(NS+':block',b.typeId);e.setDynamicProperty(NS+':slot',slot);}
  e.setProperty(NS+':kind',VISUAL_ITEMS[item]);e.teleport(at,{rotation:{x:cellar?-90:0,y:[0,90,180,-90][f]}});
 }
}
function sit(p,b){const anchor=key(b);let seat=b.dimension.getEntities({type:NS+':seat',location:center(b),maxDistance:1}).find(e=>e.getDynamicProperty(NS+':anchor')===anchor);
 if(!seat){seat=b.dimension.spawnEntity(NS+':seat',plus(b.location,{x:.5,y:0,z:.5}));seat.setDynamicProperty(NS+':anchor',anchor);seat.setDynamicProperty(NS+':position',JSON.stringify(b.location));seat.setDynamicProperty(NS+':block',b.typeId);}
 const yaw=[180,-90,0,90][b.permutation.getState(FACING)??0];seat.setProperty(KT+':seat_yaw',yaw);seat.setRotation({x:0,y:yaw});seat.getComponent('minecraft:rideable').addRider(p);
}
function record(p,b,s,h){if(h)return;if(!s.record)return;if(transaction(p,b,undefined,{give:[[s.record,1]],permutation:BlockPermutation.resolve('minecraft:air')}))b.dimension.playSound('itemframe.remove_item',center(b));}
function interact(p,b,face,point){
 if(!mutable(p)||!furniture(b.typeId))return;const stamp=p.id+'/'+key(b);if(system.currentTick-(cooldown.get(stamp)??-100)<5)return;cooldown.set(stamp,system.currentTick);
 const s=read(b),h=hand(p);if(b.typeId.endsWith(':freezer'))freezer(p,b,s,h);else if(b.typeId.includes('_cabinet'))cabinet(p,b,s,h,face,point);else if(b.typeId.endsWith(':wall_record'))record(p,b,s,h);else if(b.typeId.includes(':bar_stool_')&&!h&&!p.isSneaking)sit(p,b);
}
function tick(b){if(b.typeId.endsWith(':freezer')){const s=read(b);if(s.remaining>0){s.remaining=Math.max(0,s.remaining-20);if(!s.remaining){const r=FREEZER_RECIPES.find(r=>r.id===s.recipe);s.output=r?.result.count??1;}save(b,s);}}else if(b.typeId.includes('_cabinet')){connect(b);syncVisuals(b,read(b));}else if(b.typeId.endsWith(':wall_record')||b.typeId.endsWith('_painting')){const f=b.permutation.getState(FACING)??0,attach=b.typeId.endsWith('_painting')?(b.permutation.getState(KT+':attach_face')??0):0,v=attach===1?{x:0,y:-1,z:0}:attach===2?{x:0,y:1,z:0}:vectors[(f+2)%4],support=safeBlock(b.dimension,plus(b.location,v));if(support?.isAir){const item=b.typeId.endsWith(':wall_record')?read(b).record:b.typeId;save(b,undefined);b.setType('minecraft:air');if(item)b.dimension.spawnItem(new ItemStack(item),center(b));}}}
function drops(b,oldType,p){const s=read(b);save(b,undefined);if(p&&!creative(p)){const out=[[oldType.endsWith(':wall_record')?s.record:oldType,1],...(s.slots??[]).filter(Boolean).map(id=>[id,1]),...(s.input??[]).map(id=>[id,1])];if(s.output){const r=FREEZER_RECIPES.find(r=>r.id===s.recipe);if(r)out.push([r.result.id,s.output]);}for(const [id,n] of out)if(id)b.dimension.spawnItem(new ItemStack(id,n),center(b));}
 for(const e of b.dimension.getEntities({families:['kwl_visual'],location:center(b),maxDistance:2}))if(e.getDynamicProperty(NS+':anchor')===key(b))e.remove();
}
export function registerFurniture(e){e.blockComponentRegistry.registerCustomComponent(NS+':furniture',{
 beforeOnPlayerPlace:e=>{let perm=e.permutationToPlace;if(e.player)perm=perm.withState(FACING,rotation(e.player));e.permutationToPlace=perm;},
 onPlace:e=>{save(e.block,undefined);},
 onPlayerInteract:e=>{try{interact(e.player,e.block,e.face,e.faceLocation);}catch(err){console.warn('[World Liquor] '+err);}},
 onTick:e=>{try{tick(e.block);}catch(err){console.warn('[World Liquor] '+err);}},
 onPlayerBreak:e=>{try{drops(e.block,e.brokenBlockPermutation.type.id,e.player);}catch(err){console.warn('[World Liquor] '+err);}}
 });}
export function installFurniture(){
 world.beforeEvents.playerInteractWithBlock.subscribe(e=>{
  if(e.block.typeId==='minecraft:jukebox'&&(e.itemStack?.typeId===NS+':custom_record'||!e.itemStack&&read(e.block).record)){
   e.cancel=true;if(e.isFirstEvent===false)return;const p=e.player,b=e.block;system.run(()=>{try{const h=hand(p),s=read(b);if(s.record&&!h){transaction(p,b,undefined,{give:[[s.record,1]]});return;}if(h?.typeId!==NS+':custom_record'||s.record)return;s.record=h.typeId;if(transaction(p,b,s,{take:1}))b.dimension.playSound(NS+'.music_disc.random_disc',center(b));}catch(err){console.warn('[World Liquor] '+err);}});return;
  }
  if(furniture(e.block.typeId)){e.cancel=true;if(e.isFirstEvent===false)return;const p=e.player,b=e.block,face=e.blockFace,point=e.faceLocation;system.run(()=>{try{if(furniture(b.typeId))interact(p,b,face,point);}catch(err){console.warn('[World Liquor] '+err);}});return;}
  const disc=e.itemStack?.typeId;
  if(e.player.isSneaking&&(disc===NS+':custom_record'||disc in RECORD_MODELS)&&['north','east','south','west'].includes(String(e.blockFace).toLowerCase())){
   e.cancel=true;if(e.isFirstEvent===false)return;const p=e.player,d=e.block.dimension,face=String(e.blockFace).toLowerCase(),f=['north','east','south','west'].indexOf(face),pos=plus(e.block.location,vectors[f]);
   system.run(()=>{try{const b=safeBlock(d,pos),h=hand(p);if(!mutable(p)||!b?.isAir||h?.typeId!==disc)return;const index=RECORD_MODELS[disc]??19+Math.floor(Math.random()*6),perm=BlockPermutation.resolve(NS+':wall_record',{[FACING]:f,[NS+':model_group']:Math.floor(index/5),[NS+':model_variant']:index%5});if(transaction(p,b,{record:disc},{take:1,permutation:perm}))d.playSound('itemframe.add_item',center(b));}catch(err){console.warn('[World Liquor] '+err);}});return;
  }
  const id=e.itemStack?.typeId;if(!id?.startsWith(NS+':')||!id.endsWith('_painting'))return;e.cancel=true;if(e.isFirstEvent===false)return;
  const p=e.player,d=e.block.dimension,face=String(e.blockFace).toLowerCase(),v={north:vectors[0],east:vectors[1],south:vectors[2],west:vectors[3],up:{x:0,y:1,z:0},down:{x:0,y:-1,z:0}}[face],pos=plus(e.block.location,v);
  system.run(()=>{try{if(!mutable(p)||hand(p)?.typeId!==id)return;const b=safeBlock(d,pos);if(!b?.isAir)return;const f=['north','east','south','west'].indexOf(face),perm=BlockPermutation.resolve(id,{[FACING]:f<0?rotation(p):f,[KT+':attach_face']:face==='up'?1:face==='down'?2:0});transaction(p,b,undefined,{take:1,permutation:perm});}catch(err){console.warn('[World Liquor] '+err);}});
 });
 const clean=e=>{try{if(!e.typeId.startsWith(NS+':')||!e.getDynamicProperty(NS+':position'))return;const b=safeBlock(e.dimension,JSON.parse(e.getDynamicProperty(NS+':position')));if(b&&b.typeId!==e.getDynamicProperty(NS+':block'))e.remove();}catch{}};
 world.afterEvents.entityLoad.subscribe(e=>system.run(()=>clean(e.entity)));
 world.afterEvents.playerBreakBlock.subscribe(e=>{if(e.brokenBlockPermutation.type.id!=='minecraft:jukebox')return;const s=read(e.block);if(!s.record)return;save(e.block,undefined);if(e.player.getGameMode()!=='Creative')e.dimension.spawnItem(new ItemStack(s.record),center(e.block));});
 system.runInterval(()=>{cooldown.clear();for(const p of world.getAllPlayers())for(const e of p.dimension.getEntities({families:['kwl_visual'],location:p.location,maxDistance:40}))clean(e);},100);
}
