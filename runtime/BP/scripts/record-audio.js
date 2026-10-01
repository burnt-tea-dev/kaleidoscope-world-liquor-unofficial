import {world,system,ItemStack} from '@minecraft/server';
const N='kaleidoscope_world_liquor',BASE=N+'.music_disc.random_disc',PREFIX=N+':storage/',active=new Map();
const key=b=>PREFIX+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
const load=b=>{try{return JSON.parse(world.getDynamicProperty(key(b))??'null');}catch{return undefined;}};
// Wall decorations share the storage prefix, but never own an audio channel.
const audioRecord=s=>!!s?.record&&(s.type==='minecraft:jukebox'||typeof s.recordSound==='string');
export function reserveRecordSound(){
 const used=new Set();for(const k of world.getDynamicPropertyIds())if(k.startsWith(PREFIX)){try{const s=JSON.parse(world.getDynamicProperty(k));if(s?.recordSound)used.add(s.recordSound);}catch{}}
 for(let i=0;i<32;i++){const sound=BASE+'.station_'+i;if(!used.has(sound))return sound;}
 throw Error('All 32 custom record audio channels are occupied');
}
export function playRecord(b,s){const sound=s.recordSound??BASE;b.dimension.playSound(sound,{x:b.location.x+.5,y:b.location.y+.5,z:b.location.z+.5},{volume:4,pitch:1});active.set(key(b),{dimension:b.dimension,location:{...b.location},sound});}
export function stopRecord(b,s){const sound=s?.recordSound??BASE;if(sound!==BASE&&!sound.startsWith(BASE+'.station_'))return;b.dimension.runCommand('stopsound @a '+sound);active.delete(key(b));}
export function installRecordCleanup(){
 for(const k of world.getDynamicPropertyIds())if(k.startsWith(PREFIX)){try{const s=JSON.parse(world.getDynamicProperty(k));if(!audioRecord(s))continue;const [dim,pos]=k.slice(PREFIX.length).split('/'),[x,y,z]=pos.split('_').map(Number);active.set(k,{dimension:world.getDimension(dim),location:{x,y,z},sound:s.recordSound??BASE});}catch{}}
 system.runInterval(()=>{for(const [k,row] of active){try{const b=row.dimension.getBlock(row.location);if(!b)continue;if(b.typeId==='minecraft:jukebox')continue;if(b.typeId===N+':wall_record'){active.delete(k);continue;}stopRecord(b,{recordSound:row.sound});world.setDynamicProperty(k,undefined);}catch{}}},10);
 world.afterEvents.explosion.subscribe(e=>{for(const b of e.getImpactedBlocks()){const s=load(b);if(!audioRecord(s)||b.typeId===N+':wall_record')continue;stopRecord(b,s);world.setDynamicProperty(key(b),undefined);if(world.gameRules.doTileDrops)b.dimension.spawnItem(new ItemStack(s.record),b.location);}});
}
