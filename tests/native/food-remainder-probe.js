import './main.js';
import {world,system,ItemStack,GameMode} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';
import {foodRemainderDiagnostics as diagnostics} from './food-remainder.js';

// Diagnostic input/readback only: no synthetic completion or scripted debit.
const FOOD='kaleidoscope_world_liquor:pochi_pudding',BOWL='minecraft:bowl',actors=new Map();
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const emit=(kind,data)=>console.warn('FOOD_REMAINDER_QA_'+kind+' '+JSON.stringify(data));
let running=false;
function totals(player){
 const inventory=player.getComponent('minecraft:inventory').container;
 let foods=0,bowls=0;for(let i=0;i<inventory.size;i++){
  const item=inventory.getItem(i);if(item?.typeId===FOOD)foods+=item.amount;if(item?.typeId===BOWL)bowls+=item.amount;
 }
 const hand=inventory.getItem(4);let worldBowls=0;
 for(const entity of player.dimension.getEntities({type:'minecraft:item',location:player.location,maxDistance:8})){
  const item=entity.getComponent('minecraft:item')?.itemStack;if(item?.typeId===BOWL)worldBowls+=item.amount;
 }
 return {mode:String(player.getGameMode()),foods,bowls,worldBowls,hand:hand?{type:hand.typeId===FOOD?FOOD:hand.typeId===BOWL?BOWL:'other',amount:hand.amount}:null,
  completed:diagnostics.completed,dropped:diagnostics.dropped,handDeliveries:diagnostics.hand,unresolved:diagnostics.unresolved,
  regeneration:player.getEffect('regeneration')?.duration??0};
}
for(const name of ['itemStartUse','itemCompleteUse','itemStopUse'])world.afterEvents[name].subscribe(event=>{
 const row=actors.get(event.source.id);if(!row)return;
 const type=event.itemStack?.typeId;
 const entry={event:name,item:type===FOOD?FOOD:type===BOWL?BOWL:'other',elapsed:system.currentTick-row.start,remaining:event.useDuration,...totals(event.source)};
 row.events.push(entry);emit('EVENT',{case:row.name,...entry});
});
async function observe(dimension,config){
 let player;const row={name:config.name,events:[],samples:[]};
 try{
  if(world.getAllPlayers().length)throw Error('An empty isolated QA world is required');
  for(const entity of dimension.getEntities({type:'minecraft:item',location:{x:.5,y:81,z:.5},maxDistance:8})){
   if(entity.getComponent('minecraft:item')?.itemStack.typeId===BOWL)entity.remove();
  }
  player=gt.spawnSimulatedPlayer({dimension,x:0,y:81,z:0},'PuddingCompletionQA',config.mode);
  player.teleport({x:.5,y:81,z:.5},{dimension});await wait(2);
  const inventory=player.getComponent('minecraft:inventory').container;
  for(let i=0;i<inventory.size;i++)inventory.setItem(i);
  inventory.setItem(4,new ItemStack(FOOD,config.amount));player.selectedSlotIndex=4;
  row.before=totals(player);row.start=system.currentTick;actors.set(player.id,row);
  row.accepted=player.useItemInSlot(4);emit('START',{case:row.name,accepted:row.accepted,before:row.before});
  // The 32-tick meal gets 40 ticks, then release before a second serving.
  for(let i=0;i<40;i++){await wait(1);const sample={elapsed:system.currentTick-row.start,...totals(player)};row.samples.push(sample);emit('SAMPLE',{case:row.name,...sample});}
  player.stopUsingItem();for(let i=0;i<4;i++)await wait(1);
  row.after=totals(player);row.nativeCompletions=row.events.filter(event=>event.event==='itemCompleteUse').length;
  row.productionCompletions=row.after.completed-row.before.completed;
  row.witnessed=row.accepted&&row.nativeCompletions===1&&row.after.foods===config.remaining;
  row.oneRemainder=row.after.bowls+row.after.worldBowls-row.before.bowls-row.before.worldBowls===1;
  row.matchesJava=row.witnessed&&row.oneRemainder&&row.productionCompletions===1&&row.after.unresolved===row.before.unresolved
   &&(config.hand?row.after.hand?.type===BOWL&&row.after.hand.amount===1&&row.after.handDeliveries-row.before.handDeliveries===1
    :row.after.hand?.type===FOOD&&row.after.dropped-row.before.dropped===1);
  emit('CASE',row);return row;
 }finally{
  if(player){actors.delete(player.id);player.disconnect();}
  for(let i=0;i<10&&world.getAllPlayers().length;i++)await wait(1);
  if(world.getAllPlayers().length)throw Error('QA Player did not disconnect');
 }
}
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='food_remainder_qa:run'||running)return;running=true;
 run().catch(error=>emit('RESULT',{completed:false,error:String(error),stack:error.stack,playersAfter:world.getAllPlayers().length}));
});
async function run(){
 const dimension=world.getDimension('overworld'),cases=[];
 if(world.getAllPlayers().length)throw Error('An empty isolated QA world is required');
 dimension.runCommand('fill -4 80 -4 4 84 4 air');dimension.runCommand('fill -4 80 -4 4 80 4 stone');
 for(const config of [{name:'survival_last',mode:GameMode.Survival,amount:1,remaining:0,hand:true},
  {name:'survival_stack',mode:GameMode.Survival,amount:3,remaining:2,hand:false},
  {name:'creative',mode:GameMode.Creative,amount:1,remaining:1,hand:false}]){
  const row=await observe(dimension,config);cases.push(row);
  if(!row.witnessed){emit('RESULT',{completed:false,reason:'native completion/debit witness missing; inspect actual phases before blaming the product',cases:cases.length,playersAfter:0,client:false});return;}
 }
 emit('RESULT',{completed:true,passed:cases.every(row=>row.matchesJava),cases:cases.length,playersAfter:0,client:false,
  scope:'Actual simulated-Player use with native event/debit witnesses; not human input, cancellation or disconnect parity'});
}
