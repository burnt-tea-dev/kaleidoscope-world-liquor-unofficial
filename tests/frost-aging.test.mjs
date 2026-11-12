import test from 'node:test';
import assert from 'node:assert/strict';
import {FROST,FrostAgingScheduler,frostDelay,setFrostAgingScheduler} from '../runtime/BP/scripts/frost-aging.js';
import {freezeWater} from '../runtime/BP/scripts/frost-water.js';
const loc=(x=0,y=80,z=0)=>({x,y,z});
function fixture(){
 const cells=new Map(),properties=new Map(),queries=[],writes=[];let loaded=true;
 const id=p=>`${p.x},${p.y},${p.z}`;
 function block(p){const k=id(p);if(!cells.has(k))cells.set(k,{typeId:'minecraft:air',age:0,light:15});const row=cells.get(k);return {get typeId(){return row.typeId;},permutation:{getState:()=>row.age,withState:(name,value)=>({age:value})},getLightLevel(){queries.push('light');return row.light;},setType(v){row.typeId=v;},setPermutation(v){row.age=v.age;}};}
 const dimension={id:'minecraft:overworld',getBlock(p){if(!loaded)throw Error('unloaded');queries.push(id(p));return block(p);}};
 const world={getDynamicProperty:k=>properties.get(k),getDynamicPropertyIds:()=>[...properties.keys()],setDynamicProperty(k,v){writes.push(k);if(v===undefined)properties.delete(k);else properties.set(k,v);},getDimension:()=>dimension};
 const ice=(p,age=0,light=15)=>cells.set(id(p),{typeId:FROST,age,light});
 return {world,dimension,cells,properties,queries,writes,block,ice,setLoaded:v=>{loaded=v;}};
}
test('source nextInt delay endpoints',()=>{
 assert.equal(frostDelay(()=>0,60,120),60);assert.equal(frostDelay(()=>1-Number.EPSILON,60,120),120);
 assert.equal(frostDelay(()=>0,20,40),20);assert.equal(frostDelay(()=>1-Number.EPSILON,20,40),40);
});
test('original first queue wins, then three ages and melt at real source delays',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});f.ice(loc());s.place(f.dimension,loc());s.schedule(f.dimension.id,loc(),1);s.flush();
 for(let i=0;i<59;i++)s.tick();assert.equal(f.block(loc()).permutation.getState('age'),0);
 s.tick();assert.equal(f.block(loc()).permutation.getState('age'),1);
 for(let i=0;i<20;i++)s.tick();assert.equal(f.block(loc()).permutation.getState('age'),2);
 for(let i=0;i<20;i++)s.tick();assert.equal(f.block(loc()).permutation.getState('age'),3);
 for(let i=0;i<20;i++)s.tick();assert.equal(f.block(loc()).typeId,'minecraft:water');assert.equal(s.rows.size,0);
 assert.equal(f.properties.size,2);
});
test('darkness reschedules without a guessed lifetime; restart and /time independent clock',()=>{
 const f=fixture();f.ice(loc(),0,4);let s=new FrostAgingScheduler(f.world,{random:()=>0});s.place(f.dimension,loc());s.flush();for(let i=0;i<35;i++)s.tick();s=new FrostAgingScheduler(f.world,{random:()=>0});for(let i=0;i<165;i++)s.tick();assert.equal(f.block(loc()).permutation.getState('age'),0);assert.equal(s.rows.size,1);assert.equal(s.clock,200);
});
test('unloaded work preserves remaining delay rather than aging or being forgotten',()=>{
 const f=fixture();f.ice(loc());let s=new FrostAgingScheduler(f.world,{random:()=>0});s.place(f.dimension,loc());s.flush();for(let i=0;i<30;i++)s.tick();f.setLoaded(false);for(let i=0;i<200;i++)s.tick();s=new FrostAgingScheduler(f.world,{random:()=>0});f.setLoaded(true);s.tick();for(let i=0;i<29;i++)s.tick();assert.equal(f.block(loc()).permutation.getState('age'),0);s.tick();assert.equal(f.block(loc()).permutation.getState('age'),1);
});
test('removing tracked ice notifies adjacent ice and refuses to replace a foreign solid block',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});for(let x=0;x<3;x++)f.ice(loc(x));for(let x=0;x<3;x++)s.place(f.dimension,loc(x));f.block(loc(1)).setType('minecraft:stone');s.removed(f.dimension,loc(1));assert.equal(f.block(loc()).typeId,'minecraft:water');assert.equal(f.block(loc(2)).typeId,'minecraft:water');assert.equal(f.block(loc(1)).typeId,'minecraft:stone');assert.equal(s.rows.size,0);
});
test('foreign adjacent vanilla ice is watched without owning or scheduling it until the original branch mutates it',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});f.ice(loc());f.ice(loc(1));s.place(f.dimension,loc());assert.equal(s.rows.size,1);assert.equal(s.watched.size,1);f.block(loc(1)).setType('minecraft:air');s.tick();assert.equal(f.block(loc()).typeId,'minecraft:water');
});
test('source short circuit skips brightness and aging when chance and neighbors both reject',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>.9});f.ice(loc());for(const p of [loc(1),loc(-1),loc(0,79),loc(0,81)])f.ice(p);s.place(f.dimension,loc());f.queries.length=0;for(let i=0;i<114;i++)s.tick();assert.ok(!f.queries.includes('light'));assert.equal(f.block(loc()).permutation.getState('age'),0);
});
test('production source-water placement enrolls exactly one queue per converted cell',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){const p=loc(x,80,z);f.cells.set(`${p.x},${p.y},${p.z}`,{typeId:'minecraft:water',age:0,light:15});}
 const get=f.dimension.getBlock;f.dimension.getBlock=p=>{const b=get(p);return {get typeId(){return b.typeId;},get isAir(){return b.typeId==='minecraft:air';},permutation:{getState:()=>0},setType:v=>b.setType(v)};};setFrostAgingScheduler(s);
 try{assert.equal(freezeWater({dimension:f.dimension,isOnGround:true,location:{x:.5,y:81,z:.5}},0),29);assert.equal(s.rows.size,29);assert.ok(f.properties.size>0);}finally{setFrostAgingScheduler(undefined);}
});

