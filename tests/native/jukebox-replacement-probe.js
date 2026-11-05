// QA-only entrypoint overlay. Two invocations with one normal saved-world
// stop/restart between them. Never import into LIVE.
import {world,system,ScriptEventSource} from '@minecraft/server';
import {installRecordCleanup,playRecord} from './record-audio.js';
const RECORD='kaleidoscope_world_liquor:custom_record',MARKER='world_liquor_qa:jukebox_replacement';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const storageKey=at=>`kaleidoscope_world_liquor:storage/overworld/${at.x}_${at.y}_${at.z}`;
installRecordCleanup();
let running=false;
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='jukebox_qa:replacement'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe(event.message).finally(()=>{running=false;});
});
async function observe(message){
 const checks=[],check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
 let phase='first';
 try{
  const at=JSON.parse(message);
  if(!['x','y','z'].every(axis=>Number.isInteger(at[axis])))throw Error('Provide integer QA block coordinates');
  check('exclusive QA world has no players',world.getAllPlayers().length===0);
  const dimension=world.getDimension('overworld'),block=dimension.getBlock(at),key=storageKey(at);
  const discs=()=>dimension.getEntities({type:'minecraft:item',location:at,maxDistance:3}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===RECORD);
  check('owner supplied a readable position and solid QA floor',block&&dimension.getBlock({...at,y:at.y-1})?.isSolid);
  check('no existing QA discs',discs().length===0);
  const saved=world.getDynamicProperty(MARKER),row={type:'minecraft:jukebox',record:RECORD};
  const replaceAndCheck=async()=>{
   block.setType('minecraft:air');
   await wait(25);
   check('production periodic cleanup emitted exactly one disc',discs().length===1&&discs()[0].getComponent('minecraft:item').itemStack.amount===1);
   check('only the consumed jukebox row was cleared',world.getDynamicProperty(key)===undefined);
   await wait(15);
   check('later cleanup did not duplicate the disc',discs().length===1);
   for(const e of discs())e.remove();
  };
  if(saved!==undefined){
   phase='restart';const marker=JSON.parse(saved);
   check('same saved QA position and disc row',marker.key===key&&block.typeId==='minecraft:jukebox'&&world.getDynamicProperty(key)===JSON.stringify(row));
   await replaceAndCheck();world.setDynamicProperty(MARKER,undefined);
  }else{
   check('declared QA position and storage row are empty',block.isAir&&world.getDynamicProperty(key)===undefined);
   block.setType('minecraft:jukebox');world.setDynamicProperty(key,JSON.stringify(row));playRecord(block,row);
   await replaceAndCheck();
   block.setType('minecraft:jukebox');world.setDynamicProperty(key,JSON.stringify(row));playRecord(block,row);
   block.setType('minecraft:stone');const replacement=JSON.stringify({type:'minecraft:stone',items:['minecraft:diamond']});world.setDynamicProperty(key,replacement);
   await wait(25);
   check('replacement script storage survives the old audio cleanup',world.getDynamicProperty(key)===replacement&&discs().length===0);
   world.setDynamicProperty(key,JSON.stringify(row));block.setType('minecraft:jukebox');playRecord(block,row);
   world.setDynamicProperty(MARKER,JSON.stringify({key}));
   check('disc row prepared for normal stop and same-world restart',world.getDynamicProperty(key)===JSON.stringify(row));
  }
  console.warn('JUKEBOX_REPLACEMENT_QA_RESULT '+JSON.stringify({passed:true,phase,checks,playersAfter:world.getAllPlayers().length}));
 }catch(error){console.error('JUKEBOX_REPLACEMENT_QA_RESULT '+JSON.stringify({passed:false,phase,error:String(error),checks,playersAfter:world.getAllPlayers().length}));}
}
