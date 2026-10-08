/** Minecraft1.21.1 FrostedIceBlock scheduling; only tracked source-created ice.
 * Native random ticks remain native. This supplies the missing scheduled path.
 * Uses its own persisted tick clock: /time must not advance scheduled work.
 */
export const FROST='minecraft:frosted_ice';
const PREFIX='kwl:frost_ticks/',CLOCK='kwl:frost_clock',ORDER='kwl:frost_order';
const DIRECTIONS=[[0,-1,0],[0,1,0],[0,0,-1],[0,0,1],[-1,0,0],[1,0,0]];
const OUTSIDE_AIR=Object.freeze({typeId:'minecraft:air',isAir:true});
export function frostBlock(dimension,p){const h=dimension.heightRange;if(h&&(p.y<h.min||p.y>=h.max))return OUTSIDE_AIR;return dimension.getBlock(p);}
const key=(dimension,p)=>`${dimension}/${p.x},${p.y},${p.z}`;
const at=(p,d)=>({x:p.x+d[0],y:p.y+d[1],z:p.z+d[2]});
const roll=(random,n)=>Math.floor(random()*n);
export const frostDelay=(random,min,max)=>min+roll(random,max-min+1);
let installed;
export function setFrostAgingScheduler(scheduler){installed=scheduler;}
export function queueFrostedIce(dimension,p){installed?.place(dimension,p);}
export function flushFrostedIce(){installed?.flush();}