test('orphan foreign watchers retire after the last managed neighbor is gone',()=>{const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});f.ice(loc());f.ice(loc(1));s.place(f.dimension,loc());f.block(loc()).setType('minecraft:stone');s.tick();assert.equal(s.rows.size,0);assert.equal(s.watched.size,0);});
test('equal-time source order survives section serialization and negative coordinates',()=>{
 const f=fixture();let s=new FrostAgingScheduler(f.world,{random:()=>0});
 const points=[loc(8),loc(-8),loc(2)];for(const p of points){f.ice(p);s.place(f.dimension,p);}s.flush();
 s=new FrostAgingScheduler(f.world,{random:()=>0});const order=[];s.scheduled=(row)=>order.push(row.p.x);
 for(let i=0;i<60;i++)s.tick();assert.deepEqual(order,[8,-8,2]);
});
test('an unavailable melt follow-up keeps the central ice and its pending request',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});f.ice(loc(),3);s.place(f.dimension,loc());s.flush();const original=f.dimension.getBlock;
 f.dimension.getBlock=p=>p.x===1?undefined:original(p);for(let i=0;i<60;i++)s.tick();assert.equal(f.block(loc()).typeId,FROST);assert.equal(s.rows.size,1);
 f.dimension.getBlock=original;s.tick();assert.equal(f.block(loc()).typeId,'minecraft:water');
});
test('source air above the native height boundary permits valid top-level water without querying outside',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});f.dimension.heightRange={min:-64,max:320};const original=f.dimension.getBlock;
 for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)f.cells.set(`${x},319,${z}`,{typeId:'minecraft:water',age:0,light:15});
 f.dimension.getBlock=p=>{assert.ok(p.y<320);const b=original(p);return {get typeId(){return b.typeId;},get isAir(){return b.typeId==='minecraft:air';},permutation:{getState:()=>0},setType:v=>b.setType(v)};};setFrostAgingScheduler(s);
 try{assert.equal(freezeWater({dimension:f.dimension,isOnGround:true,location:{x:.5,y:320,z:.5}},0),29);}finally{setFrostAgingScheduler(undefined);}
});

