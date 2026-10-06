import {world,system,BlockPermutation} from '@minecraft/server';

const out=(kind,row)=>console.log('[FROST_QA] '+JSON.stringify({kind,...row}));
const tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld');
 dimension.runCommand('tickingarea add circle 0 80 0 3 frost_qa');
 system.runTimeout(async()=>{try{
  world.gameRules.randomTickSpeed=0;
  world.gameRules.doDayLightCycle=false;
  dimension.runCommand('time set noon');
  dimension.runCommand('weather clear');
  dimension.runCommand('fill -4 78 -4 28 85 4 air');
  dimension.runCommand('fill -4 79 -4 28 79 4 stone');
  const sites=[{id:'single',x:0},{id:'single-lit',x:8},{id:'cluster',x:20}];
  const cells=[];
  for(const site of sites){
   const radius=site.id==='cluster'?2:0;
   for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){
    const location={x:site.x+x,y:80,z};
    dimension.getBlock(location).setPermutation(BlockPermutation.resolve('minecraft:frosted_ice'));
    cells.push({site:site.id,location,last:undefined});
   }
  }
  dimension.getBlock({x:8,y:81,z:0}).setType('minecraft:sea_lantern');
  const started=system.currentTick;
  for(let elapsed=0;elapsed<=400;elapsed++){
   for(const cell of cells){
    const block=dimension.getBlock(cell.location);
    const state={type:block.typeId,states:block.permutation.getAllStates()};
    const key=JSON.stringify(state);
    if(key!==cell.last){cell.last=key;out('transition',{elapsed:system.currentTick-started,site:cell.site,at:cell.location,...state,light:block.getLightLevel(),sky:block.getSkyLightLevel()});}
   }
   await tick(1);
  }
  out('done',{players:world.getAllPlayers().length,randomTickSpeed:world.gameRules.randomTickSpeed,elapsed:system.currentTick-started});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}},30);
});