export class FrostAgingScheduler {
 constructor(world,{random=Math.random}={}){
  this.world=world;this.random=random;this.rows=new Map();this.shards=new Map();this.watched=new Map();this.dirty=new Set();
  this.clock=world.getDynamicProperty(CLOCK)??0;
  this.order=world.getDynamicProperty(ORDER)??0;
  if(!Number.isSafeInteger(this.order)||this.order<0)throw Error('Invalid frost order');
  if(!Number.isSafeInteger(this.clock)||this.clock<0)throw Error('Invalid frost clock');
  for(const name of world.getDynamicPropertyIds()){
   if(!name.startsWith(PREFIX))continue;
   const match=/^kwl:frost_ticks\/([^/]+)\/(-?\d+)\/(-?\d+)\/(-?\d+)\/([0-7])$/.exec(name);
   if(!match)throw Error('Invalid frost queue shard');
   const [dimension,cx,cy,cz,page]=[decodeURIComponent(match[1]),...match.slice(2).map(Number)];
   const data=JSON.parse(world.getDynamicProperty(name));
   if(data.schema!==1||!Array.isArray(data.rows)||data.rows.length>512)throw Error('Invalid frost queue');
   for(const [index,due,paused,order]of data.rows){
    if(!Number.isSafeInteger(order)||order<0||order>=this.order||!Number.isInteger(index)||index<page*512||index>=(page+1)*512||!(due===null||Number.isSafeInteger(due)&&due>=0)||!(paused===null||Number.isInteger(paused)&&paused>=0)||((due===null)===(paused===null)))throw Error('Invalid frost tick row');
    const p={x:cx*16+(index&15),y:cy*16+((index>>8)&15),z:cz*16+((index>>4)&15)};
    const id=key(dimension,p);if(this.rows.has(id))throw Error('Duplicate frost tick');
    this.remember({dimension,p,due,paused,order});
   }
  }
 }
 shard(row){const {x,y,z}=row.p,index=(x&15)|((z&15)<<4)|((y&15)<<8);return {name:PREFIX+encodeURIComponent(row.dimension)+'/'+Math.floor(x/16)+'/'+Math.floor(y/16)+'/'+Math.floor(z/16)+'/'+Math.floor(index/512),index};}
 remember(row){const id=key(row.dimension,row.p),name=this.shard(row).name;this.rows.set(id,row);if(!this.shards.has(name))this.shards.set(name,new Map());this.shards.get(name).set(id,row);}
 mark(row){this.dirty.add(this.shard(row).name);}
 block(row){return frostBlock(this.world.getDimension(row.dimension),row.p);}
 schedule(dimension,p,delay){
  const id=key(dimension,p);if(this.rows.has(id))return false;
  const row={dimension,p:{...p},due:this.clock+delay,paused:null,order:this.order++};this.remember(row);this.watched.delete(id);this.mark(row);return true;
 }
 place(dimension,p){
  // Java onPlace queues first, then the author's explicit60 request deduplicates.
  this.schedule(dimension.id,p,frostDelay(this.random,60,120));
  try{this.neighbors({dimension:dimension.id,p});}catch{/* Unavailable boundaries do not suppress reachable ice. */}
 }
 forget(row){const id=key(row.dimension,row.p),name=this.shard(row).name;this.rows.delete(id);this.shards.get(name)?.delete(id);this.mark(row);}
 neighbors(row){
  const dimension=this.world.getDimension(row.dimension),found=[];
  for(const d of DIRECTIONS){const p=at(row.p,d),b=frostBlock(dimension,p);if(!b)throw Error('Frost neighbor unavailable');if(b.typeId===FROST){found.push({dimension:row.dimension,p,block:b});const id=key(row.dimension,p);if(!this.rows.has(id))this.watched.set(id,{dimension:row.dimension,p});}}
  return found;
 }
 melt(row,block){
  block.setType(row.dimension==='minecraft:nether'?'minecraft:air':'minecraft:water');
  this.forget(row);this.watched.delete(key(row.dimension,row.p));
  // Java setBlockAndUpdate notifies neighbors with the OLD frosted-ice type.
  this.notify(row);
 }
 slightlyMelt(row,block){
  const age=block.permutation.getState('age');if(!Number.isInteger(age)||age<0||age>3)throw Error('Invalid native frost age');
  if(age<3){block.setPermutation(block.permutation.withState('age',age+1));return false;}
  this.melt(row,block);return true;
 }
 notify(row){
  for(const d of DIRECTIONS){
   const next={dimension:row.dimension,p:at(row.p,d)};
   try{const b=this.block(next);if(b?.typeId===FROST&&this.neighbors(next).length<2)this.melt(next,b);}catch{/* Recheck missing chunks when their queued work resumes. */}
  }
 }
 removed(dimension,p){const id=key(dimension.id,p),row=this.rows.get(id)??this.watched.get(id);if(!row)return;this.forget(row);this.watched.delete(id);this.notify(row);this.flush();}
 scheduled(row,block){
  const draw=roll(this.random,3),age=block.permutation.getState('age');
  const shouldAge=(draw===0||this.neighbors(row).length<4)&&block.getLightLevel()>11-age-1;
  // Refuse a partial central melt when one of its six follow-up positions is unavailable.
  if(shouldAge&&age===3)this.neighbors(row);
  if(shouldAge&&this.slightlyMelt(row,block)){
   // Snapshot iteration order is DOWN, UP, NORTH, SOUTH, WEST, EAST.
   for(const d of DIRECTIONS){const next={dimension:row.dimension,p:at(row.p,d)},b=this.block(next);if(b?.typeId===FROST&&!this.slightlyMelt(next,b))this.schedule(next.dimension,next.p,frostDelay(this.random,20,40));}
   return;
  }
  this.schedule(row.dimension,row.p,frostDelay(this.random,20,40));
 }
 tick(){
  if(!this.rows.size&&!this.watched.size)return;
  this.clock++;this.world.setDynamicProperty(CLOCK,this.clock);
  // Take a fixed frame snapshot; newly placed/notified work runs next frame.
  for(const row of [...this.rows.values()].sort((a,b)=>(a.due??Infinity)-(b.due??Infinity)||a.order-b.order)){
   if(this.rows.get(key(row.dimension,row.p))!==row)continue;
   let block;
   try{block=this.block(row);if(!block)throw Error('Unloaded');}
   catch{if(row.due!==null){row.paused=Math.max(0,row.due-this.clock+1);row.due=null;this.mark(row);}continue;}
   if(block.typeId!==FROST){this.forget(row);this.notify(row);continue;}
   if(row.due===null){row.due=this.clock+row.paused;row.paused=null;this.mark(row);}
   if(row.due>this.clock)continue;
   // Consume before invoking tick, as LevelChunkTicks removes the due entry.
   this.forget(row);
   try{this.scheduled(row,block);}catch(error){this.remember(row);this.mark(row);if(error.name==='LocationInUnloadedChunkError'||error.message==='Frost neighbor unavailable')continue;throw error;}
  }
  for(const [id,row]of [...this.watched]){
   if(!DIRECTIONS.some(d=>this.rows.has(key(row.dimension,at(row.p,d))))){this.watched.delete(id);continue;}
   try{if(this.block(row)?.typeId!==FROST){this.watched.delete(id);this.notify(row);}}catch{}
  }
  this.flush();
 }
 flush(){
  if(this.dirty.size)this.world.setDynamicProperty(ORDER,this.order);
  for(const name of this.dirty){
   const rows=[];
   for(const row of this.shards.get(name)?.values()??[])rows.push([this.shard(row).index,row.due,row.paused,row.order]);
   rows.sort((a,b)=>a[0]-b[0]);
   this.world.setDynamicProperty(name,rows.length?JSON.stringify({schema:1,rows}):undefined);
   if(!rows.length)this.shards.delete(name);
  }
  this.dirty.clear();
 }
}
