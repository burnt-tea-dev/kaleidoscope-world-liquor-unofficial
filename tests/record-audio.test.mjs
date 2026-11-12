// Production callback behavior with mocked engine objects. Actual BDS/API and
// human audio acceptance are separate; this suite does not simulate a client.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {javaFloatRoll} from '../runtime/BP/scripts/combat-source.js';
import {nativeItemKey} from '../runtime/BP/scripts/freezer-native-storage.js';
const source=fs.readFileSync(new URL('../runtime/BP/scripts/record-audio.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export function','function');
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
let nativeSerial=0;
function fixture(saved,entities=new Map()){
 const rows=new Map(saved),blocks=new Map(),timers=[],sounds=[],drops=[],positions=[];let explosion,idScans=0,playFailure=false,subscriptions=0;
 const system={currentTick:0,runInterval:(f,n)=>timers.push({f,n})};
 class ItemStack{constructor(id,amount=1){this.typeId=id;this.amount=amount;}clone(){return Object.assign(new ItemStack(this.typeId,this.amount),JSON.parse(JSON.stringify(this)));}}
 const dim={id:'minecraft:overworld',getBlock:p=>{const b=blocks.get(p.x);if(b==='unloaded')throw Error('unloaded');return b;},spawnItem:(i,position)=>{positions.push({...position});drops.push(i);return {remove(){const index=drops.indexOf(i);if(index>=0)drops.splice(index,1);}};},playSound:(event,location,options)=>{
  if(playFailure)throw Error('play failure');
  const handle={id:'sound-'+sounds.length,soundEventId:event,stopCalls:0,stopped:false,stop(){this.stopCalls++;if(this.failStop)throw Error('stop failure');this.stopped=true;}};
  sounds.push({event,location,options,handle});return handle;
 }};
 dim.spawnEntity=(typeId,location)=>{const slots=[],props=new Map(),entity={typeId,id:'native-'+(++nativeSerial),dimension:dim,location,isValid:true,getDynamicProperty:k=>props.get(k),setDynamicProperty:(k,v)=>props.set(k,v),getComponent:()=>({container:{size:4,getItem:i=>slots[i]?.clone(),setItem:(i,v)=>slots[i]=v?.clone()}}),remove(){this.isValid=false;entities.delete(this.id);}};entities.set(entity.id,entity);return entity;};
 const world={gameRules:{doTileDrops:true},getEntity:id=>entities.get(id),getDynamicPropertyIds:()=>{idScans++;return [...rows.keys()];},getDynamicProperty:k=>rows.get(k),setDynamicProperty:(k,v)=>v===undefined?rows.delete(k):rows.set(k,v),getDimension:()=>dim,afterEvents:{explosion:{subscribe:f=>{subscriptions++;explosion=f;}}}};
 const ctx=vm.createContext({world,system,javaFloatRoll,ItemStack});
 // Execute the real shared storage implementation and adapter in module scopes.
 // Only engine objects are doubles; metadata settlement is never a stub.
 const module=(file,names)=>{const code=fs.readFileSync(new URL('../runtime/BP/scripts/'+file,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');const api=vm.runInContext('(function(){'+code+';return {'+names.join(',')+'};})()',ctx);Object.assign(ctx,api);return api;};
 module('freezer-native-storage.js',['NativeItemStorage','NATIVE_ITEM_ENTITY','NATIVE_STORAGE_OWNER','nativeItemKey','nativeItemRequiredKey','RECORD_ITEM_PREFIX','nativeStorageAnchor']);
 module('freezer-storage.js',['freezerNativeItems','freezerStorageKey','planFreezerStorage']);
 const storage=module('record-storage.js',['planRecordStorage','hasNativeRecord','savedRecord','recordStorageKey']);
 vm.runInContext(source,ctx);
 const api=vm.runInContext('({playRecord,stopRecord,ejectRecord,installRecordCleanup})',ctx);
 const add=(x,type,s=state())=>{const b={typeId:type,dimension:dim,location:{x,y:64,z:0}};blocks.set(x,b);rows.set(prefix+x+'_64_0',typeof s==='string'?s:JSON.stringify(s));return b;};
 return {rows,blocks,timers,sounds,drops,positions,entities,ItemStack,world,system,add,...api,...storage,planFreezerStorage:ctx.planFreezerStorage,start:api.installRecordCleanup,tick:()=>timers.forEach(t=>t.f()),explode:bs=>explosion({getImpactedBlocks:()=>bs}),get idScans(){return idScans;},get subscriptions(){return subscriptions;},set playFailure(v){playFailure=v;}};
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
test('a jukebox replaced outside player and explosion events returns its disc only once',()=>{
 const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'});const b=f.add(1,'minecraft:jukebox'),other=f.add(2,'minecraft:jukebox');f.start();const removed=f.playRecord(b,state()),retained=f.playRecord(other,state());b.typeId='minecraft:air';f.tick();f.tick();assert.deepEqual(f.drops.map(i=>i.typeId),[N+':custom_record']);assert.equal(f.rows.size,2);assert.equal(removed.stopCalls,1);assert.equal(retained.stopCalls,0);
});
test('cleanup leaves a replacement furniture payload intact after retiring the old jukebox sound',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());
 b.typeId=N+':freezer';const replacement=JSON.stringify({type:b.typeId,input:['minecraft:diamond']});f.rows.set(prefix+'0_64_0',replacement);
 f.tick();assert.equal(f.rows.get(prefix+'0_64_0'),replacement);assert.equal(f.drops.length,0);assert.equal(h.stopCalls,1);
});
test('a reloaded legacy disc survives block replacement without a transient sound handle',()=>{
 const saved={record:N+':custom_record',recordSound:legacySound},first=fixture();first.add(0,'minecraft:jukebox',saved);
 const restarted=fixture(first.rows);restarted.add(0,'minecraft:stone',saved);restarted.start();restarted.tick();restarted.tick();
 assert.deepEqual(restarted.drops.map(i=>i.typeId),[N+':custom_record']);assert.equal(restarted.rows.size,0);assert.equal(restarted.sounds.length,0);
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
test('doTileDrops=false still returns the stored jukebox disc when an explosion removes it',()=>{
 const f=fixture();f.world.gameRules.doTileDrops=false;const b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());b.typeId='minecraft:air';f.explode([b]);assert.equal(f.drops.length,1);assert.equal(f.drops[0].typeId,N+':custom_record');assert.equal(f.rows.size,0);assert.equal(h.stopCalls,1);f.explode([b]);assert.equal(f.drops.length,1);
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
 const f=fixture(),b=f.add(0,'minecraft:jukebox');f.start();const h=f.playRecord(b,state());h.failStop=true;b.typeId='minecraft:air';f.tick();assert.equal(f.rows.size,1);assert.equal(f.drops.length,0);h.failStop=false;f.tick();f.tick();assert.equal(f.rows.size,0);assert.equal(f.drops.length,1);assert.equal(h.stopCalls,2);
});

test('ejectRecord uses the Java world origin and three float random offsets',()=>{
 const f=fixture(),b=f.add(-2,'minecraft:jukebox');b.location.z=3;f.rows.delete(prefix+'-2_64_0');f.rows.set(prefix+'-2_64_3',JSON.stringify(state()));
 const draws=[0,.5,16777215/16777216];let index=0;f.ejectRecord(b,state(),()=>draws[index++]);
 // Independent Minecraft1.21.1 Vec3.offsetRandom float arithmetic in a JVM.
 assert.deepEqual(f.positions,[{x:-1.8499999940395355,y:65.01,z:3.849999964237213}]);
 assert.equal(index,3);assert.equal(f.drops[0].amount,1);assert.equal(f.rows.size,0);
});
test('ejectRecord keeps the saved disc and playing handle when native spawn fails',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox'),sound=f.playRecord(b,state()),before=[...f.rows];
 b.dimension.spawnItem=()=>undefined;assert.throws(()=>f.ejectRecord(b,state()),/JUKEBOX_RECORD_DROP_REJECTED/);
 assert.deepEqual([...f.rows],before);assert.equal(sound.stopCalls,0);assert.equal(f.drops.length,0);
});
test('ejectRecord removes its provisional drop if consuming the saved row fails',()=>{
 const f=fixture(),b=f.add(0,'minecraft:jukebox'),before=[...f.rows];f.world.setDynamicProperty=()=>{throw Error('save failure');};
 assert.throws(()=>f.ejectRecord(b,state()));assert.deepEqual([...f.rows],before);assert.equal(f.drops.length,0);
});

function adoptedRecord(){
 const f=fixture();f.start();const b=f.add(0,'minecraft:jukebox',{type:'minecraft:jukebox'}),item=new f.ItemStack(N+':custom_record');item.nameTag='kept original';item.lore=['native lore'];item.data={serial:42};
 const mutation=f.planRecordStorage(b,state(),{incoming:item});mutation.apply();mutation.finish();const sound=f.playRecord(b,state());return {f,b,item,sound,index:nativeItemKey(f.recordStorageKey(b))};
}
test('periodic cleanup returns the native record while preserving a replacement freezer and its native contents',()=>{
 const {f,b,item,index}=adoptedRecord();b.typeId=N+':freezer';const diamond=new f.ItemStack('minecraft:diamond');diamond.nameTag='new freezer item';
 const replacement={type:b.typeId,input:[diamond.typeId]},mutation=f.planFreezerStorage(b,replacement,{incoming:diamond});mutation.apply();mutation.finish();
 const row=f.rows.get(prefix+'0_64_0'),freezerIndex=nativeItemKey(prefix+'0_64_0'),native=f.rows.get(freezerIndex);f.tick();f.tick();
 assert.deepEqual(f.drops,[item]);assert.equal(f.rows.get(prefix+'0_64_0'),row);assert.equal(f.rows.get(freezerIndex),native);assert.equal(f.rows.get(index),undefined);
 assert.equal(f.entities.get(JSON.parse(native).entity).getComponent().container.getItem(0).nameTag,diamond.nameTag);
});
test('script reload discovers an adopted disc after replacement has overwritten the playback row',()=>{
 const {f,b,item}=adoptedRecord();b.typeId=N+':freezer';const replacement={type:b.typeId,input:['minecraft:diamond']};f.rows.set(prefix+'0_64_0',JSON.stringify(replacement));
 const restarted=fixture(f.rows,f.entities);restarted.add(0,N+':freezer',replacement);restarted.start();restarted.tick();restarted.tick();
 assert.deepEqual(restarted.drops,[item]);assert.equal(restarted.rows.get(prefix+'0_64_0'),JSON.stringify(replacement));assert.equal(restarted.sounds.length,0);
});
test('failed stop restores the same adopted carrier and metadata before successful retry',()=>{
 const {f,b,item,sound,index}=adoptedRecord(),before=new Map(f.rows),id=JSON.parse(f.rows.get(index)).entity;sound.failStop=true;
 assert.throws(()=>f.ejectRecord(b,state()),/stop failure/);assert.equal(f.drops.length,0);assert.deepEqual(f.rows,before);assert.equal(f.entities.get(id).getComponent().container.getItem(0).nameTag,item.nameTag);
 sound.failStop=false;f.ejectRecord(b,state());assert.deepEqual(f.drops,[item]);assert.equal(f.entities.has(id),false);
});
test('the saved playback ID cannot replace the adopted native disc',()=>{
 const {f,b,item}=adoptedRecord();f.rows.set(prefix+'0_64_0',JSON.stringify({...state(),record:'minecraft:music_disc_cat'}));f.ejectRecord(b,state());assert.deepEqual(f.drops,[item]);
});


function buildRecordCapabilityFixture(output,target){
 const script=new URL('../tools/fixtures/record-capability.py',import.meta.url).pathname;
 const root=new URL('../',import.meta.url).pathname;
 const args=[script,'--output',output];
 if(target)args.push('--target',target);
 const result=spawnSync('python3',args,{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
}

test('the historical 1.26.52.3 native record fixture remains pinned and unchanged by default',()=>{
 const temp=fs.mkdtempSync('/tmp/kwl-record-fixture-old-'),output=temp+'/fixture';
 try{
  buildRecordCapabilityFixture(output);
  const fixture=JSON.parse(fs.readFileSync(output+'/fixture.json','utf8'));
  const manifest=JSON.parse(fs.readFileSync(output+'/BP/manifest.json','utf8'));
  assert.equal(fixture.engine_tested,'1.26.52.3');
  assert.equal(fixture.script_api,'2.11.0-beta');
  assert.deepEqual(fixture.experiments,{gametest:true,upcoming_creator_features:true});
  assert.equal(fixture.beta_apis_experiment,undefined);
  assert.deepEqual(manifest.header.min_engine_version,[1,26,50]);
  assert.equal(manifest.dependencies.find(d=>d.module_name==='@minecraft/server').version,'2.11.0-beta');
  assert.equal(fs.readFileSync(output+'/BP/scripts/main.js','utf8'),fs.readFileSync(new URL('../tools/fixtures/record-capability-probe.js',import.meta.url),'utf8'));
  assert.equal(fs.existsSync(output+'/BP/items/custom60.json'),false);
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});

test('the current 1.26.60.6 fixture uses server 2.12 and tests the 1.26.60 record component',()=>{
 const temp=fs.mkdtempSync('/tmp/kwl-record-fixture-current-'),output=temp+'/fixture';
 try{
  buildRecordCapabilityFixture(output,'1.26.60.6');
  const fixture=JSON.parse(fs.readFileSync(output+'/fixture.json','utf8'));
  const manifest=JSON.parse(fs.readFileSync(output+'/BP/manifest.json','utf8'));
  const vanilla=JSON.parse(fs.readFileSync(output+'/BP/items/vanilla.json','utf8'));
  const custom=JSON.parse(fs.readFileSync(output+'/BP/items/custom60.json','utf8'));
  const definitions=JSON.parse(fs.readFileSync(output+'/RP/sounds/sound_definitions.json','utf8')).sound_definitions;
  assert.equal(fixture.engine_tested,'1.26.60.6');
  assert.equal(fixture.script_api,'2.12.0-beta');
  assert.equal(fixture.beta_apis_experiment,'gametest');
  assert.deepEqual(fixture.experiments,{gametest:true,upcoming_creator_features:true});
  assert.deepEqual(manifest.header.min_engine_version,[1,26,60]);
  assert.equal(manifest.dependencies.find(d=>d.module_name==='@minecraft/server').version,'2.12.0-beta');
  assert.equal(vanilla.format_version,'1.26.60');
  assert.equal(custom.format_version,'1.26.60');
  assert.equal(custom['minecraft:item'].components['minecraft:record'].sound_event,'record.record_capability_probe');
  assert.equal(fixture.probe_script,'record-capability-probe-260.js');
  const probePath=new URL('../tools/fixtures/record-capability-probe-260.js',import.meta.url).pathname;
  const syntax=spawnSync('node',['--check',probePath],{encoding:'utf8'});
  assert.equal(syntax.status,0,syntax.stderr||syntax.stdout);
  assert.equal(fs.readFileSync(output+'/BP/scripts/main.js','utf8'),fs.readFileSync(probePath,'utf8'));
  assert.ok(definitions['record.record_capability_probe']);
  assert.ok(fs.existsSync(output+'/RP/sounds/kwl/custom_music_1.ogg'));
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
