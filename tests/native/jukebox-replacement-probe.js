// QA-only entrypoint overlay. Two invocations with one normal saved-world
// stop/restart between them. Never import into LIVE.
import './main.js';
import {world,system,ItemStack,ScriptEventSource} from '@minecraft/server';
import {playRecord} from './record-audio.js';
import {planFreezerStorage,readFreezerItems} from './freezer-storage.js';
import {nativeItemKey} from './freezer-native-storage.js';
const RECORD='kaleidoscope_world_liquor:custom_record',FREEZER='kaleidoscope_world_liquor:freezer',MARKER='world_liquor_qa:jukebox_replacement';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const storageKey=at=>`kaleidoscope_world_liquor:storage/overworld/${at.x}_${at.y}_${at.z}`;
const itemMetadata=item=>item&&({id:item.typeId,count:item.amount,name:item.nameTag,lore:item.getRawLore(),origin:item.getDynamicProperty('world_liquor_qa:origin'),damage:item.getComponent('minecraft:durability')?.damage});
let running=false;
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='jukebox_qa:replacement'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe(event.message).finally(()=>{running=false;});
});
async function observe(message){
 const checks=[],observations=[],check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
 let phase='first';
 try{
  const at=JSON.parse(message);
  if(!['x','y','z'].every(axis=>Number.isInteger(at[axis])))throw Error('Provide integer QA block coordinates');
  check('exclusive QA world has no players',world.getAllPlayers().length===0);
  const dimension=world.getDimension('overworld'),block=dimension.getBlock(at),key=storageKey(at);
  const furnitureAt={...at,x:at.x+4},furniture=dimension.getBlock(furnitureAt),furnitureKey=storageKey(furnitureAt);
  const discs=()=>dimension.getEntities({type:'minecraft:item',location:at,maxDistance:3}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===RECORD);
  check('owner supplied two readable positions and solid QA floors',block&&furniture&&dimension.getBlock({...at,y:at.y-1})?.isSolid&&dimension.getBlock({...furnitureAt,y:at.y-1})?.isSolid);
  check('no existing QA discs',discs().length===0);
  const saved=world.getDynamicProperty(MARKER),row={type:'minecraft:jukebox',record:RECORD};
  const verifyFurniture=expected=>{
   const raw=world.getDynamicProperty(furnitureKey),nativeRaw=world.getDynamicProperty(nativeItemKey(furnitureKey));
   check('real replacement freezer and saved rows preserved',furniture.typeId===FREEZER&&raw===expected.raw&&nativeRaw===expected.nativeRaw);
   const metadata=itemMetadata(readFreezerItems(furniture,JSON.parse(raw))[0]);
   check('same native carrier and item metadata preserved',JSON.parse(nativeRaw).entity===expected.entity&&JSON.stringify(metadata)===JSON.stringify(expected.metadata));
   observations.push({kind:'replacement_freezer',raw,nativeRaw,metadata});
  };
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
   for(let i=0;i<100&&!world.getEntity(marker.furniture.entity)?.isValid;i++)await wait(1);
   verifyFurniture(marker.furniture);
   await replaceAndCheck();verifyFurniture(marker.furniture);
   const retire=planFreezerStorage(furniture,undefined);retire.apply();retire.finish();furniture.setType('minecraft:air');
   check('owned QA freezer carrier retired after verification',world.getDynamicProperty(furnitureKey)===undefined&&world.getDynamicProperty(nativeItemKey(furnitureKey))===undefined&&!world.getEntity(marker.furniture.entity)?.isValid);
   world.setDynamicProperty(MARKER,undefined);
  }else{
   check('declared QA positions and storage rows are empty',block.isAir&&furniture.isAir&&world.getDynamicProperty(key)===undefined&&world.getDynamicProperty(furnitureKey)===undefined&&world.getDynamicProperty(nativeItemKey(furnitureKey))===undefined);
   block.setType('minecraft:jukebox');world.setDynamicProperty(key,JSON.stringify(row));playRecord(block,row);
   await replaceAndCheck();
   furniture.setType('minecraft:jukebox');world.setDynamicProperty(furnitureKey,JSON.stringify(row));playRecord(furniture,row);
   furniture.setType(FREEZER);
   const item=new ItemStack('minecraft:diamond_sword');item.nameTag='W194 replacement keeps this';item.setLore(['saved through jukebox cleanup']);item.setDynamicProperty('world_liquor_qa:origin','replacement');item.getComponent('minecraft:durability').damage=23;
   const replacement={type:FREEZER,input:[item.typeId],fluid:null,remaining:0,output:0,redstonePowered:false};
   const mutation=planFreezerStorage(furniture,replacement,{incoming:item});mutation.apply();mutation.finish();
   const nativeRaw=world.getDynamicProperty(nativeItemKey(furnitureKey)),expected={raw:world.getDynamicProperty(furnitureKey),nativeRaw,entity:JSON.parse(nativeRaw).entity,metadata:itemMetadata(item)};
   await wait(25);
   verifyFurniture(expected);
   check('replacement did not fabricate another disc',dimension.getEntities({type:'minecraft:item',location:furnitureAt,maxDistance:3}).every(e=>e.getComponent('minecraft:item')?.itemStack.typeId!==RECORD));
   world.setDynamicProperty(key,JSON.stringify(row));block.setType('minecraft:jukebox');playRecord(block,row);
   world.setDynamicProperty(MARKER,JSON.stringify({key,furniture:expected}));
   check('disc row prepared for normal stop and same-world restart',world.getDynamicProperty(key)===JSON.stringify(row));
  }
  console.warn('JUKEBOX_REPLACEMENT_QA_RESULT '+JSON.stringify({passed:true,phase,checks,observations,playersAfter:world.getAllPlayers().length}));
 }catch(error){console.error('JUKEBOX_REPLACEMENT_QA_RESULT '+JSON.stringify({passed:false,phase,error:String(error),checks,observations,playersAfter:world.getAllPlayers().length}));}
}
