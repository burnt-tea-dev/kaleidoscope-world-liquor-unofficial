// Production callback behavior with mocked engine objects. Actual BDS/API and
// human audio acceptance are separate; this suite does not simulate a client.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../runtime/BP/scripts/record-audio.js',import.meta.url),'utf8').replace(/^import .*;\n/,'').replaceAll('export function','function');
const N='kaleidoscope_world_liquor',prefix=N+':storage/overworld/',BASE=N+'.music_disc.random_disc',legacySound=BASE+'.station_0';
const state=()=>({type:'minecraft:jukebox',record:N+':custom_record'});
const song=JSON.parse(fs.readFileSync(new URL('../upstream/data/kaleidoscope_world_liquor/jukebox_song/random_disc.json',import.meta.url)));
test('the original Java equal-weight streamed tracks and their exact audio bytes are retained',()=>{
 const original=JSON.parse(fs.readFileSync(new URL('../upstream/assets/kaleidoscope_world_liquor/sounds.json',import.meta.url)))['music_disc.random_disc'];
 const definitions=JSON.parse(fs.readFileSync(new URL('../runtime/RP/sounds/sound_definitions.json',import.meta.url))).sound_definitions;
 const actual=definitions[BASE];assert.equal(actual.category,'record');assert.equal(actual.min_distance,16);assert.equal(actual.max_distance,64);
 assert.deepEqual(actual.sounds,original.sounds.map(s=>({...s,name:'sounds/kwl/'+s.name.split(':')[1]})));
 const hashes=['63412411f058ec5626a40bb1dd01929c776e2ac516055a97093743078f5ceb46','044adbda766abc3dca9d1d807e3df565cd285520b582ec1f8a0ffe3c1a29c185'];
 for(let i=0;i<original.sounds.length;i++){
  const name=original.sounds[i].name.split(':')[1]+'.ogg',upstream=fs.readFileSync(new URL('../upstream/assets/kaleidoscope_world_liquor/sounds/'+name,import.meta.url)),runtime=fs.readFileSync(new URL('../runtime/RP/sounds/kwl/'+name,import.meta.url));
  assert.deepEqual(runtime,upstream);assert.equal(createHash('sha256').update(runtime).digest('hex'),hashes[i]);
 }
 assert.deepEqual(Object.keys(definitions).filter(id=>id===BASE||id.startsWith(BASE+'.')),[BASE]);
});
function fixture(saved){
 const rows=new Map(saved),blocks=new Map(),timers=[],sounds=[],drops=[];let explosion,idScans=0,playFailure=false,subscriptions=0;
 const system={currentTick:0,runInterval:(f,n)=>timers.push({f,n})};
 const dim={id:'minecraft:overworld',getBlock:p=>{const b=blocks.get(p.x);if(b==='unloaded')throw Error('unloaded');return b;},spawnItem:i=>drops.push(i),playSound:(event,location,options)=>{
  if(playFailure)throw Error('play failure');
  const handle={id:'sound-'+sounds.length,soundEventId:event,stopCalls:0,stopped:false,stop(){this.stopCalls++;if(this.failStop)throw Error('stop failure');this.stopped=true;}};
  sounds.push({event,location,options,handle});return handle;
 }};
 const world={gameRules:{doTileDrops:true},getDynamicPropertyIds:()=>{idScans++;return [...rows.keys()];},getDynamicProperty:k=>rows.get(k),setDynamicProperty:(k,v)=>v===undefined?rows.delete(k):rows.set(k,v),getDimension:()=>dim,afterEvents:{explosion:{subscribe:f=>{subscriptions++;explosion=f;}}}};
 const ctx=vm.createContext({world,system,ItemStack:class{constructor(id){this.typeId=id;}}});vm.runInContext(source,ctx);
 const api=vm.runInContext('({playRecord,stopRecord,installRecordCleanup})',ctx);
 const add=(x,type,s=state())=>{const b={typeId:type,dimension:dim,location:{x,y:64,z:0}};blocks.set(x,b);rows.set(prefix+x+'_64_0',typeof s==='string'?s:JSON.stringify(s));return b;};
 return {rows,blocks,timers,sounds,drops,world,system,add,...api,start:api.installRecordCleanup,tick:()=>timers.forEach(t=>t.f()),explode:bs=>explosion({getImpactedBlocks:()=>bs}),get idScans(){return idScans;},get subscriptions(){return subscriptions;},set playFailure(v){playFailure=v;}};
}
test('forty concurrent jukeboxes have independent instances without alias allocation or saved-row scans',()=>{
 const f=fixture();f.start();const initialScans=f.idScans,handles=[];
 for(let i=0;i<40;i++)handles.push(f.playRecord(f.add(i,'minecraft:jukebox'),state()));
 assert.equal(new Set(handles.map(h=>h.id)).size,40);assert.equal(f.idScans,initialScans);
 assert.ok(f.sounds.every(s=>s.event===BASE&&s.options.isBroadcast===true&&s.options.volume===4&&s.options.pitch===1));
 assert.equal(f.sounds[0].location.x,.5);assert.equal(f.sounds[0].location.y,64.5);
 assert.ok(handles.every(h=>!h.stopped));
});
test('ejecting one same-event record cannot stop another jukebox',()=>{
 const f=fixture(),a=f.add(0,'minecraft:jukebox'),b=f.add(1,'minecraft:jukebox');
 const first=f.playRecord(a,state()),second=f.playRecord(b,state());
 f.stopRecord(a,state());assert.equal(first.stopCalls,1);assert.equal(second.stopCalls,0);
 f.stopRecord(a,state());assert.equal(first.stopCalls,1);
});
test('replacing a playback at the same coordinate retires only that prior instance',()=>{
 const f=fixture(),a=f.add(0,'minecraft:jukebox'),b=f.add(1,'minecraft:jukebox');
 const previous=f.playRecord(a,state()),other=f.playRecord(b,state()),replacement=f.playRecord(a,state());
 assert.equal(previous.stopCalls,1);assert.equal(other.stopCalls,0);assert.equal(replacement.stopCalls,0);
});
test('legacy alias metadata does not select or stop a shared sound event',()=>{
 const f=fixture(),s={...state(),recordSound:legacySound},a=f.add(0,'minecraft:jukebox',s),stored=f.rows.get(prefix+'0_64_0');
 const h=f.playRecord(a,s);assert.equal(h.soundEventId,BASE);f.stopRecord(a,s);assert.equal(h.stopCalls,1);assert.equal(f.rows.get(prefix+'0_64_0'),stored);
});
test('reload preserves both generations of jukebox state and wall payloads without replaying',()=>{
 const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'});f.add(1,'minecraft:jukebox',{record:N+':custom_record',recordSound:legacySound});f.add(2,'minecraft:jukebox',state());
 const before=[...f.rows];f.start();for(let i=0;i<5;i++)f.tick();assert.deepEqual([...f.rows],before);assert.equal(f.sounds.length,0);
});
test('a new script instance reads saved discs without reusing stale engine handles',()=>{
 const first=fixture(),a=first.add(0,'minecraft:jukebox');first.playRecord(a,state());
 const restarted=fixture(first.rows);restarted.add(0,'minecraft:jukebox');restarted.start();restarted.tick();
 assert.deepEqual([...restarted.rows],[...first.rows]);assert.equal(restarted.sounds.length,0);
});
test('stale audio metadata never makes a valid wall decoration disposable',()=>{
 const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat',recordSound:legacySound});const before=[...f.rows];f.start();f.tick();assert.deepEqual([...f.rows],before);assert.equal(f.sounds.length,0);
});
test('a former jukebox replaced by a wall record stops its own sound and preserves the wall item',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());b.typeId=N+':wall_record';f.rows.set(prefix+'0_64_0',JSON.stringify({record:'minecraft:music_disc_cat'}));const before=[...f.rows];f.tick();assert.equal(h.stopCalls,1);assert.deepEqual([...f.rows],before);
});
test('removed jukebox stops its own audio and clears only its own payload',()=>{
 const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'});const b=f.add(1,'minecraft:jukebox'),other=f.add(2,'minecraft:jukebox');f.start();const removed=f.playRecord(b,state()),retained=f.playRecord(other,state());b.typeId='minecraft:air';f.tick();assert.equal(f.rows.size,2);assert.equal(removed.stopCalls,1);assert.equal(retained.stopCalls,0);
});
test('unloaded chunks preserve saved discs and do not restart or globally stop audio',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state()),before=[...f.rows];f.blocks.set(0,'unloaded');f.tick();f.blocks.delete(0);f.tick();assert.deepEqual([...f.rows],before);assert.equal(h.stopCalls,0);assert.equal(f.sounds.length,1);f.blocks.set(0,b);f.tick();assert.equal(f.sounds.length,1);
});
test('the Java song duration expires playback while retaining its retrievable disc',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();f.system.currentTick=100;const h=f.playRecord(b,state()),before=[...f.rows];f.system.currentTick=100+song.length_in_seconds*20-1;f.tick();assert.equal(h.stopCalls,0);f.system.currentTick++;f.tick();assert.equal(h.stopCalls,1);assert.deepEqual([...f.rows],before);f.tick();assert.equal(h.stopCalls,1);
});
test('duration cleanup also runs while the source chunk is unloaded',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state()),before=[...f.rows];f.blocks.set(0,'unloaded');f.system.currentTick=song.length_in_seconds*20;f.tick();assert.equal(h.stopCalls,1);assert.deepEqual([...f.rows],before);
});
test('corrupt and unrelated saved rows are not silently deleted',()=>{
 const f=fixture();f.add(0,'minecraft:jukebox','{broken');f.add(1,N+':wall_record','{broken');f.add(2,'minecraft:air',{items:[{typeId:'minecraft:diamond',amount:1}]});const before=[...f.rows];f.start();f.tick();assert.deepEqual([...f.rows],before);
});
test('a missing live payload retires only its sound without inventing a disc',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());f.rows.delete(prefix+'0_64_0');f.tick();assert.equal(h.stopCalls,1);assert.equal(f.rows.size,0);assert.equal(f.drops.length,0);
});
test('explosion ownership leaves wall drops to furniture and handles the jukebox only once',()=>{
 const f=fixture(),wall=f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'}),box=f.add(1,'minecraft:jukebox'),other=f.add(2,'minecraft:jukebox');f.start();const removed=f.playRecord(box,state()),retained=f.playRecord(other,state());box.typeId='minecraft:air';f.explode([wall,box]);f.explode([wall,box]);assert.equal(f.rows.size,2);assert.deepEqual(f.drops.map(x=>x.typeId),[N+':custom_record']);assert.equal(removed.stopCalls,1);assert.equal(retained.stopCalls,0);
});
test('doTileDrops=false suppresses jukebox explosion drops while stopping playback',()=>{
 const f=fixture();f.world.gameRules.doTileDrops=false;const b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());b.typeId='minecraft:air';f.explode([b]);assert.equal(f.drops.length,0);assert.equal(f.rows.size,0);assert.equal(h.stopCalls,1);
});
test('installing cleanup twice does not duplicate subscriptions or reset active handles',()=>{
 const f=fixture();f.start();const b=f.add(0,'minecraft:jukebox'),h=f.playRecord(b,state());f.start();assert.equal(f.timers.length,1);assert.equal(f.subscriptions,1);f.stopRecord(b);assert.equal(h.stopCalls,1);
});
test('playback creation failure retains the previous instance and saved disc',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox'),h=f.playRecord(b,state()),before=[...f.rows];f.playFailure=true;assert.throws(()=>f.playRecord(b,state()),/play failure/);assert.equal(h.stopCalls,0);assert.deepEqual([...f.rows],before);
});
test('failed previous-instance stop cancels the replacement and keeps a retryable handle',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox'),h=f.playRecord(b,state());h.failStop=true;assert.throws(()=>f.playRecord(b,state()),/stop failure/);assert.equal(f.sounds[1].handle.stopCalls,1);h.failStop=false;f.stopRecord(b);assert.equal(h.stopCalls,2);
});
test('transient cleanup stop failure retains the saved disc until a successful retry',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());h.failStop=true;b.typeId='minecraft:air';f.tick();assert.equal(f.rows.size,1);h.failStop=false;f.tick();assert.equal(f.rows.size,0);assert.equal(h.stopCalls,2);
});
