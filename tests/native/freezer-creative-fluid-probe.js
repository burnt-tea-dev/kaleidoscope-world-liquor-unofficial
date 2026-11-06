// QA only: native Player inventories through the production component callback.
// The callback is fixture-invoked; this does not claim a native player click.
import './main.js';
import {world,system,ItemStack,BlockPermutation,GameMode,ScriptEventSource} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';
import {registerFurniture} from './furniture.js';
import {freezerStorageKey} from './freezer-storage.js';
import {nativeItemKey} from './freezer-native-storage.js';
const N='kaleidoscope_world_liquor',MARKER='creative_fluid_qa:saved';
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const snapshot=item=>item?{type:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getRawLore(),properties:item.getDynamicPropertyIds().sort().map(key=>[key,item.getDynamicProperty(key)]),keepOnDeath:item.keepOnDeath,canDestroy:item.getCanDestroy()}:null;
const inventorySnapshot=inventory=>Array.from({length:inventory.size},(_,slot)=>snapshot(inventory.getItem(slot)));
let callbacks,running=false;
registerFurniture({blockComponentRegistry:{registerCustomComponent:(id,value)=>{if(id===N+':furniture')callbacks=value;}}});
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='creative_fluid_qa:run'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe().finally(()=>{running=false;});
});
async function observe(){
 const checks=[],observations=[],check=(name,value)=>{checks.push({name,passed:!!value});if(!value)throw Error(name);};
 let player,phase='first';
 try{
  check('empty isolated QA',world.getAllPlayers().length===0);
  const dimension=world.getDimension('overworld'),saved=world.getDynamicProperty(MARKER);
  if(saved){
   phase='restart';
   for(const at of JSON.parse(saved)){
    const block=dimension.getBlock(at),key=freezerStorageKey(block),state=JSON.parse(world.getDynamicProperty(key));
    check('same saved freezer present',block.typeId===N+':freezer');
    check('drained tank and empty input persist',state.fluid===null&&state.input.length===0&&state.remaining===0&&state.output===0);
    check('no native input carrier introduced',world.getDynamicProperty(nativeItemKey(key))===undefined);
    observations.push({position:at,fluid:state.fluid,input:state.input});
   }
   world.setDynamicProperty(MARKER,undefined);
  }else{
   const positions=[];
   for(const full of [false,true]){
    const position={x:full?12:8,y:81,z:8},block=dimension.getBlock(position),key=freezerStorageKey(block);
    check('new readable QA position',!!block&&world.getDynamicProperty(key)===undefined);
    block.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:true}));
    world.setDynamicProperty(key,JSON.stringify({type:N+':freezer',input:[],fluid:'minecraft:water',remaining:0,output:0,redstonePowered:false}));
    player=gt.spawnSimulatedPlayer({dimension,x:position.x,y:81,z:10},'CreativeFluidQA',GameMode.Creative);await wait(2);
    const inventory=player.getComponent('minecraft:inventory').container;
    for(let slot=0;slot<inventory.size;slot++)inventory.setItem(slot,full?new ItemStack('minecraft:stone',64):undefined);
    // This engine rejects dynamic-property writes on stackable empty buckets.
    // Keep the fixture within the native fields this item actually supports.
    const bucket=new ItemStack('minecraft:bucket',3);bucket.nameTag='original empty buckets';bucket.setLore(['Creative fluid transfer']);bucket.keepOnDeath=true;bucket.setCanDestroy(['minecraft:stone']);
    inventory.setItem(4,bucket);player.selectedSlotIndex=4;
    check('native Creative mode and declared inventory capacity',player.getGameMode()===GameMode.Creative&&inventory.getItem(4)?.typeId==='minecraft:bucket'&&inventory.getItem(4)?.amount===3&&inventorySnapshot(inventory).filter(Boolean).length===(full?inventory.size:1));
    const before=inventorySnapshot(inventory);callbacks.onPlayerInteract({block,player});
    const after=inventorySnapshot(inventory),state=JSON.parse(world.getDynamicProperty(key));
    check('tank drained without ingredient insertion',state.fluid===null&&state.input.length===0);
    check('native complete inventory unchanged and no filled bucket produced',JSON.stringify(before)===JSON.stringify(after));
    observations.push({full,beforeHand:before[4],afterHand:after[4],inventorySlots:inventory.size,occupiedBefore:before.filter(Boolean).length,occupiedAfter:after.filter(Boolean).length,completeInventoryEqual:JSON.stringify(before)===JSON.stringify(after),fluid:state.fluid});
    positions.push(position);player.disconnect();player=undefined;
    for(let tick=0;tick<10&&world.getAllPlayers().length;tick++)await wait(1);
    check('QA Player disconnected',world.getAllPlayers().length===0);
   }
   world.setDynamicProperty(MARKER,JSON.stringify(positions));
  }
  console.warn('CREATIVE_FLUID_QA_RESULT '+JSON.stringify({passed:true,phase,checks,observations,playersAfter:world.getAllPlayers().length,nativeClick:false,playerInventoryRestartClaim:false}));
 }catch(error){
  if(player){player.disconnect();for(let tick=0;tick<10&&world.getAllPlayers().length;tick++)await wait(1);}
  console.error('CREATIVE_FLUID_QA_RESULT '+JSON.stringify({passed:false,phase,error:String(error),checks,observations,playersAfter:world.getAllPlayers().length,nativeClick:false}));
 }
}
