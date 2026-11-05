import {world} from '@minecraft/server';
import {freezerStorageKey,freezerNativeItems} from './freezer-storage.js';
import {RECORD_ITEM_PREFIX,nativeItemKey,nativeItemRequiredKey} from './freezer-native-storage.js';
export const recordStorageKey=b=>RECORD_ITEM_PREFIX+b.dimension.id.split(':')[1]+'/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
export const savedRecord=s=>typeof s?.record==='string'&&(s.type===undefined||s.type==='minecraft:jukebox'||typeof s.recordSound==='string');
export function hasNativeRecord(b){const k=recordStorageKey(b);return world.getDynamicProperty(nativeItemKey(k))!==undefined||world.getDynamicProperty(nativeItemRequiredKey(k))!==undefined;}
export const hasStoredRecord=(b,s)=>hasNativeRecord(b)||savedRecord(s);
const check=(ok,code)=>{if(!ok)throw Error(code);};
/** The native stack is the sole item owner. The machine row contains only an
 * index for playback; legacy plain IDs are read by NativeItemStorage once at
 * this boundary, never as recovery for an adopted missing/corrupt container.
 */
export function planRecordStorage(b,next,{incoming}={}){
 const rowKey=freezerStorageKey(b),raw=world.getDynamicProperty(rowKey),old=JSON.parse(raw??'null'),key=recordStorageKey(b);
 const nativeRaw=world.getDynamicProperty(nativeItemKey(key));
 const ownRow=savedRecord(old)&&(b.typeId!=='kaleidoscope_world_liquor:wall_record'||old.type==='minecraft:jukebox');
 const oldIds=nativeRaw===undefined?(ownRow?[old.record]:[]):JSON.parse(nativeRaw).ids;
 check(Array.isArray(oldIds)&&oldIds.length<=4&&!oldIds.slice(1).some(Boolean),'RECORD_STORAGE_CONTENT_MISMATCH');
 if(next){check(!oldIds.some(Boolean),'RECORD_STORAGE_OCCUPIED');check(!old||old.type===undefined||old.type==='minecraft:jukebox','RECORD_STORAGE_FOREIGN_ROW');}
 const native=freezerNativeItems.plan({key,dimension:b.dimension,position:b.location,oldIds,nextIds:next?[next.record]:[],incoming});
 const writeRow=!!next||ownRow;let applied=false;
 return {
  item:native.before[0],
  apply(){check(!applied,'RECORD_MUTATION_REUSED');check(world.getDynamicProperty(rowKey)===raw,'RECORD_STATE_CONFLICT');applied=true;native.apply();if(writeRow)world.setDynamicProperty(rowKey,next?JSON.stringify(next):undefined);},
  rollback(){
   if(!applied)return;const failures=[];
   try{native.rollback();}catch(error){failures.push(error);}
   if(writeRow&&world.getDynamicProperty(rowKey)!==raw)try{world.setDynamicProperty(rowKey,raw);}catch(error){failures.push(error);}
   if(failures.length)throw new AggregateError(failures,'RECORD_STORAGE_RECOVERY_FAILED');applied=false;
  },
  finish(){native.finish();}
 };
}
