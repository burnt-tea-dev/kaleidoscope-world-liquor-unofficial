import {world,system,ItemStack} from '@minecraft/server';
const N='kaleidoscope_world_liquor',BASE=N+'.music_disc.random_disc',PREFIX=N+':storage/',active=new Map();
// Current NeoForge jukebox_song/random_disc.json. Sound handles are transient;
// the existing saved disc remains retrievable after script/world reload.
const DURATION_TICKS=2920*20;
let installed=false;
const key=b=>PREFIX+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
const load=b=>{try{return JSON.parse(world.getDynamicProperty(key(b))??'null');}catch{return undefined;}};
// Wall decorations share the storage prefix, but never own an audio channel.
const audioRecord=s=>!!s?.record&&(s.type==='minecraft:jukebox'||typeof s.recordSound==='string');
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
export function installRecordCleanup(){
 if(installed)return;installed=true;
 for(const k of world.getDynamicPropertyIds())if(k.startsWith(PREFIX)){try{const s=JSON.parse(world.getDynamicProperty(k));if(!audioRecord(s))continue;const [dim,pos]=k.slice(PREFIX.length).split('/'),[x,y,z]=pos.split('_').map(Number);active.set(k,{dimension:world.getDimension(dim),location:{x,y,z}});}catch{}}
 system.runInterval(()=>{for(const [k,row] of active){try{
  if(row.handle&&system.currentTick>=row.expires){row.handle.stop();row.handle=undefined;row.expires=undefined;}
  const b=row.dimension.getBlock(row.location);if(!b)continue;
  if(b.typeId===N+':wall_record'){row.handle?.stop();active.delete(k);continue;}
  if(b.typeId==='minecraft:jukebox'&&audioRecord(load(b)))continue;
  stopRecord(b);if(b.typeId!=='minecraft:jukebox')world.setDynamicProperty(k,undefined);
 }catch{}}},10);
 world.afterEvents.explosion.subscribe(e=>{for(const b of e.getImpactedBlocks()){const s=load(b);if(!audioRecord(s)||b.typeId===N+':wall_record')continue;stopRecord(b,s);world.setDynamicProperty(key(b),undefined);if(world.gameRules.doTileDrops)b.dimension.spawnItem(new ItemStack(s.record),b.location);}});
}
