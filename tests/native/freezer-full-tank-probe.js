// QA entrypoint only. Production component callbacks receive real native
// Players/ItemStacks; callback invocation is a fixture, not a native click.
import './main.js';
import {world,system,ItemStack,BlockPermutation,GameMode,ScriptEventSource} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';
import {registerFurniture} from './furniture.js';
import {readFreezerItems,freezerStorageKey} from './freezer-storage.js';
import {nativeItemKey} from './freezer-native-storage.js';
const N='kaleidoscope_world_liquor',MARKER='freezer_full_tank_qa:saved';
const configs=[{id:'minecraft:water_bucket',mode:GameMode.Survival},{id:'minecraft:lava_bucket',mode:GameMode.Creative}];
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const snapshot=item=>item&&({type:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getRawLore(),properties:item.getDynamicPropertyIds().sort().map(k=>[k,item.getDynamicProperty(k)]),keepOnDeath:item.keepOnDeath,canDestroy:item.getCanDestroy()});
let callbacks,running=false;
registerFurniture({blockComponentRegistry:{registerCustomComponent:(id,value)=>{if(id===N+':furniture')callbacks=value;}}});
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='freezer_full_tank_qa:run'||event.sourceType!==ScriptEventSource.Server||running)return;
 running=true;observe().finally(()=>{running=false;});
});
async function observe(){
 const checks=[],observations=[],check=(name,passed)=>{checks.push({name,passed:!!passed});if(!passed)throw Error(name);};
 let player,phase='first';
 try{
  check('empty isolated QA',world.getAllPlayers().length===0);
  const d=world.getDimension('overworld'),saved=world.getDynamicProperty(MARKER),expected=saved&&JSON.parse(saved),kept=[];
  if(expected)phase='restart';
  for(let index=0;index<configs.length;index++){
   const config=configs[index],b=d.getBlock({x:8+index*4,y:81,z:8}),key=freezerStorageKey(b);
   check('QA block readable',!!b);
   player=gt.spawnSimulatedPlayer({dimension:d,x:8+index*4,y:81,z:10},'FullTankBucketQA',config.mode);
   await wait(2);player.selectedSlotIndex=4;
   const inventory=player.getComponent('minecraft:inventory').container;
   for(let slot=0;slot<inventory.size;slot++)inventory.setItem(slot);
   if(!expected){
    check('new position has no machine row',world.getDynamicProperty(key)===undefined);
    b.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:true}));
    world.setDynamicProperty(key,JSON.stringify({type:N+':freezer',input:[],fluid:'minecraft:water',remaining:0,output:0}));
    const item=new ItemStack(config.id);item.nameTag='complete '+config.id;item.setLore(['full tank fallback']);item.setDynamicProperty('freezer_full_tank_qa:serial',index+1);item.setDynamicProperty('freezer_full_tank_qa:vector',{x:1,y:2,z:3});item.keepOnDeath=true;item.setCanDestroy(['minecraft:stone']);
    inventory.setItem(4,item);const before=snapshot(inventory.getItem(4));
    check('native mode matches fixture',player.getGameMode()===config.mode);
    callbacks.onPlayerInteract({block:b,player});
    const state=JSON.parse(world.getDynamicProperty(key)),native=world.getDynamicProperty(nativeItemKey(key)),actual=snapshot(readFreezerItems(b,state)[0]);
    check('filled tank preserved',state.fluid==='minecraft:water'&&state.remaining===0&&state.output===0);
    check('one complete bucket stored',state.input.length===1&&state.input[0]===config.id&&JSON.stringify(actual)===JSON.stringify(before));
    check('production debits native hand in both modes',inventory.getItem(4)===undefined);
    check('native carrier created',!!native&&world.getEntity(JSON.parse(native).entity)?.isValid);
    kept.push({metadata:before,native,state});observations.push({mode:String(config.mode),before,stored:actual,tank:state.fluid});
   }else{
    const old=expected[index];
    for(let tick=0;tick<100&&!world.getEntity(JSON.parse(old.native).entity)?.isValid;tick++)await wait(1);
    const raw=world.getDynamicProperty(key),state=JSON.parse(raw),actual=snapshot(readFreezerItems(b,state)[0]);
    check('same saved native carrier',world.getDynamicProperty(nativeItemKey(key))===old.native);
    // Native chunk initialization may add the independent redstone latch.
    // Compare the affected input/tank/craft state, not unrelated row fields.
    check('same bucket metadata and full tank after restart',['type','input','fluid','remaining','output'].every(field=>JSON.stringify(state[field])===JSON.stringify(old.state[field]))&&JSON.stringify(actual)===JSON.stringify(old.metadata));
    callbacks.onPlayerInteract({block:b,player});
    const items=[];for(let slot=0;slot<inventory.size;slot++){const item=inventory.getItem(slot);if(item)items.push(snapshot(item));}
    const after=JSON.parse(world.getDynamicProperty(key));
    check('empty hand retrieves exactly the saved bucket',items.length===1&&JSON.stringify(items[0])===JSON.stringify(old.metadata));
    check('input retired without draining tank',after.input.length===0&&after.fluid==='minecraft:water'&&world.getDynamicProperty(nativeItemKey(key))===undefined);
    observations.push({mode:String(config.mode),restored:actual,returned:items[0],tank:after.fluid});
   }
   player.disconnect();player=undefined;await wait(2);check('QA Player disconnected',world.getAllPlayers().length===0);
  }
  world.setDynamicProperty(MARKER,expected?undefined:JSON.stringify(kept));
  console.warn('FREEZER_FULL_TANK_QA_RESULT '+JSON.stringify({passed:true,phase,checks,observations,playersAfter:world.getAllPlayers().length,nativeClick:false}));
 }catch(error){
  if(player){player.disconnect();player=undefined;await wait(2);}
  console.error('FREEZER_FULL_TANK_QA_RESULT '+JSON.stringify({passed:false,phase,error:String(error),checks,observations,playersAfter:world.getAllPlayers().length,nativeClick:false}));
 }
}
