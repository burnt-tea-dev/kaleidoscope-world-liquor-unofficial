// Test-only overlay: native neighbor redstone events, no player emulation.
import {world,system,BlockPermutation} from '@minecraft/server';
const N='kaleidoscope_world_liquor',at={x:24,y:80,z:0},powerAt={x:25,y:80,z:0},key=N+':storage/overworld/24_80_0';
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const check=(ok,message)=>{if(!ok)throw Error(message);};
// Readiness is a condition, not a fixed assumption about chunk generation speed.
async function waitForProbeBlocks(d,positions){
 for(let elapsed=0;elapsed<400;elapsed+=10){
  let ready=false;try{ready=positions.every(pos=>!!d.getBlock(pos));}catch{}
  if(ready)return;
  await wait(10);
 }
 throw Error('probe setup: ticking area unavailable after 400 ticks');
}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 24 80 0 1 freezer_probe true');await waitForProbeBlocks(d,[{"x":24,"y":80,"z":0},{"x":25,"y":80,"z":0},{"x":24,"y":81,"z":0}]);
 const b=d.getBlock(at),power=d.getBlock(powerAt);power.setType('minecraft:air');d.getBlock({x:24,y:81,z:0}).setType('minecraft:air');
 b.setPermutation(BlockPermutation.resolve(N+':freezer',{'kaleidoscope_tavern:facing':0,[N+':open']:false}));await wait(10);
 world.setDynamicProperty(key,JSON.stringify({type:N+':freezer',input:[],fluid:'minecraft:water',remaining:0,output:0,redstonePowered:false}));
 power.setType('minecraft:redstone_block');await wait(20);check(b.permutation.getState(N+':open')===true,'rising redstone did not open freezer');
 power.setType('minecraft:air');await wait(20);check(b.permutation.getState(N+':open')===false,'falling redstone did not close freezer');
 const s=JSON.parse(world.getDynamicProperty(key));check(s.recipe===N+':freezer/ice'&&s.remaining>0&&s.fluid===null,'falling redstone did not start ice recipe');
 power.setType('minecraft:redstone_block');await wait(20);check(b.permutation.getState(N+':open')===false,'working freezer incorrectly reopened');
 console.log('FREEZER_NATIVE_PASS '+JSON.stringify({nativeRedstoneEdges:true,recipeStarted:true,workingLidLocked:true,client:false,simulatedPlayers:false}));
}catch(e){console.error('FREEZER_NATIVE_FAIL '+e+' '+e.stack);}},40));
