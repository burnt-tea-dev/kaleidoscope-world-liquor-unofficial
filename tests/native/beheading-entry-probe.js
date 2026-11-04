import {world,system,ItemTypes} from '@minecraft/server';
import {installEffects} from './effects.js';
import {createFoundationClient,readTavernEffects} from './sdk/tavern-foundation-client.js';
import {BEHEADED_MARKER,beheadingDiagnostics} from './beheading.js';
import {treasureDropDiagnostics} from './treasure-drops.js';
const NS='kaleidoscope_world_liquor',HEAD='behead_entry:target_head';
const emit=row=>console.warn('[BEHEAD_ENTRY] '+JSON.stringify({tick:system.currentTick,...row}));
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
let actor,target,renew;
const counts={beforeEnter:0,beforeExit:0,afterHurt:0,hit:0,dieEnter:0,dieExit:0,drop:0},trace=[];
function record(phase,event){
 const row={phase,damage:event.damage,cancel:event.cancel,cause:event.damageSource?.cause,owner:event.damageSource?.damagingEntity?.id};
 try{row.marker=(event.hurtEntity??event.deadEntity??event.hitEntity).getDynamicProperty(BEHEADED_MARKER)===true;}
 catch(error){row.markerError=String(error);}
 trace.push(row);emit({kind:'event',...row});
}
world.afterEvents.worldLoad.subscribe(()=>{
 createFoundationClient(system,world,{source:NS,furniture:[],legacyEffectKey:NS+':effects'},()=>false);
 world.beforeEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id===target?.id){counts.beforeEnter++;record('before_enter',event);}});
 world.afterEvents.entityDie.subscribe(event=>{if(event.deadEntity.id===target?.id){counts.dieEnter++;record('die_enter',event);}});
 installEffects();
 world.beforeEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id===target?.id){counts.beforeExit++;record('before_exit',event);}});
 world.afterEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id===target?.id){counts.afterHurt++;record('after_hurt',event);}});
 world.afterEvents.entityHitEntity.subscribe(event=>{if(event.hitEntity.id===target?.id){counts.hit++;record('melee_hit',event);}});
 world.afterEvents.entityDie.subscribe(event=>{if(event.deadEntity.id===target?.id){counts.dieExit++;record('die_exit',event);}});
 world.afterEvents.entityItemDrop.subscribe(event=>{
  if(event.entity.id!==target?.id)return;counts.drop++;
  const items=event.items,rows=[];
  for(let i=0;i<items.length;i++){const stack=items[i].getComponent('minecraft:item').itemStack;rows.push({id:stack.typeId,amount:stack.amount});}
  emit({kind:'original_drop',rows});
 });
 system.runTimeout(async()=>{try{
  const dimension=world.getDimension('overworld');dimension.runCommand('tickingarea add circle 0 80 0 2 behead_entry_qa');
  for(let i=0;i<100;i++){
   try{if(dimension.getBlock({x:0,y:79,z:0})?.isValid)break;}catch{}
   if(i===99)throw Error('QA chunk did not load');await wait(1);
  }
  dimension.runCommand('fill -4 79 -4 4 79 4 stone');dimension.runCommand('fill -4 80 -4 4 84 4 air');
  if(!ItemTypes.get(HEAD))throw Error('Native head fixture not registered');
  actor=dimension.spawnEntity('behead_entry:actor',{x:0,y:80,z:0});
  // QA producer uses the supported host snapshot protocol. The production SDK
  // consumer and installEffects callback run unchanged; no marker is seeded.
  const snapshot=()=>system.sendScriptEvent('kaleidoscope_tavern:effect_snapshot',JSON.stringify({source:NS,entity:actor.id,sequence:system.currentTick,part:0,parts:1,rows:[{id:NS+':beheading',ticks:200,amplifier:255}]}));
  snapshot();renew=system.runInterval(snapshot,2);
  for(let i=0;i<20&&!readTavernEffects(actor,NS).beheading;i++)await wait(1);
  if(readTavernEffects(actor,NS).beheading?.amplifier!==255)throw Error('Production SDK did not admit the supported effect snapshot');
  target=dimension.spawnEntity('behead_entry:target',{x:0,y:80,z:1});
  if(target.getDynamicProperty(BEHEADED_MARKER)!==undefined)throw Error('Target must start without a beheading marker');
  emit({kind:'ready',targetUnmarked:true,sdkAmplifier:255,actor:actor.id,target:target.id});
  actor.applyImpulse({x:0,y:-.1,z:0});target.applyImpulse({x:0,y:-.1,z:0});
  for(let i=0;i<100&&counts.dieExit===0;i++)await wait(1);
  await wait(8);system.clearRun(renew);renew=undefined;
  const heads=dimension.getEntities({type:'minecraft:item'}).map(entity=>entity.getComponent('minecraft:item').itemStack).filter(stack=>stack.typeId===HEAD).reduce((sum,stack)=>sum+stack.amount,0);
  const input=trace.find(row=>row.phase==='before_enter'),output=trace.find(row=>row.phase==='before_exit'),death=trace.find(row=>row.phase==='die_enter'),settled=trace.find(row=>row.phase==='die_exit');
  const ok=counts.beforeEnter===1&&counts.beforeExit===1&&counts.afterHurt===1&&counts.hit===1&&counts.dieEnter===1&&counts.dieExit===1&&counts.drop===1&&input?.damage===4&&input.marker===false&&output?.damage===10000&&output.marker===true&&death?.marker===true&&death.owner===actor.id&&settled?.marker===false&&heads===1&&beheadingDiagnostics.beheaded===1&&beheadingDiagnostics.forced===0&&!beheadingDiagnostics.errors.length&&!treasureDropDiagnostics.errors.length;
  emit({kind:'result',ok,counts,heads,beheading:beheadingDiagnostics,treasure:treasureDropDiagnostics,trace,players:world.getAllPlayers().length});
  dimension.runCommand('tickingarea remove behead_entry_qa');
  if(!ok)throw Error('Actual AI/beforeHurt/marker/death/head wiring differs from the expected single flow');
  emit({kind:'done',cases:1,players:world.getAllPlayers().length});
 }catch(error){if(renew!==undefined)system.clearRun(renew);emit({kind:'failure',error:String(error),stack:error.stack,counts,beheading:beheadingDiagnostics});}},20);
});
