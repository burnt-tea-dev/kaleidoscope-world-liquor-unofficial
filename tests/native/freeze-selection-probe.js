import {world,system,BlockPermutation} from '@minecraft/server';
import {freezeWater} from './frost-water.js';

const out=(kind,row)=>console.log('[FROST_QA] '+JSON.stringify({kind,...row}));
const tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld');
 dimension.runCommand('tickingarea add circle 0 80 0 3 frost_selection_qa');
 system.runTimeout(async()=>{try{
  world.gameRules.randomTickSpeed=0;
  dimension.runCommand('fill -11 79 -11 11 85 11 air');
  dimension.runCommand('fill -11 79 -11 11 79 11 stone');
  dimension.getBlock({x:0,y:80,z:0}).setType('minecraft:stone');
  const entity=dimension.spawnEntity('frost_qa:mover',{x:.5,y:81,z:.5});
  await tick(10);
  if(!entity.isOnGround)throw Error('Native mob did not land on the center platform');
  for(const site of ['radius-three','radius-eight','source-filters']){
   dimension.runCommand('fill -10 80 -10 10 80 10 water');
   dimension.runCommand('fill -10 81 -10 10 81 10 air');
   dimension.getBlock({x:0,y:80,z:0}).setType('minecraft:stone');
   if(site==='source-filters'){
    dimension.getBlock({x:1,y:80,z:0}).setPermutation(BlockPermutation.resolve('minecraft:water',{liquid_depth:1}));
    dimension.getBlock({x:2,y:80,z:0}).setPermutation(BlockPermutation.resolve('minecraft:water',{liquid_depth:8}));
    dimension.getBlock({x:0,y:80,z:1}).setType('minecraft:lava');
    dimension.getBlock({x:0,y:81,z:-1}).setType('minecraft:packed_ice');
   }
   const frozen=freezeWater(entity,site==='radius-eight'?5:0),expected=site==='radius-eight'?196:site==='source-filters'?24:28;
   const boundary=dimension.getBlock({x:8,y:80,z:0}).typeId,outside=dimension.getBlock({x:8,y:80,z:1}).typeId;
   if(frozen!==expected)throw Error(site+': '+frozen+' / '+expected+' at '+JSON.stringify(entity.location)+' ground='+entity.isOnGround+' below='+dimension.getBlock({x:Math.floor(entity.location.x),y:Math.floor(entity.location.y)-1,z:Math.floor(entity.location.z)}).typeId);
   if(site==='radius-eight'&&(boundary!=='minecraft:frosted_ice'||outside!=='minecraft:water'))throw Error('Native circle boundary mismatch');
   out('case',{site,frozen,expected,ground:entity.isOnGround,at:entity.location,boundary,outside});
  }
  entity.teleport({x:.5,y:90,z:.5});await tick(3);
  const frozen=freezeWater(entity,5);
  if(entity.isOnGround||frozen!==0)throw Error('Native airborne entity froze water: '+JSON.stringify({at:entity.location,ground:entity.isOnGround,frozen}));
  out('case',{site:'airborne',frozen,expected:0,ground:entity.isOnGround});
  entity.remove();out('done',{players:world.getAllPlayers().length});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}},30);
});
