import {world,system,MolangVariableMap} from '@minecraft/server';
import {CriticalFeedback} from './critical-feedback.js';
const out=(kind,row)=>console.log('[CRITICAL_QA] '+JSON.stringify({kind,...row})),tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
world.afterEvents.worldLoad.subscribe(()=>{const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 3 critical_qa');system.runTimeout(async()=>{try{
 let current,accepted=0,spawned=0;const samples=[],reported=[];
 const feedback=new CriticalFeedback(system,{randomFloat:()=>.5,randomDouble:()=>.25,spriteFloat:()=>.5,variables:()=>new MolangVariableMap(),report:error=>reported.push(String(error))});
 // Real native mobs and real hurt callbacks. Explicitly exercises the public
 // production feedback queue, not fake player classification or client pixels.
 const dimension={id:d.id,spawnParticle:(id,at,vars)=>{d.spawnParticle(id,at,vars);spawned++;samples.push({tick:system.currentTick,at});}};
 world.beforeEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id!==current?.id)return;const target=event.hurtEntity,proxy={id:target.id,get location(){return target.location;},get dimension(){return dimension;},getAABB:()=>target.getAABB()};const wrapped={hurtEntity:proxy,damageSource:event.damageSource,get damage(){return event.damage;},get cancel(){return event.cancel;},set cancel(value){event.cancel=value;}};feedback.queue(wrapped);if(current.cancel)event.cancel=true;});
 world.afterEvents.entityHurt.subscribe(event=>{if(event.hurtEntity.id!==current?.id)return;accepted++;feedback.applied(event);});
 for(const mode of ['accepted','canceled','native-rejected']){
  const target=d.spawnEntity('senluo_combat_qa:r0',{x:0,y:80,z:0}),owner=d.spawnEntity('senluo_combat_qa:r0',{x:4,y:80,z:0});current={id:target.id,cancel:false};await tick(2);
  if(mode==='native-rejected'){target.applyDamage(4,{cause:'entityAttack',damagingEntity:owner});await tick(6);}
  const count=spawned,beforeAccepted=accepted;current.cancel=mode==='canceled';target.applyDamage(4,{cause:'entityAttack',damagingEntity:owner});await tick(1);
  if(mode==='accepted')target.teleport({x:3,y:80,z:0});await tick(4);
  out('case',{mode,spawned:spawned-count,afterHurt:accepted-beforeAccepted,pending:feedback.pending.size,samples:samples.slice(count)});target.remove();owner.remove();current=undefined;
 }
 if(reported.length)throw Error('production feedback failed: '+reported.join(';'));out('done',{players:world.getAllPlayers().length});
}catch(error){out('failure',{error:String(error),stack:error.stack});}},30);});
