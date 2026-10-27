// Capability measurement, not addon runtime or a future-engine rejection gate.
import {world,system} from '@minecraft/server';
const wait=t=>new Promise(resolve=>system.runTimeout(resolve,t));
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');
 try{d.runCommand('tickingarea add 0 64 0 15 100 15 record_capability true');}catch{}
 for(let n=0;n<100&&!d.getBlock({x:4,y:80,z:4});n++)await wait(2);
 const b=d.getBlock({x:4,y:80,z:4});if(!b)throw Error('fixture area did not load');
 b.setType('minecraft:jukebox');const player=b.getComponent('minecraft:record_player'),records={};
 for(const id of ['record_qa:vanilla','record_qa:custom30','record_qa:custom40','record_qa:custom50']){
  try{player.setRecord(id,false);records[id]={stored:player.getRecord()?.typeId};player.setRecord();}
  catch(error){records[id]={error:String(error)};}
 }
 if(records['record_qa:vanilla'].stored!=='record_qa:vanilla')throw Error('native record.cat positive control failed');
 console.warn('RECORD_CAPABILITY_DONE '+JSON.stringify({records,client:false}));
}catch(error){console.warn('RECORD_CAPABILITY_DONE '+JSON.stringify({kind:'failure',error:String(error),stack:error.stack}));}},40));
