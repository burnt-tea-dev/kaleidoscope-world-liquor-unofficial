// QA entrypoint only; imports production startup and never imitates an event.
// Source callback tests cover accepted-hand/payment. This producer starts from
// a native accepted stack, not a native player-click or payment observation.
import './main.js';
import {world,system,ItemStack,ScriptEventSource} from '@minecraft/server';
import {playRecord,ejectRecord} from './record-audio.js';
import {planRecordStorage,recordStorageKey} from './record-storage.js';
import {planFreezerStorage,readFreezerItems,freezerStorageKey} from './freezer-storage.js';
import {nativeItemKey} from './freezer-native-storage.js';
const N='kaleidoscope_world_liquor',RECORD=N+':custom_record',MARKER='record_metadata_qa:phase';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const snapshot=item=>item&&({type:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getRawLore(),properties:item.getDynamicPropertyIds().sort().map(k=>[k,item.getDynamicProperty(k)]),keepOnDeath:item.keepOnDeath,canDestroy:item.getCanDestroy()});
function named(id,label){const item=new ItemStack(id);item.nameTag=label;item.setLore(['original '+label]);item.setDynamicProperty('record_metadata_qa:serial',label);item.setDynamicProperty('record_metadata_qa:vector',{x:1,y:2,z:3});item.keepOnDeath=true;item.setCanDestroy(['minecraft:stone']);return item;}
let running=false;
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='record_metadata_qa:run'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe(event.message).finally(()=>{running=false;});
});
async function observe(message){
 const checks=[],observations=[],check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};let phase='first';
 try{
  const at=JSON.parse(message);if(!['x','y','z'].every(k=>Number.isInteger(at[k])))throw Error('Provide integer QA coordinates');
  check('no QA players',world.getAllPlayers().length===0);
  const d=world.getDimension('overworld'),blocks=[0,4,8,12].map(x=>d.getBlock({...at,x:at.x+x}));
  check('four QA positions and floor readable',blocks.every(b=>b&&d.getBlock({...b.location,y:at.y-1})?.isSolid));
  const row=b=>JSON.parse(world.getDynamicProperty(freezerStorageKey(b))??'null');
  const discs=b=>d.getEntities({type:'minecraft:item',location:b.location,maxDistance:3}).filter(e=>e.getComponent('minecraft:item')?.itemStack.typeId===RECORD);
  const put=(b,label)=>{
   b.setType('minecraft:jukebox');const item=named(RECORD,label),state={type:b.typeId,record:RECORD};
   const mutation=planRecordStorage(b,state,{incoming:item});mutation.apply();mutation.finish();playRecord(b,state);
   const native=world.getDynamicProperty(nativeItemKey(recordStorageKey(b)));
   return {metadata:snapshot(item),native,entity:JSON.parse(native).entity};
  };
  const verifyDrop=async(b,expected)=>{
   await wait(25);const found=discs(b);
   check('one native world disc with complete sampled metadata',found.length===1&&JSON.stringify(snapshot(found[0].getComponent('minecraft:item').itemStack))===JSON.stringify(expected));
   check('record row and native index consumed',world.getDynamicProperty(freezerStorageKey(b))===undefined&&world.getDynamicProperty(nativeItemKey(recordStorageKey(b)))===undefined);
   await wait(15);check('later cleanup does not duplicate native disc',discs(b).length===1);
   observations.push({kind:'disc',metadata:snapshot(found[0].getComponent('minecraft:item').itemStack)});found[0].remove();
  };
  const verifyFreezer=expected=>{
   const b=blocks[1],raw=world.getDynamicProperty(freezerStorageKey(b)),native=world.getDynamicProperty(nativeItemKey(freezerStorageKey(b)));
   check('replacement freezer row and native index unchanged',b.typeId===N+':freezer'&&raw===expected.raw&&native===expected.native);
   const metadata=snapshot(readFreezerItems(b,JSON.parse(raw))[0]);check('replacement native stack metadata unchanged',JSON.stringify(metadata)===JSON.stringify(expected.metadata));
   observations.push({kind:'freezer',metadata,entity:JSON.parse(native).entity});
  };
  const saved=world.getDynamicProperty(MARKER);
  if(saved===undefined){
   check('declared QA positions contain no prior rows or items',blocks.every(b=>b.isAir&&row(b)===null&&!world.getDynamicProperty(nativeItemKey(recordStorageKey(b)))&&discs(b).length===0));
   const manual=put(blocks[0],'manual native disc');ejectRecord(blocks[0],row(blocks[0]));await verifyDrop(blocks[0],manual.metadata);blocks[0].setType('minecraft:air');
   const replaced=put(blocks[1],'replaced native disc');blocks[1].setType(N+':freezer');
   const ingredient=named('minecraft:diamond_sword','new freezer ingredient'),state={type:N+':freezer',input:[ingredient.typeId],fluid:null,remaining:0,output:0,redstonePowered:false};
   const mutation=planFreezerStorage(blocks[1],state,{incoming:ingredient});mutation.apply();mutation.finish();
   const freezer={raw:world.getDynamicProperty(freezerStorageKey(blocks[1])),native:world.getDynamicProperty(nativeItemKey(freezerStorageKey(blocks[1]))),metadata:snapshot(ingredient)};
   await wait(25);check('replacement returns the original native disc',discs(blocks[1]).length===1&&JSON.stringify(snapshot(discs(blocks[1])[0].getComponent('minecraft:item').itemStack))===JSON.stringify(replaced.metadata));
   discs(blocks[1])[0].remove();verifyFreezer(freezer);check('record and replacement native ownership are separate',world.getDynamicProperty(nativeItemKey(recordStorageKey(blocks[1])))===undefined);
   const persisted=put(blocks[2],'saved native disc');blocks[3].setType('minecraft:jukebox');world.setDynamicProperty(freezerStorageKey(blocks[3]),JSON.stringify({record:RECORD}));
   world.setDynamicProperty(MARKER,JSON.stringify({at,persisted,freezer}));
   check('named record and legacy row prepared for same-world restart',row(blocks[2])?.record===RECORD&&row(blocks[3])?.record===RECORD);
  }else{
   phase='restart';const expected=JSON.parse(saved);check('same QA coordinates',JSON.stringify(expected.at)===JSON.stringify(at));
   const ids=[expected.persisted.entity,JSON.parse(expected.freezer.native).entity];for(let i=0;i<100&&ids.some(id=>!world.getEntity(id)?.isValid);i++)await wait(1);
   check('same saved native record carrier/index',world.getDynamicProperty(nativeItemKey(recordStorageKey(blocks[2])))===expected.persisted.native);
   check('saved native record metadata restored',JSON.stringify(snapshot(planRecordStorage(blocks[2],undefined).item))===JSON.stringify(expected.persisted.metadata));verifyFreezer(expected.freezer);
   blocks[2].setType('minecraft:air');await verifyDrop(blocks[2],expected.persisted.metadata);verifyFreezer(expected.freezer);
   ejectRecord(blocks[3],row(blocks[3]));await wait(1);const legacy=discs(blocks[3]);check('legacy plain ID returns one bare disc without invented metadata',legacy.length===1&&legacy[0].getComponent('minecraft:item').itemStack.amount===1&&!legacy[0].getComponent('minecraft:item').itemStack.nameTag);
   legacy[0].remove();blocks[3].setType('minecraft:air');
   const retire=planFreezerStorage(blocks[1],undefined);retire.apply();retire.finish();blocks[1].setType('minecraft:air');world.setDynamicProperty(MARKER,undefined);
   check('own pending metadata marker cleared',world.getDynamicProperty(MARKER)===undefined);
  }
  console.warn('RECORD_METADATA_QA_RESULT '+JSON.stringify({passed:true,phase,checks,observations,playersAfter:world.getAllPlayers().length}));
 }catch(error){console.error('RECORD_METADATA_QA_RESULT '+JSON.stringify({passed:false,phase,error:String(error),checks,observations,playersAfter:world.getAllPlayers().length}));}
}
