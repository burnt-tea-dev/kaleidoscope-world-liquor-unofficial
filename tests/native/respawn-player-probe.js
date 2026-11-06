import './main.js';
import {world,system,BlockPermutation,GameMode} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';
import {applyEffect} from './effects.js';
import {resolveJavaRespawn,setJavaRespawnContextProvider} from './respawn-adapter.js';

const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n)),KEY='respawn_player_qa:state';
const A={x:10,y:80,z:10},B={x:14,y:80,z:10},hurt=new Map();
let running=false;
async function readable(dimension,points){
 for(let i=0;i<100;i++){
  try{if(points.every(point=>dimension.getBlock(point)))return;}catch{}
  await wait(1);
 }
 throw Error('QA chunks are unavailable in '+dimension.id);
}
function state(player){
 const hunger=player.getEffect('hunger');
 return {tick:system.currentTick,dimension:player.dimension.id,position:{...player.location},velocity:{...player.getVelocity()},
  ground:player.isOnGround,falling:player.isFalling,rotation:{...player.getRotation()},
  health:player.getComponent('minecraft:health').currentValue,hunger:hunger?{amplifier:hunger.amplifier,duration:hunger.duration}:null};
}
world.afterEvents.entityHurt.subscribe(event=>{
 const rows=hurt.get(event.hurtEntity.id);if(rows)rows.push({tick:system.currentTick,cause:event.damageSource.cause,damage:event.damage});
});
system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.id!=='respawn_player_qa:run'||running)return;running=true;
 run().catch(error=>console.warn('RESPAWN_PLAYER_QA_RESULT '+JSON.stringify({passed:false,error:String(error),stack:error.stack,playersAfter:world.getAllPlayers().length})));
});
async function actor(dimension,position,run){
 const overworld=world.getDimension('overworld');let player;
 try{
  player=gt.spawnSimulatedPlayer({dimension:overworld,x:0,y:81,z:0},'RespawnEffectQA',GameMode.Survival);
  player.teleport(position,{dimension});await wait(2);hurt.set(player.id,[]);
  return await run(player);
 }finally{
  setJavaRespawnContextProvider(undefined);
  if(player){hurt.delete(player.id);player.disconnect();}
  for(let i=0;i<10&&world.getAllPlayers().length;i++)await wait(1);
  if(world.getAllPlayers().length)throw Error('QA simulated Player did not disconnect');
 }
}
async function run(){
 const checks=[],observations=[],check=(name,passed)=>{checks.push({name,passed:!!passed});console.warn('RESPAWN_PLAYER_QA_CHECK '+JSON.stringify(checks.at(-1)));if(!passed)throw Error(name);};
 const overworld=world.getDimension('overworld'),nether=world.getDimension('nether');
 check('no real or leftover QA Players',world.getAllPlayers().length===0);
 const saved=world.getDynamicProperty(KEY),phase=saved?'restart':'first';
 await readable(nether,[{x:-4,y:79,z:-4},{x:20,y:95,z:20}]);
 if(saved){
  const row=JSON.parse(saved);
  check('same QA marker and anchors restored',row.kind==='respawn-player-198');
  check('keepInventory anchor retained two charges after restart',nether.getBlock(A).permutation.getState('respawn_anchor_charge')===2);
  check('consumed anchor retained one charge after restart',nether.getBlock(B).permutation.getState('respawn_anchor_charge')===1);
  nether.getBlock(A).setType('minecraft:air');nether.getBlock(B).setType('minecraft:air');world.setDynamicProperty(KEY,undefined);
 }else{
  world.gameRules.doMobSpawning=false;world.gameRules.naturalRegeneration=false;world.gameRules.fallDamage=true;
  overworld.runCommand('fill -8 80 -8 8 95 8 air');overworld.runCommand('fill -8 80 -8 8 80 8 stone');
  nether.runCommand('fill -4 79 -4 20 95 20 air');nether.runCommand('fill -4 79 -4 20 79 20 stone');
  await actor(overworld,{x:.5,y:91.25,z:.5},async player=>{
   // This new normal-teleport case reuses the prior unchanged native fall
   // control (7 damage), rather than rerunning Captain's rejected six cases.
   player.applyImpulse({x:.12,y:0,z:.04});
   for(let i=0;i<50&&player.location.y>85.5;i++)await wait(1);
   const before=state(player);check('normal teleport begins during a real accumulated fall',!before.ground&&before.falling&&before.velocity.y<0&&before.position.y>83);
   const target={x:4.5,y:before.position.y,z:.5};player.teleport(target,{dimension:overworld,rotation:{x:0,y:90}});
   const after=state(player),following=[];for(let i=0;i<2;i++){await wait(1);following.push(state(player));}
   console.warn('RESPAWN_PLAYER_QA_MOTION '+JSON.stringify({before,after,following}));
   check('normal Player teleport reaches the absolute target',Math.abs(after.position.x-target.x)<.00002&&Math.abs(after.position.y-target.y)<.00002);
   check('normal teleport clears native falling flag',after.falling===false);
   check('normal teleport clears horizontal motion across two native ticks',following.every(row=>row.velocity.x===0&&row.velocity.z===0));
   check('old downward velocity is not carried into the next two ticks',following.every(row=>Math.abs(row.velocity.y)<Math.abs(before.velocity.y)));
   for(let i=0;i<50&&!player.isOnGround;i++)await wait(1);await wait(3);
   const final=state(player),events=hurt.get(player.id),fall=events.filter(event=>event.cause==='fall').reduce((sum,event)=>sum+event.damage,0);
   check('native Player lands with only the new fall damage',final.ground&&fall>0&&fall<7&&20-final.health===fall&&events.every(event=>event.cause==='fall'));
   observations.push({kind:'normal_teleport',before,after,following,final,hurt:events,referenceControlDamage:7});
  });
  for(const row of [{kind:'same_dimension_keep_inventory',point:A,keep:true,source:nether,start:{x:.5,y:80.25,z:.5},remaining:2},
   {kind:'cross_dimension_consume_anchor',point:B,keep:false,source:overworld,start:{x:.5,y:81.25,z:.5},remaining:1}]){
   nether.getBlock(row.point).setPermutation(BlockPermutation.resolve('minecraft:respawn_anchor',{respawn_anchor_charge:2}));
   world.gameRules.keepInventory=row.keep;
   await actor(row.source,row.start,async player=>{
    // actor cleanup clears this public QA context after the real effect call.
    setJavaRespawnContextProvider(()=>({personalSpawn:()=>({...row.point,dimension:nether}),metadata:()=>({forced:false})}));
    const plan=resolveJavaRespawn(player,world);check(row.kind+' resolves a supported anchor',plan.status==='ready'&&plan.branch==='anchor');
    player.applyImpulse({x:.12,y:.1,z:.04});await wait(1);const before=state(player);
    console.warn('RESPAWN_PLAYER_QA_BEFORE '+JSON.stringify({kind:row.kind,before,plan:{position:plan.position,yaw:plan.yaw,pitch:plan.pitch},anchorCharges:nether.getBlock(row.point).permutation.getState('respawn_anchor_charge')}));
    applyEffect(player,'kaleidoscope_world_liquor:respawn',1,0);
    const after=state(player),following=[];for(let i=0;i<2;i++){await wait(1);following.push(state(player));}
    console.warn('RESPAWN_PLAYER_QA_AFTER '+JSON.stringify({kind:row.kind,after,following,anchorCharges:nether.getBlock(row.point).permutation.getState('respawn_anchor_charge')}));
    check(row.kind+' uses the real production effect and native destination',after.dimension===nether.id&&['x','y','z'].every(axis=>Math.abs(after.position[axis]-plan.position[axis])<.00002));
    check(row.kind+' applies Hunger 300 tick amplifier zero',after.hunger?.amplifier===0&&after.hunger.duration===300);
    check(row.kind+' preserves health and clears old motion',after.health===20&&following.every(sample=>sample.health===20&&sample.velocity.x===0&&sample.velocity.z===0));
    check(row.kind+' consumes only the required charge',nether.getBlock(row.point).permutation.getState('respawn_anchor_charge')===row.remaining);
    observations.push({kind:row.kind,plan:{position:plan.position,yaw:plan.yaw,pitch:plan.pitch},before,after,following,hurt:hurt.get(player.id),anchorRemaining:row.remaining});
   });
  }
  world.setDynamicProperty(KEY,JSON.stringify({kind:'respawn-player-198'}));
 }
 check('no QA Player remains',world.getAllPlayers().length===0);
 console.warn('RESPAWN_PLAYER_QA_RESULT '+JSON.stringify({passed:true,phase,checks,observations,playersAfter:0,client:false,
  scope:'Normal native Player transport and production applyEffect with declared supported anchor context; no drink input or client audio claim'}));
}
