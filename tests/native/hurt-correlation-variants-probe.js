import {world,system} from '@minecraft/server';
import {AcceptedHurtFeedback} from './accepted-hurt-feedback.js';
const emit=row=>console.log('[HURT_CORRELATION_QA] '+JSON.stringify(row)),wait=n=>new Promise(r=>system.runTimeout(r,n));
const delivery=new AcceptedHurtFeedback(system),cases=new Map();let call='';
world.beforeEvents.entityHurt.subscribe(event=>{
 const row=cases.get(event.hurtEntity.id);if(!row)return;
 const source=event.damageSource,entry={call,event,source,damage:event.damage,health:event.hurtEntity.getComponent('minecraft:health').currentValue};row.before.push(entry);
 delivery.queue(event,accepted=>{row.callbacks.push({call:entry.call,accepted});emit({kind:'settled',case:row.name,call:entry.call,accepted});});
 emit({kind:'before',case:row.name,call,damage:event.damage,health:entry.health,sourceStable:source===event.damageSource,eventKeys:Object.keys(event),sourceKeys:Object.keys(source)});
});
world.afterEvents.entityHurt.subscribe(event=>{
 const row=cases.get(event.hurtEntity.id);if(!row)return;
 emit({kind:'after',case:row.name,damage:event.damage,health:event.hurtEntity.getComponent('minecraft:health').currentValue,sameEvent:row.before.map(r=>r.event===event),sameSource:row.before.map(r=>r.source===event.damageSource)});
 row.after++;delivery.applied(event);
});
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 1 hurt_correlation_qa');
 for(let i=0;i<100;i++){try{if(d.getBlock({x:0,y:80,z:0}))break;}catch{}await wait(1);}
 const scenes=[{cause:'override',amounts:[4,4,8]},{cause:'override',amounts:[4,8,8,12]},{cause:'magic',amounts:[4,4,8]},{cause:'entityAttack',amounts:[4,4,8],absorption:true}];
 for(const [index,scene] of scenes.entries()){const {amounts,cause}=scene;
  const target=d.spawnEntity('hurt_correlation_qa:target',{x:.5,y:100,z:.5}),actor=d.spawnEntity('hurt_correlation_qa:target',{x:2,y:100,z:.5});
  const row={name:cause+(scene.absorption?'/absorption':'')+'/'+index,target,actor,before:[],callbacks:[],after:0};cases.set(target.id,row);
  if(scene.absorption){target.addEffect('absorption',200,{amplifier:1,showParticles:false});await wait(2);}
  for(const [i,amount] of amounts.entries()){call='call'+i;const accepted=target.applyDamage(amount,{cause,damagingEntity:actor});emit({kind:'returned',case:row.name,call,amount,accepted,health:target.getComponent('minecraft:health').currentValue});}
  await wait(2);emit({kind:'case',case:row.name,amounts,after:row.after,callbacks:row.callbacks,before:row.before.map(r=>({call:r.call,damage:r.damage,health:r.health}))});cases.delete(target.id);target.remove();actor.remove();
 }
 emit({kind:'done',players:world.getAllPlayers().length});
}catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},120));
