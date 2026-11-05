// QA-only overlay in this pack's script entrypoint. Never import into LIVE.
import {world,system,ItemStack,GameMode,Direction,ScriptEventSource} from '@minecraft/server';
import {spawnSimulatedPlayer} from '@minecraft/server-gametest';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const RECORD='kaleidoscope_world_liquor:custom_record';
let running=false;
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='jukebox_qa:eject'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe(event.message).finally(()=>{running=false;});
});
async function observe(message){
 const checks=[],entries=[],attempts=[];let player,subscription;
 const check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
 try{
  const at=JSON.parse(message);
  if(!['x','y','z'].every(axis=>Number.isInteger(at[axis])))throw Error('Provide integer QA block coordinates');
  check('exclusive QA slot has no players',world.getAllPlayers().length===0);
  const dimension=world.getDimension('overworld'),block=dimension.getBlock(at);
  const key=`kaleidoscope_world_liquor:storage/overworld/${at.x}_${at.y}_${at.z}`;
  check('declared QA position is empty and readable',block?.isAir&&world.getDynamicProperty(key)===undefined);
  check('owner supplied solid QA floor',dimension.getBlock({...at,y:at.y-1})?.isSolid&&dimension.getBlock({x:at.x+3,y:at.y-1,z:at.z})?.isSolid);
  player=spawnSimulatedPlayer({dimension,x:at.x+3.5,y:at.y,z:at.z+.5},'JukeboxEjectProbe',GameMode.Survival);
  await wait(20);
  const inventory=player.getComponent('minecraft:inventory').container;player.selectedSlotIndex=0;
  subscription=event=>{if(event.player.id===player.id&&event.block.location.x===at.x&&event.block.location.y===at.y&&event.block.location.z===at.z)entries.push({item:event.itemStack?.typeId,tick:system.currentTick});};
  world.beforeEvents.playerInteractWithBlock.subscribe(subscription);
  for(const full of [false,true]){
   block.setType('minecraft:jukebox');
   for(let i=0;i<inventory.size;i++)inventory.setItem(i,undefined);
   inventory.setItem(0,new ItemStack(RECORD));
   player.lookAtBlock(at);await wait(2);
   const inserted=player.interactWithBlock(at,Direction.Up);
   attempts.push({full,action:'insert',returned:inserted,location:player.location,head:player.getHeadLocation(),view:player.getViewDirection(),block:at});
   await wait(3);player.stopInteracting();await wait(1);
   check(`full=${full}: native insertion reached the production path`,entries.at(-1)?.item===RECORD&&JSON.parse(world.getDynamicProperty(key)??'null')?.record===RECORD);
   for(let i=0;i<inventory.size;i++)inventory.setItem(i,full?new ItemStack('minecraft:stone',64):undefined);
   const before=entries.length;player.lookAtBlock(at);await wait(2);
   const ejected=player.interactWithBlock(at,Direction.Up);
   attempts.push({full,action:'eject',returned:ejected,location:player.location,head:player.getHeadLocation(),view:player.getViewDirection(),block:at});
   await wait(2);player.stopInteracting();
   check(`full=${full}: actual interaction event observed`,entries.length>before);
   const drops=dimension.getEntities({type:'minecraft:item',location:at,maxDistance:2}).filter(entity=>entity.getComponent('minecraft:item')?.itemStack.typeId===RECORD);
   check(`full=${full}: exactly one world disc and consumed saved row`,drops.length===1&&world.getDynamicProperty(key)===undefined);
   check(`full=${full}: inventory unchanged`,Array.from({length:inventory.size},(_,i)=>inventory.getItem(i)).every(item=>full?item?.typeId==='minecraft:stone'&&item.amount===64:item===undefined));
   for(const drop of drops)drop.remove();block.setType('minecraft:air');
  }
  console.warn('JUKEBOX_EJECT_QA_RESULT '+JSON.stringify({passed:true,checks,entries,attempts}));
 }catch(error){console.error('JUKEBOX_EJECT_QA_RESULT '+JSON.stringify({passed:false,error:String(error),checks,entries,attempts}));}
 finally{
  if(subscription)world.beforeEvents.playerInteractWithBlock.unsubscribe(subscription);
  try{player?.disconnect();}catch{}
  console.warn('JUKEBOX_EJECT_QA_CLEANUP '+JSON.stringify({playersAfter:world.getAllPlayers().length}));
 }
}
