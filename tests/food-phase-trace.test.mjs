import test from 'node:test';
import assert from 'node:assert/strict';
import {installFoodPhaseTrace,traceFoodPhase} from '../runtime/BP/scripts/food-phase-trace.js';

test('observation cannot write inventory, leaks no actor identity, and is bounded and server-only',()=>{
 let subscriber;const queued=[],timers=[],rows=[],original=console.warn;
 const system={currentTick:100,afterEvents:{scriptEventReceive:{subscribe:fn=>subscriber=fn}},run:fn=>queued.push(fn),runTimeout:(fn,ticks)=>timers.push({fn,ticks})};
 const slots=[{typeId:'kaleidoscope_world_liquor:pochi_pudding',amount:2},{typeId:'minecraft:bowl',amount:3}];
 const source={id:'private-player-id',name:'private-player-name',typeId:'minecraft:player',selectedSlotIndex:0,getGameMode:()=> 'Survival',getComponent:id=>id==='minecraft:inventory'?{container:{size:slots.length,getItem:i=>slots[i],setItem:()=>{throw Error('FORBIDDEN_WRITE');}}}:{getEquipment:()=>undefined},addEffect:()=>{throw Error('FORBIDDEN_EFFECT');}};
 const event={source,itemStack:{typeId:slots[0].typeId,amount:2}};
 console.warn=line=>rows.push(JSON.parse(line.slice(line.indexOf('{'))));
 try{
  installFoodPhaseTrace(system,'Server');
  traceFoodPhase('consume',event);assert.equal(rows.length,0);assert.equal(queued.length,0);
  for(const forbidden of [{sourceType:'Entity'},{sourceType:'Server',sourceEntity:source},{sourceType:'Server',sourceBlock:{}},{sourceType:'Server',initiator:source}])subscriber({id:'kaleidoscope_world_liquor:food_phase_trace',message:'start',...forbidden});
  assert.equal(rows.length,0);
  subscriber({id:'kaleidoscope_world_liquor:food_phase_trace',message:'start',sourceType:'Server'});
  traceFoodPhase('consume',event);assert.equal(rows.at(-1).hand.amount,2);assert.equal(rows.at(-1).bowls,3);
  slots[0]={typeId:'minecraft:diamond',amount:1};system.currentTick++;queued.shift()();assert.equal(rows.at(-1).hand.kind,'other');assert.equal(rows.at(-1).phase,'consume_next_tick');
  assert.ok(!JSON.stringify(rows).includes('private-player'));assert.ok(!JSON.stringify(rows).includes('diamond'));
  for(let i=0;i<100;i++)traceFoodPhase('complete_before',event);
  assert.equal(rows.filter(row=>row.actor).length,64);assert.equal(queued.length,0);
  subscriber({id:'kaleidoscope_world_liquor:food_phase_trace',message:'start',sourceType:'Server'});
  system.currentTick+=2401;timers.at(-1).fn();const before=rows.length;traceFoodPhase('consume',event);assert.equal(rows.length,before);assert.equal(queued.length,0);
  assert.equal(slots[0].typeId,'minecraft:diamond');assert.equal(slots[1].amount,3);
 }finally{console.warn=original;}
});
