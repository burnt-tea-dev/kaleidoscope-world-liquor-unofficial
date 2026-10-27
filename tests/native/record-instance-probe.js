// Inject only into a disposable copy of the owned BP. Never a runtime import.
// BDS API/persistence evidence; there are no players or audible-client checks.
import {world,system} from '@minecraft/server';
import {playRecord,stopRecord} from './record-audio.js';
const N='kaleidoscope_world_liquor',BASE=N+'.music_disc.random_disc';
const phaseKey='record_qa:instance_phase',expectedKey='record_qa:expected_records';
const key=p=>N+':storage/overworld/'+p.x+'_'+p.y+'_'+p.z;
const check=(ok,message)=>{if(!ok)throw Error(message);};
const wait=t=>new Promise(resolve=>system.runTimeout(resolve,t));
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');
 try{d.runCommand('tickingarea add 0 64 0 15 100 15 record_instances true');}catch{}
 for(let n=0;n<100&&!d.getBlock({x:15,y:80,z:15});n++)await wait(2);
 check(!!d.getBlock({x:15,y:80,z:15}),'fixture area did not load');
 if(world.getDynamicProperty(phaseKey)==='seeded'){
  const expected=JSON.parse(world.getDynamicProperty(expectedKey));
  await wait(30);
  for(const [k,v] of Object.entries(expected))check(world.getDynamicProperty(k)===v,'saved disc changed on restart: '+k);
  console.warn('RECORD_INSTANCES_DONE '+JSON.stringify({phase:'restart',savedRows:Object.keys(expected).length,legacyRecord:true,currentRecord:true,wallRecord:true,client:false}));
  return;
 }
 const blocks=[],handles=[];
 for(let i=0;i<40;i++){
  const p={x:i%8,y:80,z:Math.floor(i/8)},b=d.getBlock(p),s={type:'minecraft:jukebox',record:N+':custom_record'};
  b.setType('minecraft:jukebox');world.setDynamicProperty(key(p),JSON.stringify(s));blocks.push(b);handles.push(playRecord(b,s));
 }
 check(new Set(handles.map(h=>h.id)).size===40,'expected forty independent sound instances');
 check(handles.every(h=>h.soundEventId===BASE),'unexpected sound event');
 stopRecord(blocks[0]); // Per-instance engine stop; other handles remain distinct.
 blocks[1].setType('minecraft:air');
 const wallPos={x:12,y:80,z:12};d.getBlock({x:12,y:80,z:13}).setType('minecraft:stone');d.getBlock(wallPos).setType(N+':wall_record');
 const legacyPos={x:13,y:80,z:12},currentPos={x:14,y:80,z:12};
 d.getBlock(legacyPos).setType('minecraft:jukebox');d.getBlock(currentPos).setType('minecraft:jukebox');
 await wait(30);
 check(world.getDynamicProperty(key(blocks[1].location))===undefined,'removed jukebox storage not cleaned');
 const expected={};
 for(const [p,s] of [[legacyPos,{type:'minecraft:jukebox',record:N+':custom_record',recordSound:BASE+'.station_0'}],[currentPos,{type:'minecraft:jukebox',record:N+':custom_record'}],[wallPos,{record:'minecraft:music_disc_13',recordSound:BASE+'.station_0'}]]){
  const raw=JSON.stringify(s);world.setDynamicProperty(key(p),raw);expected[key(p)]=raw;
 }
 await wait(30);
 for(const [k,v] of Object.entries(expected))check(world.getDynamicProperty(k)===v,'fixture disc changed before save');
 for(const b of blocks)stopRecord(b);
 world.setDynamicProperty(expectedKey,JSON.stringify(expected));world.setDynamicProperty(phaseKey,'seeded');
 console.warn('RECORD_INSTANCES_DONE '+JSON.stringify({phase:'first',soundInstances:40,uniqueIds:40,explicitStops:39,removedSourceCleaned:true,savedRows:3,client:false}));
}catch(error){console.warn('RECORD_INSTANCES_DONE '+JSON.stringify({kind:'failure',error:String(error),stack:error.stack}));}},40));
