import {world,system} from '@minecraft/server';
import {installEffects} from './effects.js';
import {createFoundationClient} from './sdk/tavern-foundation-client.js';
const NS='kaleidoscope_world_liquor',out=(kind,row)=>console.log('[COMBAT_QA] '+JSON.stringify({kind,...row})),tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
createFoundationClient(system,world,{source:NS,furniture:[],legacyEffectKey:'senluo_combat_qa:legacy'},()=>true,{log:console.log});
const canceled=new Set(),events=[];
world.afterEvents.entityHurt.subscribe(e=>{if(e.hurtEntity.typeId.startsWith('senluo_combat_qa:'))out('afterProductionHurt',{victim:e.hurtEntity.id,damage:e.damage,health:e.hurtEntity.getComponent('minecraft:health')?.currentValue,cause:e.damageSource.cause,owner:e.damageSource.damagingEntity?.id});});
world.afterEvents.worldLoad.subscribe(()=>{
 installEffects();
 world.beforeEvents.entityHurt.subscribe(e=>{if(e.hurtEntity.typeId.startsWith('senluo_combat_qa:')){if(canceled.has(e.hurtEntity.id))e.cancel=true;events.push({victim:e.hurtEntity.id,owner:e.damageSource.damagingEntity?.id,cause:e.damageSource.cause,damage:e.damage,cancel:e.cancel});}});
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 2 combat_qa');
 system.runTimeout(async()=>{try{
  for(const old of d.getEntities({families:['combat_probe']}))old.remove();
  const a=d.spawnEntity('senluo_combat_qa:r0',{x:0,y:80,z:0}),b=d.spawnEntity('senluo_combat_qa:r0',{x:4,y:80,z:0}),target=d.spawnEntity('senluo_combat_qa:r0',{x:8,y:80,z:0});await tick(2);
  const refresh=()=>system.sendScriptEvent('kaleidoscope_tavern:effect_snapshot',JSON.stringify({source:NS,entity:a.id,sequence:system.currentTick,parts:1,part:0,rows:[{id:NS+':double_damage',ticks:600,amplifier:4}]}));
  refresh();await tick(3);
  const hit=(victim,owner,label)=>{const before=victim.getComponent('minecraft:health').currentValue,ok=victim.applyDamage(4,{cause:'override',...(owner?{damagingEntity:owner}:{})}),after=victim.getComponent('minecraft:health').currentValue;out('productionDamage',{label,ok,damage:before-after});};
  hit(target,a,'fresh-A');hit(target,undefined,'environment-after-A');hit(target,b,'B-after-A');hit(target,undefined,'environment-after-B');await tick(2);hit(target,undefined,'environment-after-rejected-B-settled');await tick(2);
  const second=d.spawnEntity('senluo_combat_qa:r0',{x:12,y:80,z:0});await tick(2);canceled.add(second.id);hit(second,a,'canceled-A');canceled.delete(second.id);hit(second,b,'B-after-canceled-A');hit(second,undefined,'environment-after-canceled-A-and-B');await tick(2);
  const spaced=d.spawnEntity('senluo_combat_qa:r0',{x:20,y:80,z:0});for(const [owner,label] of [[a,'spaced-fresh-A'],[undefined,'spaced-environment-after-A'],[b,'spaced-B-after-A'],[undefined,'spaced-environment-after-B']]){await tick(20);refresh();await tick(3);hit(spaced,owner,label);}
  // Keep A's actual SDK effect snapshot fresh while testing credit expiry.
  const third=d.spawnEntity('senluo_combat_qa:r0',{x:16,y:80,z:0});await tick(2);refresh();await tick(3);hit(third,a,'fresh-A-expiry');await tick(101);refresh();await tick(3);hit(third,undefined,'environment-after-expiry');await tick(2);
  out('events',{events});for(const actor of [a,b,target,second,third,spaced])actor.remove();out('done',{players:world.getAllPlayers().length});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}},30);
});
