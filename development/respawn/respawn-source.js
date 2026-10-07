/** Minecraft 1.21.1 ServerPlayer/BedBlock/RespawnAnchorBlock numeric and
 * selection rules. This module does not invent collision shapes, spawn angle,
 * forced status or chunk availability. Unknown adapter decisions must throw.
 */
const directions={north:{x:0,z:-1},east:{x:1,z:0},south:{x:0,z:1},west:{x:-1,z:0}};
const f32=Math.fround;
const numericBits=new DataView(new ArrayBuffer(8));
const asinTable=Array.from({length:257},(_,i)=>Math.asin(i/256));
const cosineTable=asinTable.map(Math.cos);
const fractionalBias=2**44;
let sineTable;
function finite(value,name){if(!Number.isFinite(value))throw new TypeError(name+' must be known and finite');return value;}
function decision(value,name){if(typeof value!=='boolean')throw new TypeError(name+' must be a known boolean');return value;}
function int32(value,name){if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw new TypeError(name+' must be a Java int');return value;}
function blockPosition(value){for(const axis of ['x','y','z'])int32(value?.[axis],'block '+axis);return value;}
function vector(value){for(const axis of ['x','y','z'])finite(value?.[axis],'position '+axis);return value;}
function direction(name){const result=directions[name];if(!result)throw new TypeError('A known horizontal bed facing is required');return result;}
function sin(angle,cosine=false){
 if(!sineTable){sineTable=new Float32Array(65536);for(let i=0;i<sineTable.length;i++)sineTable[i]=Math.sin(i*Math.PI*2/65536);}
 const index=f32(f32(angle*f32(10430.378))+(cosine?16384:0));
 // Java float-to-int conversion saturates rather than wrapping first.
 const integer=Math.max(-2147483648,Math.min(2147483647,Math.trunc(index)));
 return sineTable[integer&65535];
}
function fastInverseSqrt(value){
 numericBits.setFloat64(0,value);
 const bits=(BigInt(numericBits.getUint32(0))<<32n)|BigInt(numericBits.getUint32(4));
 const approximation=6910469410427058090n-(bits>>1n);
 numericBits.setUint32(0,Number((approximation>>32n)&0xffffffffn));
 numericBits.setUint32(4,Number(approximation&0xffffffffn));
 const estimate=numericBits.getFloat64(0);
 return estimate*(1.5-.5*value*estimate*estimate);
}
function sourceAtan2(y,x){
 const squared=x*x+y*y;if(Number.isNaN(squared))return NaN;
 const negativeY=y<0,negativeX=x<0;if(negativeY)y=-y;if(negativeX)x=-x;
 const swapped=y>x;if(swapped)[x,y]=[y,x];
 const inverse=fastInverseSqrt(squared);x*=inverse;y*=inverse;
 const snapped=fractionalBias+y;numericBits.setFloat64(0,snapped);
 const index=numericBits.getUint32(4),residual=y*cosineTable[index]-x*(snapped-fractionalBias);
 let angle=asinTable[index]+(6+residual*residual)*residual*.16666666666666666;
 if(swapped)angle=Math.PI/2-angle;if(negativeX)angle=Math.PI-angle;if(negativeY)angle=-angle;
 return angle;
}

/** The source side preference depends on the saved respawn yaw, not current yaw. */
export function bedStandUpOffsets(facing,respawnAngle){
 const forward=direction(facing),clockwise={x:-forward.z,z:forward.x};
 const radians=f32(f32(finite(respawnAngle,'respawnAngle'))*f32(.017453292));
 const dot=f32(f32(clockwise.x*-sin(radians))+f32(clockwise.z*sin(radians,true)));
 const side=dot>0?{x:-clockwise.x,z:-clockwise.z}:clockwise;
 const row=(s,f)=>({x:(side.x*s+forward.x*f)|0,z:(side.z*s+forward.z*f)|0});
 return [row(1,0),row(1,-1),row(1,-2),row(0,-2),row(-1,-2),row(-1,-1),row(-1,0),row(-1,1),row(0,1),row(1,1),row(0,0),row(0,-1)];
}
export function bedStandUpStages(facing,respawnAngle,bunkBed=false){
 decision(bunkBed,'bunkBed');const offsets=bedStandUpOffsets(facing,respawnAngle),surround=offsets.slice(0,10),above=offsets.slice(10);
 const stages=[];
 for(const checkDanger of [true,false]){
  if(bunkBed)stages.push({checkDanger,dy:0,offsets:surround},{checkDanger,dy:-1,offsets:surround},{checkDanger,dy:0,offsets:above});
  else stages.push({checkDanger,dy:0,offsets});
 }
 return stages;
}
export function anchorStandUpStages(){
 const horizontal=[{x:0,z:-1},{x:-1,z:0},{x:0,z:1},{x:1,z:0},{x:-1,z:-1},{x:1,z:-1},{x:-1,z:1},{x:1,z:1}];
 const offsets=[...horizontal.map(p=>({...p,y:0})),...horizontal.map(p=>({...p,y:-1})),...horizontal.map(p=>({...p,y:1})),{x:0,y:1,z:0}];
 return [true,false].map(checkDanger=>({checkDanger,dy:0,offsets}));
}
/** findSafe receives (candidate block position, source strict-danger flag).
 * Return null for a proven rejected position; throw when its state is unknown.
 */
export function selectStandUpPosition(origin,stages,findSafe){
 blockPosition(origin);
 for(const stage of stages)for(const offset of stage.offsets){
  const at={x:origin.x+offset.x,y:origin.y+stage.dy+(offset.y??0),z:origin.z+offset.z};
  const result=findSafe(at,stage.checkDanger);
  if(result===undefined)throw new TypeError('Unknown stand-up destination');
  if(result!==null)return result;
 }
 return null;
}

