import {world,system} from '@minecraft/server';
import {javaFloatRoll} from './combat-source.js';
import {planRecordStorage,hasNativeRecord,savedRecord} from './record-storage.js';
import {RECORD_ITEM_PREFIX,nativeItemKey,nativeStorageAnchor} from './freezer-native-storage.js';
const N='kaleidoscope_world_liquor',BASE=N+'.music_disc.random_disc',PREFIX=N+':storage/',active=new Map();
// Current NeoForge jukebox_song/random_disc.json. Sound handles are transient;
// the existing saved disc remains retrievable after script/world reload.
const DURATION_TICKS=2920*20;
let installed=false;
const key=b=>PREFIX+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
const load=b=>{try{return JSON.parse(world.getDynamicProperty(key(b))??'null');}catch{return undefined;}};
// Wall decorations share the storage prefix, but never own an audio channel.
const audioRecord=savedRecord;
export function playRecord(b,s){
 const k=key(b),previous=active.get(k);
 const handle=b.dimension.playSound(BASE,{x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5},{volume:4,pitch:1,isBroadcast:true});
 // Each playback owns its engine instance, even when another jukebox selects
 // the same track. There is no alias allocation or player-wide stop command.
 try{previous?.handle?.stop();}catch(error){handle.stop();throw error;}
 active.set(k,{dimension:b.dimension,location:{...b.location},handle,expires:system.currentTick+DURATION_TICKS});
 return handle;
}
export function stopRecord(b,s){active.get(key(b))?.handle?.stop();active.delete(key(b));}
/** JukeboxBlockEntity.popOutTheItem: world item, never Inventory.add.
 * Keep the saved disc recoverable if native spawning or the final write fails.
 */
export function ejectRecord(b,s,random=Math.random){
 const mutation=planRecordStorage(b,undefined);
 if(!mutation.item)throw Error('JUKEBOX_RECORD_EMPTY');
 const offset=()=>Math.fround(Math.fround(javaFloatRoll(random())-.5)*Math.fround(.7));
 const drop=b.dimension.spawnItem(mutation.item,{x:b.location.x+.5+offset(),y:b.location.y+1.01+offset(),z:b.location.z+.5+offset()});
 if(!drop)throw Error('JUKEBOX_RECORD_DROP_REJECTED');
 try{mutation.apply();stopRecord(b,s);mutation.finish();}
 catch(error){try{drop.remove();}catch{}try{mutation.rollback();}catch(recovery){throw new AggregateError([error,recovery],'RECORD_EJECTION_RECOVERY_FAILED');}throw error;}
 return drop;
}
export function installRecordCleanup(){
 if(installed)return;installed=true;
 // Native contents also survive another block owner replacing the machine row.
 for(const k of world.getDynamicPropertyIds())try{
  if(k.startsWith(PREFIX)){const s=JSON.parse(world.getDynamicProperty(k));if(!audioRecord(s))continue;const [dim,pos]=k.slice(PREFIX.length).split('/'),[x,y,z]=pos.split('_').map(Number);active.set(k,{dimension:world.getDimension(dim),location:{x,y,z}});}
  else if(k.startsWith(nativeItemKey(RECORD_ITEM_PREFIX))){const anchor=nativeStorageAnchor(k.slice(nativeItemKey('').length));if(!anchor)continue;const b={dimension:world.getDimension(anchor.dimension),location:anchor.position};if(!active.has(key(b)))active.set(key(b),{dimension:b.dimension,location:b.location});}
 }catch{}
 system.runInterval(()=>{for(const [k,row] of active){try{
  if(row.handle&&system.currentTick>=row.expires){row.handle.stop();row.handle=undefined;row.expires=undefined;}
  const b=row.dimension.getBlock(row.location);if(!b)continue;
  const native=hasNativeRecord(b),s=load(b);
  if(b.typeId===N+':wall_record'&&!native){stopRecord(b);continue;}
  if(b.typeId==='minecraft:jukebox'&&(native||audioRecord(s)))continue;
  // Commands and other scripts can replace a block without our break events.
  // Return only an owned disc; a replacement's saved furniture is not ours.
  if(native||b.typeId!=='minecraft:jukebox'&&audioRecord(s))ejectRecord(b,s);
  else stopRecord(b);
 }catch{}}},10);
 // Java JukeboxBlockEntity.popOutTheItem returns container contents independently
 // of Creative mode and doTileDrops; block-item loot has its own rules.
 world.afterEvents.explosion.subscribe(e=>{for(const b of e.getImpactedBlocks()){const s=load(b);if(!hasNativeRecord(b)&&(!audioRecord(s)||b.typeId===N+':wall_record'))continue;ejectRecord(b,s);}});
}
