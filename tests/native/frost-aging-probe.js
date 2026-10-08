import {world,system,BlockPermutation} from '@minecraft/server';
import {FROST,FrostAgingScheduler,setFrostAgingScheduler} from './frost-aging.js';
import {freezeWater} from './frost-water.js';
const out=(kind,row)=>console.log('[FROST_AGING_QA] '+JSON.stringify({kind,...row}));
const wait=n=>new Promise(r=>system.runTimeout(r,n));
const pos=(x=0,z=0)=>({x,y:80,z});
world.afterEvents.worldLoad.subscribe(()=>{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 3 aging_qa');
 system.runTimeout(async()=>{try{
  world.gameRules.randomTickSpeed=0;world.gameRules.doDayLightCycle=false;d.runCommand('weather clear');d.runCommand('time set noon');
  out('capability',{height:d.heightRange});
  const restart=world.getDynamicProperty('frost_qa:restart')===true;
  const scheduler=new FrostAgingScheduler(world,{random:()=>0});setFrostAgingScheduler(scheduler);
  if(!restart){
   d.runCommand('fill -5 79 -5 36 86 5 air');d.runCommand('fill -5 79 -5 36 79 5 stone');
   d.getBlock(pos()).setType(FROST);scheduler.place(d,pos());scheduler.schedule(d.id,pos(),1);scheduler.flush();
   for(let i=0;i<30;i++){scheduler.tick();await wait(1);}
   if(d.getBlock(pos()).permutation.getState('age')!==0||scheduler.clock!==30)throw Error('First delay did not retain original queued60');
   const saved=world.getDynamicPropertyIds().filter(x=>x.startsWith('kwl:frost_ticks/')).map(x=>({key:x,value:world.getDynamicProperty(x)}));
   if(saved.length!==1)throw Error('Missing native saved queue');
   world.setDynamicProperty('frost_qa:restart',true);out('case',{name:'saved-half-delay',clock:scheduler.clock,age:0,saved});out('done',{phase:'first',players:world.getAllPlayers().length});return;
  }
  if(scheduler.clock!==30||scheduler.rows.size!==1)throw Error('Native restarted queue/clock lost');
  for(let i=0;i<29;i++){scheduler.tick();await wait(1);}
  if(d.getBlock(pos()).permutation.getState('age')!==0)throw Error('Restarted queue fired early');
  scheduler.tick();await wait(1);out('case',{name:'first-age-after-restart',clock:scheduler.clock,age:d.getBlock(pos()).permutation.getState('age')});
  if(d.getBlock(pos()).permutation.getState('age')!==1)throw Error('Restarted first age not60');
  for(const expected of [2,3]){for(let i=0;i<20;i++){scheduler.tick();await wait(1);}if(d.getBlock(pos()).permutation.getState('age')!==expected)throw Error('Wrong source age '+expected);out('case',{name:'age-'+expected,clock:scheduler.clock,age:expected});}
  for(let i=0;i<20;i++){scheduler.tick();await wait(1);}if(d.getBlock(pos()).typeId!=='minecraft:water')throw Error('Age3 did not melt');out('case',{name:'melt',clock:scheduler.clock,type:d.getBlock(pos()).typeId});
  // Native light response must defer aging, not implement an unconditional timer.
  d.getBlock(pos(8)).setType(FROST);scheduler.place(d,pos(8));scheduler.flush();d.runCommand('time set midnight');
  for(let i=0;i<100;i++){scheduler.tick();await wait(1);}if(d.getBlock(pos(8)).permutation.getState('age')!==0)throw Error('Darkness aged source ice');out('case',{name:'night-deferred',light:d.getBlock(pos(8)).getLightLevel(),clock:scheduler.clock,age:0});
  const ownClock=scheduler.clock;d.runCommand('time set 1000000');d.runCommand('time set noon');await wait(1);if(scheduler.clock!==ownClock)throw Error('/time advanced owned scheduling');
  for(let i=0;i<20;i++){scheduler.tick();await wait(1);}if(d.getBlock(pos(8)).permutation.getState('age')!==1)throw Error('Sunny rescheduled tick missing');out('case',{name:'time-command-isolated',clock:scheduler.clock,age:1});
  for(const x of [16,17,18])d.getBlock(pos(x)).setType(FROST);
  for(const x of [16,17,18])scheduler.place(d,pos(x));scheduler.flush();d.getBlock(pos(17)).setType('minecraft:stone');scheduler.removed(d,pos(17));
  if(d.getBlock(pos(16)).typeId!=='minecraft:water'||d.getBlock(pos(18)).typeId!=='minecraft:water'||d.getBlock(pos(17)).typeId!=='minecraft:stone')throw Error('Neighbor source/foreign solid mismatch');out('case',{name:'neighbor-removal',left:d.getBlock(pos(16)).typeId,right:d.getBlock(pos(18)).typeId,solid:d.getBlock(pos(17)).typeId});
  // Execute the actual production selection helper against real water.
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)d.getBlock({x:28+x,y:80,z}).setType('minecraft:water');
  const mover=d.spawnEntity('frost_qa:mover',{x:28.5,y:81,z:.5});d.getBlock(pos(28)).setType('minecraft:stone');await wait(10);if(!mover.isOnGround)throw Error('Native mover not grounded');
  const before=scheduler.rows.size,frozen=freezeWater(mover,0);if(frozen!==28||scheduler.rows.size-before!==28)throw Error('Production source queue enrollment');out('case',{name:'production-enrollment',frozen,queued:scheduler.rows.size-before});mover.remove();
  out('done',{phase:'restart',players:world.getAllPlayers().length});
 }catch(e){out('failure',{error:String(e),stack:e.stack});}},30);
});