/** null means a known empty collision shape; undefined means unknown.
 * The lower shape is read lazily only when the current shape is empty.
 */
export function respawnFloorHeight(currentMaximumY,getBelowMaximumY){
 if(currentMaximumY!==null)return finite(currentMaximumY,'current collision maximum Y');
 const below=typeof getBelowMaximumY==='function'?getBelowMaximumY():getBelowMaximumY;
 if(below===null)return -Infinity;
 finite(below,'lower collision maximum Y');return below>=1?below-1:-Infinity;
}
/** Predicate callbacks supply actual shapes/tags/world-border facts; these
 * callbacks are deliberately evaluated in DismountHelper source order.
 */
export function findSafeDismount(block,checkDanger,{isDangerous,floorHeight,collides,invalidSpawnInside,insideBorder}){
 blockPosition(block);decision(checkDanger,'checkDanger');
 if(checkDanger&&decision(isDangerous(block),'cell danger'))return null;
 const floor=floorHeight(block);
 if(typeof floor!=='number'||Number.isNaN(floor))throw new TypeError('Unknown floor height');
 if(!Number.isFinite(floor)||floor>=1)return null;
 if(checkDanger&&floor<=0&&decision(isDangerous({...block,y:block.y-1}),'lower danger'))return null;
 const position={x:block.x+.5,y:block.y+floor,z:block.z+.5};
 if(decision(collides(position),'standing block collision'))return null;
 if(decision(invalidSpawnInside(block),'cell INVALID_SPAWN_INSIDE')||decision(invalidSpawnInside({...block,y:block.y+1}),'upper INVALID_SPAWN_INSIDE'))return null;
 return decision(insideBorder(position),'standing AABB inside world border')?position:null;
}
export function forcedRespawnPosition(block,respawnAngle,canRespawnAt){
 blockPosition(block);finite(respawnAngle,'respawnAngle');
 if(!decision(canRespawnAt(block),'forced lower block')||!decision(canRespawnAt({...block,y:block.y+1}),'forced upper block'))return null;
 return {position:{x:block.x+.5,y:block.y+.1,z:block.z+.5},yaw:f32(respawnAngle),pitch:0};
}
/** RespawnPosAngle.calculateLookAtYaw uses the original bottom centre, the
 * source inverse-square-root/atan approximation and float degree constant.
 */
export function respawnLookAtYaw(position,spawnBlock){
 vector(position);blockPosition(spawnBlock);
 let x=spawnBlock.x+.5-position.x,y=spawnBlock.y-position.y,z=spawnBlock.z+.5-position.z;
 const length=Math.sqrt(x*x+y*y+z*z);
 if(length<1e-4)x=y=z=0;else{x/=length;y/=length;z/=length;}
 let angle=sourceAtan2(z,x)*57.2957763671875-90;
 angle%=360;if(angle>=180)angle-=360;if(angle< -180)angle+=360;
 return f32(angle);
}

/** Preserve the source integer arithmetic and fixed traversal step, including
 * radius 0 and its world-border override. This is not a new safety radius.
 */
export function sharedSpawnSearchPlan(spawnRadius,borderDistance){
 let radius=Math.max(0,int32(spawnRadius,'spawnRadius'));
 finite(borderDistance,'world-border distance');
 const border=Math.max(-2147483648,Math.min(2147483647,Math.floor(borderDistance)));
 if(border<radius)radius=border;if(border<=1)radius=1;
 const width=(Math.imul(radius,2)+1)|0,square=BigInt(width)*BigInt(width);
 const count=Number(square>2147483647n?2147483647n:square),step=count<=16?count-1:17;
 return {radius,width,count,step};
}
export function* sharedSpawnColumns(spawn,plan,nextInt){
 const start=nextInt(plan.count);
 if(!Number.isInteger(start)||start<0||start>=plan.count)throw new TypeError('nextInt must return a source-range integer');
 for(let i=0;i<plan.count;i++){
  const index=((start+Math.imul(plan.step,i))|0)%plan.count;
  yield {x:(((spawn.x+index%plan.width)|0)-plan.radius)|0,z:(((spawn.z+Math.trunc(index/plan.width))|0)-plan.radius)|0};
 }
}
/** findColumn returns the source getOverworldRespawnPos BlockPos or null.
 * canStand checks the standing AABB at a block's bottom centre, including
 * native block/entity collision and world border, not two air blocks.
 */
export function findSharedSpawn({spawn,hasSkyLight,adventure,spawnRadius,borderDistance,nextInt,findColumn,canStand,minY,maxY}){
 blockPosition(spawn);int32(minY,'minimum build Y');int32(maxY,'maximum build Y');
 if(minY>=maxY)throw new TypeError('Known increasing build height range is required');
 let at={...spawn};
 if(decision(hasSkyLight,'dimension skylight')&&!decision(adventure,'server default Adventure mode')){
  for(const column of sharedSpawnColumns(spawn,sharedSpawnSearchPlan(spawnRadius,borderDistance),nextInt)){
   const found=findColumn(column);
   if(found===undefined)throw new TypeError('Unknown spawn column');
   if(found!==null&&decision(canStand(blockPosition(found)),'column standing AABB'))return {...found};
  }
 }
 while(!decision(canStand(at),'fallback standing AABB')&&at.y<maxY-1)at={...at,y:at.y+1};
 while(decision(canStand({...at,y:at.y-1}),'fallback lower standing AABB')&&at.y>minY+1)at={...at,y:at.y-1};
 return at;
}
