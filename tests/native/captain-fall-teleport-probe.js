import {world,system,GameMode} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';

// Native capability observation only. No production effect, hurt interception,
// health write, computed fall distance or simulated physics is installed.
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const tracked=new Map(),ORIGIN={x:.5,y:91.25,z:.5},PENDING={x:.08,y:0,z:.03};
const emit=(kind,value)=>console.warn('CAPTAIN_FALL_TP_'+kind+' '+JSON.stringify(value));
let running=false;
function state(entity){
 return {tick:system.currentTick,position:{...entity.location},velocity:{...entity.getVelocity()},
  rotation:{...entity.getRotation()},ground:entity.isOnGround,falling:entity.isFalling,
  health:entity.getComponent('minecraft:health')?.currentValue};
}
function vectorNear(a,b){return ['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<.00002);}
function rotationNear(a,b){return ['x','y'].every(axis=>Math.abs(a[axis]-b[axis])<.00002);}
function delta(a,b){return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};}
function damage(row){return row.hurt.filter(event=>event.cause==='fall').reduce((sum,event)=>sum+event.damage,0);}
world.afterEvents.entityHurt.subscribe(event=>{
 const row=tracked.get(event.hurtEntity.id);if(!row)return;
 const sample={tick:system.currentTick,cause:event.damageSource.cause,damage:event.damage,state:state(event.hurtEntity)};
 row.hurt.push(sample);emit('HURT',{kind:row.kind,method:row.method,...sample});
});

async function observe(dimension,kind,method){
 let entity;
 const row={kind,method,hurt:[],following:[],landed:false};
 try{
  entity=kind==='player'?gt.spawnSimulatedPlayer({dimension,...ORIGIN},'FallTeleportQA',GameMode.Survival):dimension.spawnEntity('captain_qa:mover',ORIGIN);
  tracked.set(entity.id,row);
  // All cases use the same fresh spawn placement, before accumulating a fall.
  entity.teleport(ORIGIN,{dimension,checkForBlocks:false});
  row.initial=state(entity);
  if(row.initial.health!==20||entity.getEffects().length)throw Error('Fresh untreated actor required');
  entity.applyImpulse({x:.12,y:0,z:.04});
  let descending=0,landTick;
  for(let i=0;i<80;i++){
   const sample=state(entity);emit('SAMPLE',{kind,method,...sample});
   if(!row.before){
    descending=sample.ground===false&&sample.velocity.y<-.05?descending+1:0;
    if(descending>=2&&sample.position.y<=85.5){
     if(sample.position.y<=83||sample.falling!==true)throw Error('Missing real accumulated airborne fall');
     row.entry=sample;
     // The getter may omit a queued impulse. The next two ticks are compared
     // with the real control so keepVelocity cannot silently discard that work.
     entity.applyImpulse(PENDING);row.before=state(entity);
     if(method==='teleport')entity.teleport({...row.before.position},{dimension,keepVelocity:true,checkForBlocks:false});
     if(method==='tryTeleport')row.teleportAccepted=entity.tryTeleport({...row.before.position},{dimension,keepVelocity:true,checkForBlocks:false});
     row.after=state(entity);
    }
   }else{
    if(row.following.length<2)row.following.push(sample);
    if(sample.ground===true&&landTick===undefined){landTick=system.currentTick;row.landing=sample;row.landed=true;}
    if(landTick!==undefined&&system.currentTick-landTick>=3)break;
   }
   await wait(1);
  }
  row.final=state(entity);
  if(!row.before||!row.landed||row.following.length!==2)throw Error('Fall observation incomplete');
  if(row.hurt.some(event=>event.cause!=='fall'))throw Error('Foreign damage contaminated the fall');
  row.fallDamage=damage(row);row.healthLost=row.initial.health-row.final.health;
  if(Math.abs(row.healthLost-row.fallDamage)>.00002)throw Error('Health change does not match native afterHurt');
  emit('CASE',row);return row;
 }finally{
  if(entity){tracked.delete(entity.id);if(kind==='player')entity.disconnect();else if(entity.isValid)entity.remove();}
  for(let i=0;i<10&&world.getAllPlayers().length;i++)await wait(1);
  if(world.getAllPlayers().length)throw Error('QA Player did not disconnect');
 }
}

function compare(control,row){
 const entryMatched=vectorNear(control.entry.position,row.entry.position)&&vectorNear(control.entry.velocity,row.entry.velocity);
 const immediatePreserved=vectorNear(row.before.position,row.after.position)&&vectorNear(row.before.velocity,row.after.velocity)
  &&rotationNear(row.before.rotation,row.after.rotation)&&row.before.ground===false&&row.after.ground===false;
 const followingPreserved=row.following.every((sample,index)=>{
  const reference=control.following[index];
  return sample.tick-row.after.tick===reference.tick-control.after.tick
   &&vectorNear(sample.velocity,reference.velocity)
   &&vectorNear(delta(sample.position,row.after.position),delta(reference.position,control.after.position))
   &&sample.ground===false&&reference.ground===false;
 });
 const result={kind:row.kind,method:row.method,entryMatched,immediatePreserved,followingPreserved,
  accepted:row.method!=='tryTeleport'||row.teleportAccepted===true,
  controlDamage:control.fallDamage,observedDamage:row.fallDamage,
  nativeFallingBefore:row.before.falling,nativeFallingAfter:row.after.falling};
 result.reducedFallDamage=row.fallDamage<control.fallDamage;
 result.candidate=entryMatched&&immediatePreserved&&followingPreserved&&result.accepted&&result.reducedFallDamage;
 return result;
}

system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='captain_fall_qa:run'||running)return;
 running=true;
 run().catch(error=>emit('RESULT',{completed:false,error:String(error),stack:error.stack,playersAfter:world.getAllPlayers().length}));
});
async function run(){
 if(world.getAllPlayers().length)throw Error('An empty isolated QA world is required');
 const dimension=world.getDimension('overworld'),rows=[],comparisons=[];
 world.gameRules.doMobSpawning=false;world.gameRules.fallDamage=true;world.gameRules.naturalRegeneration=false;
 dimension.runCommand('fill -8 80 -8 8 94 8 air');
 dimension.runCommand('fill -8 80 -8 8 80 8 stone');
 for(const kind of ['mob','player']){
  const control=await observe(dimension,kind,'control');rows.push(control);
  if(control.fallDamage<=0||control.final.health<=0)throw Error('Control lacks a surviving native fall-damage event');
  for(const method of ['teleport','tryTeleport']){
   const row=await observe(dimension,kind,method);rows.push(row);comparisons.push(compare(control,row));
  }
 }
 emit('RESULT',{completed:true,controlsValid:true,cases:rows.length,comparisons,
  playersAfter:world.getAllPlayers().length,runtimeChanged:false,
  scope:'One native fall capability comparison, not Captain Gift ground/jump/charge or client parity'});
}
