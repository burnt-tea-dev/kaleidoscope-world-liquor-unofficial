import {world,system} from '@minecraft/server';

// Test-only native AI observation. No simulated players or production force adapter.
const PREFIX='senluo_elbow_qa:',rows=new Map();
let sequence=0;
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
function state(entity){
 try{return {id:entity.id,type:entity.typeId,position:{...entity.location},velocity:{...entity.getVelocity()},rotation:{...entity.getRotation()},ground:entity.isOnGround,health:entity.getComponent('minecraft:health')?.currentValue};}
 catch(error){return {unavailable:String(error)};}
}
function out(kind,data){console.log('[ELBOW_QA] '+JSON.stringify({kind,tick:system.currentTick,sequence:++sequence,...data}));}
function rowFor(actor,target){return rows.get(actor?.id)??rows.get(target?.id);}
function sample(row,phase,event={}){
 const target=state(row.target);
 if(!row.ground&&target.ground===false)row.actualAirSamples++;
 if(!row.ground&&target.ground!==false){
  row.invalidAir=true;out('failure',{case:row.label,phase,error:'ELBOW_QA_AIR_OBSERVATION_NOT_AIR',target});
 }
 out('event',{case:row.label,phase,configuredAir:!row.ground,observedGround:target.ground,actor:state(row.actor),target,...event});
}
async function readyAirTarget(entity,label){
 // Observation setup only: moving a no-gravity test mob clears native's stale
 // default ground flag. Placement height alone did not do so in r4.
 entity.applyImpulse({x:0,y:.01,z:0});
 for(let attempt=0;attempt<30;attempt++){
  await wait(1);
  if(entity.isValid===true&&entity.isOnGround===false){out('airReady',{case:label,waitedTicks:attempt+1,target:state(entity)});return;}
 }
 throw Error('ELBOW_QA_TARGET_NOT_ACTUALLY_AIRBORNE');
}
function later(row,phase){
 system.run(()=>sample(row,phase+'/run'));
 system.runTimeout(()=>sample(row,phase+'/timeout1'),1);
 system.runTimeout(()=>sample(row,phase+'/timeout2'),2);
}
async function readyChunks(dimension){
 const positions=[];
 for(const x of [-4,4])for(const z of [-4,4])for(const y of [79,86])positions.push({x,y,z});
 for(let attempt=0;attempt<160;attempt++){
  let ready=true;
  for(const position of positions)try{
   const block=dimension.getBlock(position);if(!block||block.isValid!==true)ready=false;
  }catch{ready=false;}
  if(ready){out('chunksReady',{waitedTicks:attempt,positions});return;}
  await wait(1);
 }
 throw Error('ELBOW_QA_CHUNKS_NOT_READY_AFTER_160_TICKS');
}

world.beforeEvents.entityHurt.subscribe(event=>{
 const row=rowFor(event.damageSource.damagingEntity,event.hurtEntity);
 if(!row||row.target.id!==event.hurtEntity.id)return;
 if(!row.ground&&event.hurtEntity.isOnGround!==false){
  row.invalidAir=true;event.cancel=true;
  out('failure',{case:row.label,error:'ELBOW_QA_AIR_CASE_GROUNDED_AT_BEFORE_HURT',target:state(event.hurtEntity)});
 }
 row.before++;if(row.cancel)event.cancel=true;
 sample(row,'beforeHurt',{cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id,projectile:event.damageSource.damagingProjectile?.id,damage:event.damage,cancel:event.cancel});
 later(row,'beforeHurt');
});
world.afterEvents.entityHurt.subscribe(event=>{
 const row=rowFor(event.damageSource.damagingEntity,event.hurtEntity);
 if(!row||row.target.id!==event.hurtEntity.id)return;
 row.after++;
 sample(row,'afterHurt',{cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id,projectile:event.damageSource.damagingProjectile?.id,damage:event.damage});
 later(row,'afterHurt');
});
world.afterEvents.entityHitEntity.subscribe(event=>{
 const row=rowFor(event.damagingEntity,event.hitEntity);
 if(!row||event.damagingEntity.id!==row.actor.id||event.hitEntity.id!==row.target.id)return;
 row.hit++;sample(row,'entityHitEntity');
 if(row.force&&!row.forceSent&&!row.invalidAir){
  row.forceSent=true;
  // Controlled API capability, deliberately not claimed to be Java elbow semantics.
  row.target.applyKnockback({...row.force.horizontal},row.force.vertical);
  sample(row,'controlledApiKnockback/sameTick',{force:row.force});
 }
 later(row,'entityHitEntity');
});
world.afterEvents.entityDie.subscribe(event=>{
 const row=rows.get(event.deadEntity.id);if(!row)return;
 row.died++;sample(row,'entityDie',{cause:event.damageSource?.cause,owner:event.damageSource?.damagingEntity?.id});
});

