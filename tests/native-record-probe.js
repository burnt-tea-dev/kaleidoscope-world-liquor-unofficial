// Test-only import in a NEW disposable BDS world. Never ship this in runtime.
import {world,system,BlockPermutation} from '@minecraft/server';
import {installRecordCleanup} from './record-audio.js';
const N='kaleidoscope_world_liquor',F='kaleidoscope_tavern:facing';
const key=x=>`${N}:storage/overworld/${x}_80_0`;
const pause=n=>new Promise(resolve=>system.runTimeout(resolve,n));
function check(ok,message){if(!ok)throw Error(message);}
// Readiness is a condition, not a fixed assumption about chunk generation speed.
async function waitForProbeBlocks(d,positions){
 for(let elapsed=0;elapsed<400;elapsed+=10){
  let ready=false;try{ready=positions.every(pos=>!!d.getBlock(pos));}catch{}
  if(ready)return;
  await pause(10);
 }
 throw Error('probe setup: ticking area unavailable after 400 ticks');
}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{
 try{
  const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 2 parity_probe true');
  await waitForProbeBlocks(d,[{"x":-1,"y":80,"z":-1},{"x":-1,"y":80,"z":0},{"x":-1,"y":80,"z":1},{"x":0,"y":80,"z":-1},{"x":0,"y":80,"z":0},{"x":0,"y":80,"z":1},{"x":1,"y":80,"z":-1},{"x":1,"y":80,"z":0},{"x":1,"y":80,"z":1},{"x":2,"y":80,"z":-1},{"x":2,"y":80,"z":0},{"x":2,"y":80,"z":1},{"x":3,"y":80,"z":-1},{"x":3,"y":80,"z":0},{"x":3,"y":80,"z":1},{"x":4,"y":80,"z":-1},{"x":4,"y":80,"z":0},{"x":4,"y":80,"z":1},{"x":5,"y":80,"z":-1},{"x":5,"y":80,"z":0},{"x":5,"y":80,"z":1},{"x":6,"y":80,"z":-1},{"x":6,"y":80,"z":0},{"x":6,"y":80,"z":1},{"x":7,"y":80,"z":-1},{"x":7,"y":80,"z":0},{"x":7,"y":80,"z":1},{"x":8,"y":80,"z":-1},{"x":8,"y":80,"z":0},{"x":8,"y":80,"z":1},{"x":9,"y":80,"z":-1},{"x":9,"y":80,"z":0},{"x":9,"y":80,"z":1},{"x":10,"y":80,"z":-1},{"x":10,"y":80,"z":0},{"x":10,"y":80,"z":1}]);
  const walls=[];
  for(let f=0;f<4;f++){
   const x=f*3,b=d.getBlock({x,y:80,z:0}),v=[{x:0,z:1},{x:-1,z:0},{x:0,z:-1},{x:1,z:0}][f];
   check(!!b,'probe chunk not loaded');d.getBlock({x:x+v.x,y:80,z:v.z}).setType('minecraft:stone');
   b.setPermutation(BlockPermutation.resolve(N+':wall_record',{[F]:f,[N+':model_group']:0,[N+':model_variant']:1}));
   walls.push({b,x,v});
  }
  await pause(5);
  for(const {x} of walls)world.setDynamicProperty(key(x),JSON.stringify({record:'minecraft:music_disc_cat'}));
  // Native production startup scan invoked again over saved rows. This is not a process restart.
  installRecordCleanup();await pause(30);
  for(const {b,x} of walls){check(b.typeId===N+':wall_record','wall removed before support loss');check(JSON.parse(world.getDynamicProperty(key(x))).record==='minecraft:music_disc_cat','cleanup erased wall record');}
  for(const {x,v} of walls)d.getBlock({x:x+v.x,y:80,z:v.z}).setType('minecraft:air');
  await pause(100);
  for(const {b,x} of walls){check(b.isAir,'unsupported wall not removed');check(world.getDynamicProperty(key(x))===undefined,'stale wall payload');}
  const drops=d.getEntities({type:'minecraft:item',location:{x:4,y:75,z:0},maxDistance:30}).map(e=>e.getComponent('minecraft:item')?.itemStack).filter(s=>s?.typeId==='minecraft:music_disc_cat');
  check(drops.reduce((n,s)=>n+s.amount,0)===4,'expected four exact disc drops');
  console.log('LIQUOR_NATIVE_PASS '+JSON.stringify({fourFacings:true,cleanupPreservesWall:true,supportDropsExactlyOnce:true,realProcessRestart:false,client:false,simulatedPlayers:false}));
 }catch(e){console.error('LIQUOR_NATIVE_FAIL '+e+' '+e.stack);}
},40));
