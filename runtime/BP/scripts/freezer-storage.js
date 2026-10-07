import {world,system,ItemStack} from '@minecraft/server';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER,nativeItemKey} from './freezer-native-storage.js';
export const freezerStorageKey=b=>`kaleidoscope_world_liquor:storage/${b.dimension.id.split(':')[1]}/${b.location.x}_${b.location.y}_${b.location.z}`;
const check=(ok,code)=>{if(!ok)throw Error(code);};
let serial=0;
export const freezerNativeItems=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(d,p)=>d.spawnEntity(NATIVE_ITEM_ENTITY,p),makeStack:(id,n)=>new ItemStack(id,n),token:()=>`${Date.now()}_${++serial}`});
const input=(state)=>state?.input??[];
export function readFreezerItems(block,state){return freezerNativeItems.read({key:freezerStorageKey(block),dimension:block.dimension,position:block.location,ids:input(state)}).items;}
/** The machine row and native carrier are one recoverable owned mutation.
 * No ItemStack metadata is serialized; legacy ID rows are adopted on mutation.
 */
export function planFreezerStorage(block,next,{incoming}={}){
 const key=freezerStorageKey(block),raw=world.getDynamicProperty(key),old=JSON.parse(raw??'null');
 const native=freezerNativeItems.plan({key,dimension:block.dimension,position:block.location,oldIds:input(old),nextIds:input(next),incoming});let applied=false;
 return {
  before:native.before,removed:native.removed,
  apply(){check(!applied,'FREEZER_MUTATION_REUSED');check(world.getDynamicProperty(key)===raw,'FREEZER_STATE_CONFLICT');applied=true;native.apply();world.setDynamicProperty(key,next?JSON.stringify(next):undefined);},
  rollback(){if(!applied)return;const failures=[];try{native.rollback();}catch(e){failures.push(e);}try{world.setDynamicProperty(key,raw);}catch(e){failures.push(e);}if(failures.length)throw new AggregateError(failures,'FREEZER_STORAGE_RECOVERY_FAILED');applied=false;},
  finish(){native.finish();}
 };
}
/** Pin only the exact owned persistent carrier. Never recreate missing items. */
export function installFreezerStoragePinning(){
 const carriers=new Map(),queued=new Set();let iterator;
 const remember=e=>{if(e?.isValid&&e.typeId===NATIVE_ITEM_ENTITY)carriers.set(e.id,e);};
 const recover=e=>{
  check(e?.isValid&&e.typeId===NATIVE_ITEM_ENTITY,'FREEZER_STORAGE_UNAVAILABLE');
  const key=e.getDynamicProperty(NATIVE_STORAGE_OWNER),m=/^kaleidoscope_world_liquor:storage\/(overworld|nether|the_end)\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(key??'');check(m,'FREEZER_STORAGE_ANCHOR');
  const d=world.getDimension(m[1]),position={x:Number(m[2]),y:Number(m[3]),z:Number(m[4])},b=d.getBlock(position);check(b?.typeId==='kaleidoscope_world_liquor:freezer','FREEZER_STORAGE_OWNER_BLOCK');
  const raw=world.getDynamicProperty(key),state=JSON.parse(raw??'null');check(state?.input?.length>0,'FREEZER_STORAGE_STATE');
  const proof=freezerNativeItems.inspectForReanchor({key,dimension:d,position,entity:e});check(proof.ids.every((id,i)=>id===(state.input[i]??null)),'FREEZER_STORAGE_CONTENT_MISMATCH');
  const center={x:position.x+.5,y:position.y+.5,z:position.z+.5};if(['x','y','z'].every(k=>Math.abs(e.location[k]-center[k])<.1))return;
  check(e.tryTeleport(center,{dimension:d,checkForBlocks:false,keepVelocity:false})===true,'FREEZER_STORAGE_TELEPORT_REJECTED');
  check(world.getDynamicProperty(key)===raw,'FREEZER_STORAGE_STATE_CONFLICT');const after=freezerNativeItems.readAdopted({key,dimension:d,position});check(after?.entity.id===e.id&&after.raw===proof.raw,'FREEZER_STORAGE_CONFLICT');
 };
 const attempt=e=>{try{recover(e);}catch(error){console.warn('[World Liquor freezer storage] '+error);}};
 freezerNativeItems.requestReanchor=key=>{
  if(queued.has(key)||queued.size>=128)return;queued.add(key);system.run(()=>{queued.delete(key);try{const row=JSON.parse(world.getDynamicProperty(nativeItemKey(key))??'null');const e=row&&world.getEntity(row.entity);remember(e);recover(e);}catch(error){console.warn('[World Liquor freezer storage] '+error);}});
 };
 world.afterEvents.entityLoad.subscribe(({entity})=>{remember(entity);if(entity?.typeId===NATIVE_ITEM_ENTITY)system.run(()=>attempt(entity));});
 world.afterEvents.entitySpawn.subscribe(({entity})=>remember(entity));
 world.afterEvents.entityRemove?.subscribe(e=>carriers.delete(e.removedEntityId));
 for(const name of ['overworld','nether','the_end'])for(const e of world.getDimension(name).getEntities({type:NATIVE_ITEM_ENTITY}))remember(e);
 system.runInterval(()=>{
  iterator??=carriers.entries();for(let n=0;n<Math.min(32,carriers.size);n++){
   let row=iterator.next();if(row.done){iterator=carriers.entries();row=iterator.next();}if(row.done)break;
   const [id,e]=row.value;if(!e.isValid){carriers.delete(id);continue;}
   const m=/\/(-?\d+)_(-?\d+)_(-?\d+)$/.exec(e.getDynamicProperty(NATIVE_STORAGE_OWNER)??'');
   if(!m||['x','y','z'].some((k,i)=>Math.abs(e.location[k]-Number(m[i+1])-.5)>=.1))attempt(e);
  }
 },20);
}