test('paused chunks resume on the first loaded tick without restart or a retry budget',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});let loaded=false;
 f.dimension.isChunkLoaded=()=>loaded;
 // More than four chunks; include negative coordinates and a zero remainder.
 for(let i=-5;i<7;i++){const p=loc(i*16);f.ice(p);s.schedule(f.dimension.id,p,60);}
 f.setLoaded(false);s.tick();
 for(const row of s.rows.values())assert.equal(row.paused,60);
 loaded=true;f.setLoaded(true);s.tick();
 for(const row of s.rows.values()){assert.equal(row.due,62);assert.equal(row.paused,null);}
 const order=[];s.scheduled=row=>order.push(row.p.x);
 for(let i=0;i<60;i++)s.tick();assert.deepEqual(order,Array.from({length:12},(_,i)=>(i-5)*16));
});
test('dense paused ice uses one load query per chunk per tick without sorting or reading its blocks',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world,{random:()=>0});let checks=0,reads=0;
 f.dimension.isChunkLoaded=()=>{checks++;return false;};
 const get=f.dimension.getBlock;f.dimension.getBlock=p=>{reads++;return get(p);};
 for(let x=0;x<16;x++)for(let y=80;y<96;y++)for(let z=0;z<16;z++)s.schedule(f.dimension.id,loc(x,y,z),60);
 f.setLoaded(false);s.tick();reads=0;checks=0;
 const original=Array.prototype.sort,sizes=[];
 Array.prototype.sort=function(...args){sizes.push(this.length);return original.apply(this,args);};
 try{for(let i=0;i<20;i++)s.tick();}finally{Array.prototype.sort=original;}
 assert.equal(reads,0);assert.equal(checks,20);assert.equal(s.rows.size,4096);
 assert.ok(sizes.every(n=>n===0));
 for(const row of s.rows.values()){assert.equal(row.due,null);assert.equal(row.paused,60);}
});
test('paused chunk keys distinguish dimensions and negative X/Z; loaded rows retain global order',()=>{
 const f=fixture(),checks=[],loaded=new Set(['minecraft:nether/-1/-1','minecraft:overworld/0/0']);
 f.world.getDimension=id=>({id,getBlock:p=>{if(!loaded.has(`${id}/${Math.floor(p.x/16)}/${Math.floor(p.z/16)}`))return undefined;return {typeId:FROST};},isChunkLoaded:p=>{const key=`${id}/${Math.floor(p.x/16)}/${Math.floor(p.z/16)}`;checks.push(key);return loaded.has(key);}});
 const s=new FrostAgingScheduler(f.world),rows=[
  ['minecraft:overworld',loc(-1,80,-1)],['minecraft:nether',loc(-1,80,-1)],
  ['minecraft:overworld',loc(0,80,0)],['minecraft:nether',loc(0,80,0)],
  ['minecraft:overworld',loc(-2,90,-2)]
 ];
 for(const [id,p]of rows){s.schedule(id,p,60);const row=[...s.rows.values()].at(-1);row.due=null;row.paused=0;}
 const order=[];s.scheduled=row=>order.push(row.order);s.tick();
 assert.deepEqual(order,[1,2]);assert.equal(checks.length,4);assert.equal(s.rows.size,3);
 loaded.add('minecraft:overworld/-1/-1');loaded.add('minecraft:nether/0/0');s.tick();
 assert.deepEqual(order,[1,2,0,3,4]);assert.equal(s.rows.size,0);
});
test('missing, throwing or inconclusive chunk API falls back; known-loaded block errors remain per-row',()=>{
 for(const probe of [undefined,()=>{throw Error('probe unavailable');},()=>undefined,()=>true]){
  const f=fixture(),s=new FrostAgingScheduler(f.world);f.dimension.isChunkLoaded=probe;
  for(let x=0;x<2;x++){f.ice(loc(x));s.schedule(f.dimension.id,loc(x),60);}
  f.setLoaded(false);s.tick();f.setLoaded(true);
  const get=f.dimension.getBlock;f.dimension.getBlock=p=>p.x===0?undefined:get(p);
  s.tick();const rows=[...s.rows.values()];
  assert.equal(rows[0].due,null);assert.equal(rows[0].paused,60);
  assert.equal(rows[1].due,62);assert.equal(rows[1].paused,null);
 }
});
test('out-of-height paused rows keep the original synthetic-air cleanup',()=>{
 const f=fixture(),s=new FrostAgingScheduler(f.world);f.dimension.heightRange={min:-64,max:320};f.dimension.isChunkLoaded=()=>false;f.setLoaded(false);
 s.schedule(f.dimension.id,loc(0,80),60);s.schedule(f.dimension.id,loc(0,400),60);
 for(const row of s.rows.values()){row.due=null;row.paused=60;}
 s.tick();assert.equal(s.rows.size,1);assert.equal([...s.rows.values()][0].p.y,80);
});
