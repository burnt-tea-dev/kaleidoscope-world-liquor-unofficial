import {world,system,BlockPermutation} from '@minecraft/server';
import {syncFreezerVisuals} from './freezer-visuals.js';
import {FREEZER_RECIPES} from './freezer-recipes.js';
import {playRecord,stopRecord} from './record-audio.js';
const check=(x,m)=>{if(!x)throw Error(m);},N='kaleidoscope_world_liquor';
// Recorded original FreezerRenderer.drawFloatingItems at (0,64,0).
// Slot 2's block-item row supplies X/Z/yaw only; dye remains an ordinary item.
const positions=[
 [[.6482304,.6095815],[.2506582,.64487547],[.61174726,.39470738],[.41195178,.37547034]],
 [[.39041853,.64823043],[.35512453,.25065827],[.60529256,.61174726],[.6245296,.41195184]],
 [[.35176963,.39041853],[.7493418,.35512453],[.38825276,.6052926],[.5880482,.62452966]],
 [[.6095815,.35176963],[.6448755,.7493417],[.39470744,.38825276],[.3754704,.5880482]]
],itemYaw=[146.34802,233.76578,8.712459,216.47821];
system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('liquid_probe',{dimension:d,from:{x:0,y:0,z:0},to:{x:15,y:100,z:15}});
 const p={x:0,y:64,z:0},b=d.getBlock(p);let cases=0;
 const count=()=>d.getEntities({families:['kwl_visual'],location:p,maxDistance:3}).filter(e=>e.typeId.startsWith(N+':freezer_')).length;
 for(let facing=0;facing<4;facing++){
  b.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:true,'kaleidoscope_tavern:facing':facing}));
  const repeated={fluid:N+':milk_still',input:Array(4).fill('minecraft:blue_dye')};
  syncFreezerVisuals(b,repeated,FREEZER_RECIPES);syncFreezerVisuals(b,repeated,FREEZER_RECIPES);
  const dyes=d.getEntities({type:N+':freezer_blue_dye_visual',location:p,maxDistance:3});check(dyes.length===4,'duplicate or missing dye');
  for(let slot=0;slot<4;slot++){
   const row=dyes.filter(e=>e.getDynamicProperty(N+':visual_slot')==='input'+slot);check(row.length===1,'original input slot');
   const e=row[0],at=e.location,want=positions[facing][slot];
   check(Math.abs(at.x-want[0])<.00001&&Math.abs(at.z-want[1])<.00001&&Math.abs(at.y-64-.65)<.00001,'original ingredient position');
   const yaw=e.getRotation().y-([180,-90,0,90][facing]-itemYaw[slot]);check(Math.abs(((yaw+180)%360+360)%360-180)<.0001,'original ingredient yaw');
  }
  for(const fluid of ['minecraft:water','minecraft:lava',N+':milk_still','kaleidoscope_tavern:grape_juice','kaleidoscope_tavern:sweet_berries_juice']){syncFreezerVisuals(b,{fluid,input:['minecraft:blue_dye','minecraft:snowball','minecraft:slime_ball']},FREEZER_RECIPES);check(count()===4,'fluid/input count');cases++;}
  for(const recipe of FREEZER_RECIPES){syncFreezerVisuals(b,{recipe:recipe.id,output:recipe.result.count},FREEZER_RECIPES);check(count()===1,'result surface');cases++;}
  syncFreezerVisuals(b,{input:[]},FREEZER_RECIPES);check(count()===0,'empty cleanup');
  b.setPermutation(b.permutation.withState(N+':open',false));syncFreezerVisuals(b,{fluid:'minecraft:water',input:['minecraft:snowball']},FREEZER_RECIPES);check(count()===0,'closed freezer');
 }
 for(const machine of ['barrel','pressing_tub'])for(const liquid of ['water','lava']){const e=d.spawnEntity('kaleidoscope_tavern:rig_liquid_'+machine+'_'+liquid+'_visual',p);for(const amount of [0,500,1000,2000,4000]){e.setProperty('kt_art:amount',amount);await new Promise(resolve=>system.runTimeout(resolve,2));check(e.getProperty('kt_art:amount')===amount,'liquid property '+machine+' '+liquid+' wanted='+amount+' actual='+e.getProperty('kt_art:amount'));}e.remove();}
 b.setType('minecraft:jukebox');const k=N+':storage/overworld/0_64_0',s={type:'minecraft:jukebox',record:N+':custom_record'};world.setDynamicProperty(k,JSON.stringify(s));const first=playRecord(b,s);stopRecord(b,s);const second=playRecord(b,s);check(first.id!==second.id,'sound instance identity');b.setType('minecraft:air');
 system.runTimeout(()=>{try{check(world.getDynamicProperty(k)===undefined,'record replacement cleanup');console.warn('PARITY_DONE freezer '+cases+' cases; liquid properties 20; independent sound instances and removal cleanup. No client visuals/audio acceptance.');}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},30);
}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},100);