world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{
 try{
  if(world.getAllPlayers().length)throw Error('Native observation requires zero players');
  const d=world.getDimension('overworld');
  d.runCommand('tickingarea add circle 0 80 0 2 elbow_qa');
  d.runCommand('difficulty normal');
  await readyChunks(d);
  d.runCommand('fill -4 80 -4 4 86 4 air');
  d.runCommand('fill -4 79 -4 4 79 4 stone');
  for(const entity of d.getEntities({families:['elbow_qa']}))entity.remove();
  const cases=[];
  for(const resistance of ['r0','r05','r1'])for(const ground of [true,false])cases.push({label:resistance+'/'+(ground?'ground':'air')+'/AI',resistance,ground});
  cases.push({label:'r0/ground/cancel',resistance:'r0',ground:true,cancel:true});
  cases.push({label:'r0/ground/death',resistance:'r0',ground:true,lethal:true});
  for(const resistance of ['r0','r05','r1'])for(const ground of [true,false])cases.push({label:resistance+'/'+(ground?'ground':'air')+'/API',resistance,ground,force:{horizontal:{x:0,z:1},vertical:.2}});
  const completed=[];
  // r3 already observed the eight ground/cancel/death cases. This revision
  // fills only the six missing air cases with a grounded real walking actor.
  for(const config of cases.filter(config=>!config.ground)){
   const y=config.ground?80:80.75;
   d.runCommand('fill -4 79 -4 4 79 4 stone');
   // Walking AI requires its own real ground contact. The nearby target alone
   // is airborne; its actual native ground state is logged before every event.
   const target=d.spawnEntity(PREFIX+config.resistance,{x:0,y,z:1});
   if(!config.ground)await readyAirTarget(target,config.label);
   const actor=d.spawnEntity(PREFIX+'actor',{x:0,y:80,z:0});
   const row={...config,actor,target,before:0,after:0,hit:0,died:0,forceSent:false,actualAirSamples:0,invalidAir:false};rows.set(actor.id,row);rows.set(target.id,row);
   if(config.lethal)target.getComponent('minecraft:health').setCurrentValue(2);
   if(config.ground){actor.applyImpulse({x:0,y:-.1,z:0});target.applyImpulse({x:0,y:-.1,z:0});}
   sample(row,'spawn');
   for(let count=0;count<100&&row.before===0;count++)await wait(1);
   await wait(4);sample(row,'settled');
   const observed={case:row.label,before:row.before,after:row.after,hit:row.hit,died:row.died,forceSent:row.forceSent,actualAirSamples:row.actualAirSamples,invalidAir:row.invalidAir};completed.push(observed);out('case',observed);
   rows.delete(actor.id);rows.delete(target.id);for(const entity of [actor,target])try{entity.remove();}catch{}
  }
  out('done',{players:world.getAllPlayers().length,cases:completed,simulated_players:false,production_adapter_installed:false});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}
},30));
