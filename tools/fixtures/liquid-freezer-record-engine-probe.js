import {world,system,BlockPermutation} from '@minecraft/server';
import {syncFreezerVisuals} from './freezer-visuals.js';
import {FREEZER_RECIPES} from './freezer-recipes.js';
import {reserveRecordSound,playRecord,stopRecord} from './record-audio.js';
const check=(x,m)=>{if(!x)throw Error(m);},N='kaleidoscope_world_liquor';
system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('liquid_probe',{dimension:d,from:{x:1104,y:0,z:1104},to:{x:1119,y:100,z:1119}});
 const p={x:1107,y:80,z:1107},b=d.getBlock(p);let cases=0;
 const count=()=>d.getEntities({families:['kwl_visual'],location:p,maxDistance:3}).filter(e=>e.typeId.startsWith(N+':freezer_')).length;
 for(let facing=0;facing<4;facing++){
  b.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:true,'kaleidoscope_tavern:facing':facing}));
  const repeated={fluid:N+':milk_still',input:Array(4).fill('minecraft:blue_dye')};
  syncFreezerVisuals(b,repeated,FREEZER_RECIPES);syncFreezerVisuals(b,repeated,FREEZER_RECIPES);
  const dyes=d.getEntities({type:N+':freezer_blue_dye_visual',location:p,maxDistance:3});check(dyes.length===4,'duplicate or missing dye');
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=dyes[i].location,c=dyes[j].location;check(Math.abs(a.x-c.x)>.25||Math.abs(a.z-c.z)>.25,'ingredient footprints overlap');}
  for(const fluid of ['minecraft:water','minecraft:lava',N+':milk_still','kaleidoscope_tavern:grape_juice','kaleidoscope_tavern:sweet_berries_juice']){syncFreezerVisuals(b,{fluid,input:['minecraft:blue_dye','minecraft:snowball','minecraft:slime_ball']},FREEZER_RECIPES);check(count()===4,'fluid/input count');cases++;}
  for(const recipe of FREEZER_RECIPES){syncFreezerVisuals(b,{recipe:recipe.id,output:recipe.result.count},FREEZER_RECIPES);check(count()===1,'result surface');cases++;}
  syncFreezerVisuals(b,{input:[]},FREEZER_RECIPES);check(count()===0,'empty cleanup');
  b.setPermutation(b.permutation.withState(N+':open',false));syncFreezerVisuals(b,{fluid:'minecraft:water',input:['minecraft:snowball']},FREEZER_RECIPES);check(count()===0,'closed freezer');
 }
 for(const machine of ['barrel','pressing_tub'])for(const liquid of ['water','lava']){const e=d.spawnEntity('kaleidoscope_tavern:rig_liquid_'+machine+'_'+liquid+'_visual',p);for(const amount of [0,500,1000,2000,4000]){e.setProperty('kt_art:amount',amount);await new Promise(resolve=>system.runTimeout(resolve,2));check(e.getProperty('kt_art:amount')===amount,'liquid property '+machine+' '+liquid+' wanted='+amount+' actual='+e.getProperty('kt_art:amount'));}e.remove();}
 b.setType('minecraft:jukebox');const k=N+':storage/overworld/1107_80_1107',s={record:N+':custom_record',recordSound:reserveRecordSound()};world.setDynamicProperty(k,JSON.stringify(s));check(reserveRecordSound()!==s.recordSound,'audio channel collision');playRecord(b,s);stopRecord(b,s);playRecord(b,s);b.setType('minecraft:air');
 system.runTimeout(()=>{try{check(world.getDynamicProperty(k)===undefined,'record replacement cleanup');console.warn('PARITY_DONE freezer '+cases+' cases; liquid properties 20; independent audio channel and removal cleanup. No client visuals/audio acceptance.');}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},30);
}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},100);
