import {world,system} from '@minecraft/server';
// Disposable actual AI melee observation; no Player, fake hurt or production adapter.
const rows=new Map(),wait=n=>new Promise(r=>system.runTimeout(r,n));
const emit=row=>console.log('[ELBOW_QA] '+JSON.stringify({tick:system.currentTick,...row}));
function state(e){try{return {position:{...e.location},velocity:{...e.getVelocity()},ground:e.isOnGround,health:e.getComponent('minecraft:health')?.currentValue};}catch(error){return {unavailable:String(error)};}}
function sample(row,phase){emit({kind:'event',case:row.label,phase,actor:state(row.actor),target:state(row.target)});}
world.beforeEvents.entityHurt.subscribe(e=>{const row=rows.get(e.hurtEntity.id);if(!row||e.damageSource.damagingEntity?.id!==row.actor.id)return;row.before++;sample(row,'beforeHurt');});
world.afterEvents.entityHitEntity.subscribe(e=>{const row=rows.get(e.hitEntity.id);if(row&&e.damagingEntity.id===row.actor.id){row.hit++;sample(row,'entityHitEntity');}});
world.afterEvents.entityHurt.subscribe(e=>{
 const row=rows.get(e.hurtEntity.id);if(!row||e.damageSource.damagingEntity?.id!==row.actor.id||row.after++)return;
 sample(row,'afterHurt/before');
 try{
  if(row.mode==='clear'||row.mode==='clear_impulse')row.target.clearVelocity();
  if(row.mode==='teleport')row.target.tryTeleport({...row.target.location},{dimension:row.target.dimension,keepVelocity:false,checkForBlocks:false});
  if(row.mode==='clear_impulse')row.target.applyImpulse({x:.2,y:.05,z:.7});
  sample(row,'afterHurt/operation');
  system.run(()=>sample(row,'afterHurt/run'));
  system.runTimeout(()=>sample(row,'afterHurt/timeout1'),1);
  system.runTimeout(()=>sample(row,'afterHurt/timeout2'),2);
 }catch(error){emit({kind:'failure',case:row.label,error:String(error),stack:error.stack});}
});
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 if(world.getAllPlayers().length)throw Error('Players prohibited');const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 2 elbow_velocity_qa');d.runCommand('difficulty normal');
 for(let i=0;i<100;i++){try{if(d.getBlock({x:0,y:80,z:0}))break;}catch{}await wait(1);}
 d.runCommand('fill -4 79 -4 4 86 4 air');d.runCommand('fill -4 79 -4 4 79 4 stone');
 const cases=[{mode:'control',resistance:'r0'},...['clear','teleport','clear_impulse'].flatMap(mode=>['r0','r05','r1'].map(resistance=>({mode,resistance})))];
 for(const config of cases){
  const target=d.spawnEntity('senluo_elbow_qa:'+config.resistance,{x:0,y:80.75,z:1});target.applyImpulse({x:0,y:.01,z:0});
  for(let i=0;i<30&&target.isOnGround!==false;i++)await wait(1);if(target.isOnGround!==false)throw Error('Real airborne state unavailable');
  const actor=d.spawnEntity('senluo_elbow_qa:actor',{x:0,y:80,z:0});const row={...config,label:config.resistance+'/air/'+config.mode,actor,target,before:0,after:0,hit:0};rows.set(target.id,row);sample(row,'spawn');
  for(let i=0;i<100&&row.after===0;i++)await wait(1);await wait(4);sample(row,'settled');
  emit({kind:'case',case:row.label,before:row.before,after:row.after,hit:row.hit,final:state(target)});rows.delete(target.id);actor.remove();target.remove();
 }
 emit({kind:'done',players:world.getAllPlayers().length,cases:cases.length,simulated_players:false,production_adapter_installed:false});
}catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},30));
