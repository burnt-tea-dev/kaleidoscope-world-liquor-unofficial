import test from 'node:test';
import assert from 'node:assert/strict';
import {installDrinkAudio,useSoundPulse,drinkPitch} from '../runtime/BP/scripts/drink-audio.js';
import {payload} from '../runtime/BP/scripts/payload.js';

function fixture(){
 const handlers={},sounds=[],tasks=new Map();let tick=0,sequence=0;
 const world={afterEvents:Object.fromEntries(['itemStartUse','itemStopUse','itemCompleteUse','playerLeave'].map(name=>[name,{subscribe:fn=>handlers[name]=fn}]))};
 const system={runTimeout(fn,delay){const id=++sequence;tasks.set(id,{fn,at:tick+delay});return id;},clearRun:id=>tasks.delete(id)};
 const actor={id:'API fixture',location:{x:1,y:2,z:3},dimension:{playSound:(sound,at,options)=>sounds.push({tick,sound,at:{...at},options})}};
 const installed=installDrinkAudio(world,system,payload.content,()=>.5);
 const event=(type,item='kaleidoscope_world_liquor:ice_tea_q4',more={})=>handlers[type]({source:actor,itemStack:{typeId:item},useDuration:32,...more});
 const advance=to=>{while(tick<to){tick++;for(const [id,t] of [...tasks])if(t.at<=tick){tasks.delete(id);t.fn();}}};
 return {installed,event,advance,actor,sounds,tasks,handlers};
}

test('source 32-tick drinking cadence plus the real completion pulse',()=>{
 const f=fixture();f.event('itemStartUse');f.advance(32);f.event('itemCompleteUse');
 assert.deepEqual(f.sounds.map(x=>x.tick),[8,12,16,20,24,28,32]);
 assert.ok(f.sounds.every(x=>x.sound==='kaleidoscope_world_liquor.ice_tea_eat'&&x.options.volume===.5&&x.options.pitch===drinkPitch(.5)));
 assert.equal(f.installed.active.size,0);assert.equal(f.tasks.size,0);
});
test('all six qualities of each authored custom-sound drink are routed',()=>{
 const f=fixture();assert.equal(f.installed.sounds.size,18);
 for(const base of ['ice_tea','cool_tea','sour_plum'])for(let q=1;q<=6;q++)assert.ok(f.installed.sounds.has(`kaleidoscope_world_liquor:${base}_q${q}`));
});
test('early release cancels sound rather than announcing successful drinking',()=>{
 const f=fixture();f.event('itemStartUse');f.advance(11);f.event('itemStopUse');f.advance(50);assert.deepEqual(f.sounds.map(x=>x.tick),[8]);assert.equal(f.tasks.size,0);
});
test('old scheduled callback cannot sound after a replacement use session',()=>{
 const f=fixture();f.event('itemStartUse');const stale=[...f.tasks.values()][0].fn;
 f.advance(2);f.event('itemStartUse','kaleidoscope_world_liquor:cool_tea_q6');stale();f.advance(10);
 assert.deepEqual(f.sounds.map(x=>[x.tick,x.sound]),[[10,'kaleidoscope_world_liquor.cool_ice_tea_drink']]);
});
test('native events for other items do not cancel a newer owned session',()=>{
 const f=fixture();f.event('itemStartUse');f.event('itemStopUse','minecraft:apple');f.advance(8);assert.equal(f.sounds.length,1);
});
test('leaving and absent completion bound all pending work',()=>{
 const f=fixture();f.event('itemStartUse');f.handlers.playerLeave({playerId:f.actor.id});f.advance(100);assert.equal(f.sounds.length,0);assert.equal(f.tasks.size,0);
 f.event('itemStartUse');f.advance(132);assert.equal(f.installed.active.size,0);assert.equal(f.tasks.size,0);
});
test('world position is taken at each pulse and sound failure does not consume items',()=>{
 const f=fixture();f.event('itemStartUse');f.actor.location={x:6,y:7,z:8};f.advance(8);assert.deepEqual(f.sounds[0].at,f.actor.location);
 f.actor.dimension.playSound=()=>{throw Error('optional audio failure');};f.advance(12);assert.equal(f.installed.active.size,1);
});
test('unrelated vanilla and other addon use events never get this sound',()=>{
 const f=fixture();for(const item of ['minecraft:milk_bucket','other:ice_tea_q4','kaleidoscope_world_liquor:cola']){f.event('itemStartUse',item);f.event('itemCompleteUse',item);}f.advance(100);assert.equal(f.sounds.length,0);assert.equal(f.tasks.size,0);
});
test('cadence and pitch accept only the actual source ranges',()=>{
 assert.deepEqual(Array.from({length:33},(_,r)=>r).filter(r=>r>0&&useSoundPulse(32,r)),[4,8,12,16,20,24]);
 assert.equal(drinkPitch(0),Math.fround(.9));assert.ok(drinkPitch(1-Number.EPSILON)<=1);
 for(const x of [-1,1,NaN,Infinity])assert.throws(()=>drinkPitch(x));
});
