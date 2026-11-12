// Current-target diagnostic only. Does not alter World Liquor runtime or play client audio.
import {world,system} from '@minecraft/server';

const IDS=['record_qa:vanilla','record_qa:custom30','record_qa:custom40','record_qa:custom50','record_qa:custom60'];
const PREFIX='RECORD_CAPABILITY_260 ';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const emit=value=>console.warn(PREFIX+JSON.stringify(value));

world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{
 const dimension=world.getDimension('overworld');
 let block;
 const records={};
 const cleanup={blockRemoved:false,tickingAreaRemoved:false};
 try{
  if(world.getAllPlayers().length!==0)throw Error('unexpected player in disposable capability world');
  try{dimension.runCommand('tickingarea add 0 64 0 15 100 15 record_capability_260 true')}catch{}
  for(let n=0;n<100&&!dimension.getBlock({x:4,y:80,z:4});n++)await wait(2);
  block=dimension.getBlock({x:4,y:80,z:4});
  if(!block)throw Error('fixture area did not load');
  if(!block.isAir)throw Error('probe location is not air');
  block.setType('minecraft:jukebox');
  const recordPlayer=block.getComponent('minecraft:record_player');
  if(!recordPlayer)throw Error('native jukebox record_player component unavailable');
  for(const id of IDS){
   try{
    recordPlayer.setRecord(id,false);
    records[id]={stored:recordPlayer.getRecord()?.typeId??null};
    recordPlayer.setRecord();
   }catch(error){records[id]={error:String(error)}}
  }
  if(records['record_qa:vanilla']?.stored!=='record_qa:vanilla')throw Error('vanilla record.cat positive control failed');
  emit({kind:'done',records,client:false,realPlayers:world.getAllPlayers().length,scope:'item parser/load and native RecordPlayer storage only'});
 }catch(error){
  emit({kind:'failure',error:String(error),stack:error?.stack,records,realPlayers:world.getAllPlayers().length});
 }finally{
  try{
   if(block?.typeId==='minecraft:jukebox'){
    try{block.getComponent('minecraft:record_player')?.setRecord()}catch{}
    block.setType('minecraft:air');
    cleanup.blockRemoved=block.isAir;
   }
  }catch{}
  try{dimension.runCommand('tickingarea remove record_capability_260');cleanup.tickingAreaRemoved=true}catch{}
  emit({kind:'cleanup',cleanup,realPlayers:world.getAllPlayers().length});
 }
},40));
