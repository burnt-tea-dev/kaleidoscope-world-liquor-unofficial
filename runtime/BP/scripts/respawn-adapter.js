/** Minecraft 1.21.1 ServerPlayer/BedBlock/RespawnAnchorBlock numeric and
 * selection rules. This module does not invent collision shapes, spawn angle,
 * forced status or chunk availability. Unknown adapter decisions must throw.
 */
import {UnknownRespawnFact,javaBlockView,sourceBoxesIntersect,sourceFullUpperFace} from './respawn-blocks.js';
import {getRespawnMetadata,declareRespawnMetadata,installRespawnMetadata} from './respawn-metadata.js';
import {isNonCollidableHelper} from './respawn-helper-entities.js';
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

/** The port owns this Java logical context. These are WorldBorder's constructor
 * and GameType.DEFAULT_MODE values, not a reading of a Native global border or
 * default game mode. An explicitly registered ported addon may replace them.
 */
export const JAVA_RESPAWN_DEFAULT_CONTEXT=Object.freeze({schema:1,border:Object.freeze({centerX:0,centerZ:0,size:59999968,absoluteMax:29999984}),adventure:false});
const contextKey='kaleidoscope_world_liquor:java_respawn_context';
let contextProvider;
export function setJavaRespawnContextProvider(provider){if(provider!==undefined&&typeof provider!=='function')throw new TypeError('Respawn context provider must be a function');contextProvider=provider;}
function validatedProfile(profile){
 if(!profile||profile.schema!==1||typeof profile.adventure!=='boolean')throw new UnknownRespawnFact('declared source respawn profile');
 const b=profile.border;
 if(!b||!['centerX','centerZ','size','absoluteMax'].every(key=>Number.isFinite(b[key]))||b.size<0||b.size>59999968||!Number.isInteger(b.absoluteMax)||b.absoluteMax<1||b.absoluteMax>29999984)throw new UnknownRespawnFact('declared source world border');
 return {schema:1,adventure:profile.adventure,border:{centerX:b.centerX,centerZ:b.centerZ,size:b.size,absoluteMax:b.absoluteMax}};
}
export function declareJavaRespawnContext(world,profile){const next=validatedProfile(profile);world.setDynamicProperty(contextKey,JSON.stringify(next));return next;}
function ownedProfile(world){
 const stored=world.getDynamicProperty?.(contextKey);
 if(stored===undefined)return JAVA_RESPAWN_DEFAULT_CONTEXT;
 if(typeof stored!=='string')throw new UnknownRespawnFact('stored source respawn profile');
 try{return validatedProfile(JSON.parse(stored));}catch(error){if(error instanceof UnknownRespawnFact)throw error;throw new UnknownRespawnFact('stored source respawn profile');}
}
export function sourceBorderBounds(border){
 const b=validatedProfile({schema:1,border,adventure:false}).border,half=b.size/2;
 const clamp=value=>Math.max(-b.absoluteMax,Math.min(b.absoluteMax,value));
 return {minX:clamp(b.centerX-half),minZ:clamp(b.centerZ-half),maxX:clamp(b.centerX+half),maxZ:clamp(b.centerZ+half)};
}
function bodyBounds(position,width=Math.fround(.6),height=Math.fround(1.8)){const half=width/2;return {minX:position.x-half,minY:position.y,minZ:position.z-half,maxX:position.x+half,maxY:position.y+height,maxZ:position.z+half};}
export function sourceBorderContains(border,bounds){
 const b=sourceBorderBounds(border),epsilon=9.999999747378752e-6;
 return bounds.minX>=b.minX&&bounds.minX<b.maxX&&bounds.minZ>=b.minZ&&bounds.minZ<b.maxZ&&bounds.maxX-epsilon>=b.minX&&bounds.maxX-epsilon<b.maxX&&bounds.maxZ-epsilon>=b.minZ&&bounds.maxZ-epsilon<b.maxZ;
}
function sourceBorderDistance(border,at){const b=sourceBorderBounds(border);return Math.min(at.x-b.minX,b.maxX-at.x,at.z-b.minZ,b.maxZ-at.z);}
/** CollisionGetter.borderCollision differs from Dismount's inside-AABB test:
 * only nearby entities query the outward-rounded exterior collision shape.
 */
export function sourceBorderCollision(border,position,bounds){
 const b=sourceBorderBounds(border),margin=Math.max(Math.abs(bounds.maxX-bounds.minX),Math.abs(bounds.maxZ-bounds.minZ),1);
 const near=sourceBorderDistance(border,position)<margin*2&&position.x>=b.minX-margin&&position.x<b.maxX+margin&&position.z>=b.minZ-margin&&position.z<b.maxZ+margin;
 return near&&(bounds.minX<Math.floor(b.minX)||bounds.maxX>Math.ceil(b.maxX)||bounds.minZ<Math.floor(b.minZ)||bounds.maxZ>Math.ceil(b.maxZ));
}
const sourceDimensions={
 'minecraft:overworld':{bedWorks:true,anchorWorks:false,hasSkyLight:true,hasCeiling:false,minY:-64,maxY:320},
 'minecraft:nether':{bedWorks:false,anchorWorks:true,hasSkyLight:false,hasCeiling:true,minY:0,maxY:256},
 'minecraft:the_end':{bedWorks:false,anchorWorks:false,hasSkyLight:false,hasCeiling:false,minY:0,maxY:256}
};
function dimensionId(dimension){const id=dimension?.id;return id==='overworld'?'minecraft:overworld':id==='nether'?'minecraft:nether':id==='the_end'?'minecraft:the_end':id;}
function knownBoolean(value,fact,at){if(typeof value!=='boolean')throw new UnknownRespawnFact(fact,at);return value;}
function knownPosition(at,fact){if(!at||!['x','y','z'].every(axis=>Number.isInteger(at[axis])&&at[axis]>=-2147483648&&at[axis]<=2147483647))throw new UnknownRespawnFact(fact);return {x:at.x,y:at.y,z:at.z};}
function javaInt(value,fact){if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw new UnknownRespawnFact(fact);return value;}
function validBounds(bounds){return bounds&&['minX','minY','minZ','maxX','maxY','maxZ'].every(key=>Number.isFinite(bounds[key]))&&bounds.minX<=bounds.maxX&&bounds.minY<=bounds.maxY&&bounds.minZ<=bounds.maxZ;}
function declaredBoxes(value,at){if(!Array.isArray(value)||!value.every(box=>Array.isArray(box)&&box.length===6&&box.every(Number.isFinite)&&box[0]<=box[3]&&box[1]<=box[4]&&box[2]<=box[5]))throw new UnknownRespawnFact('declared source collision boxes',at);return value;}
function boundsIntersect(a,b){return a.minX<b.maxX&&a.maxX>b.minX&&a.minY<b.maxY&&a.maxY>b.minY&&a.minZ<b.maxZ&&a.maxZ>b.minZ;}
function expandedBounds(bounds,epsilon=1e-7){return {minX:bounds.minX-epsilon,minY:bounds.minY-epsilon,minZ:bounds.minZ-epsilon,maxX:bounds.maxX+epsilon,maxY:bounds.maxY+epsilon,maxZ:bounds.maxZ+epsilon};}
function rootVehicle(entity){const seen=new Set();let current=entity;for(;;){if(!current?.id||seen.has(current.id))throw new UnknownRespawnFact('source root vehicle relation');seen.add(current.id);let parent;try{parent=current.getComponent?.('minecraft:riding')?.entityRidingOn;}catch{throw new UnknownRespawnFact('source root vehicle relation');}if(!parent)return current.id;current=parent;}}
/** EntityType fixed 1.375F × .5625F Boat dimensions; never Native getAABB(). */
function boatBounds(entity){const p=entity.location;if(!p||!['x','y','z'].every(axis=>Number.isFinite(p[axis])))throw new UnknownRespawnFact('source boat position');return bodyBounds(p,1.375,.5625);}
/** Shulker's sanitizeScale caps at 3, dimensions are scale×1, physicalPeek is
 * in [0,1], and its attachment can extend one face by scale. This is a union
 * of actual source possibilities, used only to prove a remote shulker cannot
 * enter the requested broadphase. An overlapping union is NOT a collision.
 */
function shulkerPossibleBounds(entity){const p=entity.location;if(!p||!['x','y','z'].every(axis=>Number.isFinite(p[axis])))throw new UnknownRespawnFact('source shulker position');return {minX:p.x-4.5,minY:p.y-3,minZ:p.z-4.5,maxX:p.x+4.5,maxY:p.y+6,maxZ:p.z+4.5};}
/** Actual source BlockCollisions cursor bounds and border-type skips. */
export function sourceBlockCollision(bounds,read){
 const epsilon=1e-7,min=[Math.floor(bounds.minX-epsilon)-1,Math.floor(bounds.minY-epsilon)-1,Math.floor(bounds.minZ-epsilon)-1],max=[Math.floor(bounds.maxX+epsilon)+1,Math.floor(bounds.maxY+epsilon)+1,Math.floor(bounds.maxZ+epsilon)+1];
 // Cursor3D advances X fastest, then Y, then Z. This also preserves which
 // queried unknown precedes a known collision/rejection.
 for(let z=min[2];z<=max[2];z++)for(let y=min[1];y<=max[1];y++)for(let x=min[0];x<=max[0];x++){
  const boundary=Number(x===min[0]||x===max[0])+Number(y===min[1]||y===max[1])+Number(z===min[2]||z===max[2]);if(boundary===3)continue;
  const at={x,y,z},view=read(at);
  if(boundary===2&&view.id!=='minecraft:moving_piston')continue;
  if(boundary===1&&!view.largeCollision())continue;
  if(view.intersects?view.intersects(at,bounds):sourceBoxesIntersect(view.collisionBoxes(),at,bounds))return true;
 }
 return false;
}
function adapter(player,world,provided,keepInventory){
 const cache=new Map();let capturedMetadata,metadataRead=false;
 const features=dimension=>{
  const row=provided.dimensionFeatures?.(dimension)??sourceDimensions[dimensionId(dimension)];
  if(!row)throw new UnknownRespawnFact('source dimension features '+dimensionId(dimension));return row;
 };
 function blockAt(dimension,at){
  const key=dimensionId(dimension)+':'+at.x+','+at.y+','+at.z;
  if(cache.has(key))return cache.get(key);
  const dimensionFacts=features(dimension);
  if(at.y<dimensionFacts.minY||at.y>=dimensionFacts.maxY){const view=javaBlockView({typeId:'minecraft:air',location:at,permutation:{getAllStates:()=>({})},isWaterlogged:false});cache.set(key,view);return view;}
  let block;try{block=dimension.getBlock(at);}catch{throw new UnknownRespawnFact('loaded source block',at);}
  if(!block)throw new UnknownRespawnFact('loaded source block',at);
  const view=javaBlockView(block,provided.blockState?.(block,dimension,at));
  const wrapped={...view,native:block};
  for(const method of ['collisionBoxes','floorBoxes','floorMaximum','largeCollision'])if(provided.blockFact)wrapped[method]=()=>{
   const value=provided.blockFact({method,block,view,dimension,at});if(value===undefined)return view[method]();
   if(method==='largeCollision')return knownBoolean(value,'declared hasLargeCollisionShape',at);
   if(method==='floorMaximum'){if(value!==null&&!Number.isFinite(value))throw new UnknownRespawnFact('declared non-climbable floor maximum Y',at);return value;}
   return declaredBoxes(value,at);
  };
  if(provided.blockFact){
   const declaredShape=()=>provided.blockFact({method:'collisionBoxes',block,view,dimension,at});
   wrapped.intersects=(position,bounds)=>{const value=declaredShape();return value===undefined?view.intersects(position,bounds):sourceBoxesIntersect(declaredBoxes(value,at),position,bounds);};
   wrapped.upperFaceFull=()=>{const value=declaredShape();return value===undefined?view.upperFaceFull():sourceFullUpperFace(declaredBoxes(value,at));};
  }
  cache.set(key,wrapped);return wrapped;
 }
 const border=()=>validatedProfile(provided.profile??ownedProfile(world)).border;
 function dismount(dimension,at,strict){
  return findSafeDismount(at,strict,{
   isDangerous:p=>blockAt(dimension,p).flag('player_block_dangerous'),
   floorHeight:p=>respawnFloorHeight(blockAt(dimension,p).floorMaximum(),()=>blockAt(dimension,{...p,y:p.y-1}).floorMaximum()),
   collides:p=>sourceBlockCollision(bodyBounds(p),b=>blockAt(dimension,b)),
   invalidSpawnInside:p=>blockAt(dimension,p).flag('invalid_spawn_inside'),
   insideBorder:p=>sourceBorderContains(border(),bodyBounds(p))
  });
 }
 function metadata(spawn){if(!metadataRead){capturedMetadata=provided.metadata?provided.metadata(player,spawn):getRespawnMetadata(player,spawn);metadataRead=true;}return capturedMetadata;}
 function forced(spawn){return knownBoolean(metadata(spawn)?.forced,'saved forced respawn flag',spawn);}
 function yaw(spawn){const value=Math.fround(metadata(spawn)?.yaw);if(!Number.isFinite(value))throw new UnknownRespawnFact('saved respawn yaw',spawn);return value;}
 function bedDestination(dimension,at,view,spawn){
  const facing=view.property('facing'),bunk=blockAt(dimension,{...at,y:at.y-1}).id.endsWith('_bed'),saved=metadata(spawn)?.yaw,angle=saved===undefined?undefined:Math.fround(saved);
  if(saved!==undefined&&!Number.isFinite(angle))throw new UnknownRespawnFact('saved respawn yaw',at);
  if(Number.isFinite(angle))return selectStandUpPosition(at,bedStandUpStages(facing,angle,bunk),(p,strict)=>dismount(dimension,p,strict));
  // Saved yaw has two possible side orders. Only an identical complete answer
  // in both orders is independent of the unavailable historical angle.
  const orders=new Map();for(const angle of [0,90,180,270]){const stages=bedStandUpStages(facing,angle,bunk);orders.set(JSON.stringify(stages),stages);}
  let answer,encoded;for(const stages of orders.values()){
   const next=selectStandUpPosition(at,stages,(p,strict)=>dismount(dimension,p,strict)),key=JSON.stringify(next);
   if(encoded!==undefined&&encoded!==key)throw new UnknownRespawnFact('saved respawn yaw determines bed candidate order',at);answer=next;encoded=key;
  }
  return answer;
 }
 function personal(spawn){
  const at=knownPosition(spawn,'personal spawn BlockPos'),dimension=spawn.dimension;
  if(!dimension)throw new UnknownRespawnFact('personal spawn dimension');
  const view=blockAt(dimension,at),f=features(dimension);
  if(view.id==='minecraft:respawn_anchor'&&knownBoolean(f.anchorWorks,'dimension respawnAnchorWorks')){
   const charges=Number(view.property('charges'));
   if(charges>0||forced(spawn)){
    const position=selectStandUpPosition(at,anchorStandUpStages(),(p,strict)=>dismount(dimension,p,strict));
    if(position!==null){
     const consume=!keepInventory&&!forced(spawn);
     return {status:'ready',branch:'anchor',dimension,position,yaw:respawnLookAtYaw(position,at),pitch:0,consumeAnchor:consume?{block:view.native,charges}:undefined};
    }
    return null;
   }
  }else if(view.id.endsWith('_bed')&&knownBoolean(f.bedWorks,'dimension bedWorks')){
   const position=bedDestination(dimension,at,view,spawn);
   return position===null?null:{status:'ready',branch:'bed',dimension,position,yaw:respawnLookAtYaw(position,at),pitch:0};
  }
  // When both forced=false and forced=true reject this block, the missing
  // historical flag cannot affect the result. This does not invent the flag.
  const savedForced=metadata(spawn)?.forced;
  if(savedForced===false)return null;
  if(savedForced===undefined){if(!view.possibleForced())return null;throw new UnknownRespawnFact('saved forced respawn flag',at);}
  if(!knownBoolean(savedForced,'saved forced respawn flag',at))return null;
  const result=forcedRespawnPosition(at,yaw(spawn),p=>blockAt(dimension,p).possibleForced());
  return result===null?null:{status:'ready',branch:'forced',dimension,...result};
 }
 function standingBounds(position){
  if(provided.playerBounds){const bounds=provided.playerBounds(player,position);if(!validBounds(bounds))throw new UnknownRespawnFact('declared source player bounds');return bounds;}
  for(const flag of ['isSneaking','isSwimming','isGliding','isSleeping'])if(!knownBoolean(player[flag],'source standing player pose '+flag)||player[flag]===false)continue;else throw new UnknownRespawnFact('non-standing source player pose');
  return bodyBounds(position);
 }
 function entityCollision(dimension,bounds){
  if(provided.entityCollision)return knownBoolean(provided.entityCollision(player,dimension,bounds),'source entity collision');
  let entities;try{entities=dimension.getEntities();}catch{throw new UnknownRespawnFact('source collidable entities');}
  // Entity.canBeCollidedWith is false in the 1.21.1 base class. Only Boat
  // (including ChestBoat) and living Shulker override it. This explicit set
  // contains same-name official Native counterparts, not a namespace wildcard.
  const broadphase=expandedBounds(bounds);
  for(const entity of entities)if(entity.id!==player.id){
   const declared=provided.entityFact?.(entity,{player,dimension,bounds});
   if(declared!==undefined){
    if(!declared||typeof declared!=='object')throw new UnknownRespawnFact('declared source entity fact');
    if(declared.collidable===false)continue;
    if(!validBounds(declared.bounds))throw new UnknownRespawnFact('declared source entity bounds');
    if(!boundsIntersect(broadphase,declared.bounds))continue;
    knownBoolean(declared.collidable,'declared source entity canBeCollidedWith');
    if(typeof declared.rootVehicleId!=='string')throw new UnknownRespawnFact('declared source entity root vehicle');
    if(declared.rootVehicleId!==rootVehicle(player))return true;continue;
   }
   if(sourceNonCollidableEntities.has(entity.typeId)||isNonCollidableHelper(entity.typeId))continue;
   if(entity.typeId==='minecraft:item'&&entity.getComponent('minecraft:item'))continue;
   if(entity.typeId==='minecraft:boat'||entity.typeId==='minecraft:chest_boat'){
    if(!boundsIntersect(broadphase,boatBounds(entity)))continue;
    if(rootVehicle(entity)!==rootVehicle(player))return true;continue;
   }
   if(entity.typeId==='minecraft:shulker'&&!boundsIntersect(broadphase,shulkerPossibleBounds(entity)))continue;
   throw new UnknownRespawnFact('local source collidable entity facts '+entity.typeId);
  }
  return false;
 }
 function canStand(dimension,at){
  const position={x:at.x+.5,y:at.y,z:at.z+.5},bounds=standingBounds(position);
  // CollisionGetter.noCollision: blocks, then entities, then border collision.
  if(sourceBlockCollision(bounds,p=>{
   const view=blockAt(dimension,p);if(!view.dynamic)return view;
   return {...view,intersects:undefined,collisionBoxes:()=>{
    const supplied=provided.playerCollisionBoxes?.({player,position,bounds,dimension,at:p,view});
    if(supplied===undefined)throw new UnknownRespawnFact('live-player context dynamic source collision shape',p);
    return declaredBoxes(supplied,p);
   }};
  }))return false;
  if(entityCollision(dimension,bounds))return false;
  return !sourceBorderCollision(border(),position,bounds);
 }
 function column(dimension,{x,z}){
  const f=features(dimension),minY=javaInt(f.minY,'source minimum build height'),maxY=javaInt(f.maxY,'source maximum build height');
  if(minY>=maxY)throw new UnknownRespawnFact('source build height');
  function height(predicate){for(let y=maxY-1;y>=minY;y--)if(predicate(blockAt(dimension,{x,y,z})))return y;return minY-1;}
  let motion;
  if(knownBoolean(f.hasCeiling,'dimension hasCeiling'))motion=javaInt(provided.generatorSpawnHeight?.(dimension),'source generator spawn height');
  else motion=height(view=>view.flag('motion_blocking'));
  if(motion<minY)return null;
  const surface=height(view=>!['minecraft:air','minecraft:cave_air','minecraft:void_air'].includes(view.id));
  if(surface<=motion&&surface>height(view=>view.flag('blocks_motion')))return null;
  for(let y=motion+1;y>=minY;y--){const view=blockAt(dimension,{x,y,z});if(view.nonemptyFluid())return null;if(view.upperFaceFull())return {x,y:y+1,z};}
  return null;
 }
 function shared(){
  const dimension=world.getDimension('overworld'),f=features(dimension),nativeSpawn=provided.sharedSpawn?.(world)??world.getDefaultSpawnLocation();
  if(!nativeSpawn)throw new UnknownRespawnFact('shared spawn X/Z');javaInt(nativeSpawn.x,'shared spawn X');javaInt(nativeSpawn.z,'shared spawn Z');
  const profile=validatedProfile(provided.profile??ownedProfile(world));
  if(knownBoolean(f.hasSkyLight,'dimension skylight')&&!profile.adventure){
   const radius=javaInt(world.gameRules?.spawnRadius,'source spawnRadius'),plan=sharedSpawnSearchPlan(radius,sourceBorderDistance(profile.border,nativeSpawn));
   const random=provided.nextInt??(bound=>Math.floor(Math.random()*bound));
   for(const point of sharedSpawnColumns(nativeSpawn,plan,random)){const found=column(dimension,point);if(found!==null&&canStand(dimension,found))return {status:'ready',branch:'shared-column',dimension,position:{x:found.x+.5,y:found.y,z:found.z+.5},yaw:0,pitch:0};}
  }
  // Native Y=32767 means dynamic Native height, not a Java sharedSpawnPos Y.
  if(nativeSpawn.y===32767&&!provided.sharedSpawn)throw new UnknownRespawnFact('Java shared spawn Y (Native dynamic-height sentinel)');
  let at=knownPosition(nativeSpawn,'shared spawn BlockPos');const minY=javaInt(f.minY,'source minimum build height'),maxY=javaInt(f.maxY,'source maximum build height');
  while(!canStand(dimension,at)&&at.y<maxY-1)at={...at,y:at.y+1};
  while(canStand(dimension,{...at,y:at.y-1})&&at.y>minY+1)at={...at,y:at.y-1};
  return {status:'ready',branch:'shared-fallback',dimension,position:{x:at.x+.5,y:at.y,z:at.z+.5},yaw:0,pitch:0};
 }
 return {personal,shared};
}
/** ready / null (proven rejection inside source resolver) / unknown remain
 * distinct. An unknown earlier query never becomes a later candidate fallback.
 */
export function resolveJavaRespawn(player,world,provided,capturedKeepInventory){
 try{
  const keepInventory=knownBoolean(capturedKeepInventory??world.gameRules?.keepInventory,'source keepInventory');
  const context=provided??contextProvider?.({player,world})??{};if(typeof context!=='object'||Array.isArray(context))throw new UnknownRespawnFact('declared source adapter context');
  const a=adapter(player,world,context,keepInventory);let spawn;
  try{spawn=context.personalSpawn?context.personalSpawn(player):player.getSpawnPoint();}catch{throw new UnknownRespawnFact('Native personal spawn point');}
  const personal=spawn?a.personal(spawn):null;return personal??a.shared();
 }catch(error){if(error instanceof UnknownRespawnFact)return {status:'unknown',fact:error.fact,position:error.position};throw error;}
}
export function applyJavaRespawn(player,world,sound='kaleidoscope_world_liquor.java.respawn'){
 player.dimension.playSound(sound,player.location,{volume:1,pitch:1});
 const keepInventory=world.gameRules?.keepInventory;
 const result=resolveJavaRespawn(player,world,undefined,keepInventory);if(result.status!=='ready')return result;
 if(result.consumeAnchor){const {block,charges}=result.consumeAnchor;block.setPermutation(block.permutation.withState('respawn_anchor_charge',charges-1));}
 player.teleport(result.position,{dimension:result.dimension,rotation:{x:result.pitch,y:result.yaw},keepVelocity:true});
 player.dimension.playSound(sound,player.location,{volume:1,pitch:1});
 player.addEffect('hunger',300,{amplifier:0});
 // Stable Native exposes no writable fallDistance. Do not clear velocity to
 // pretend this source field reset, or label packets/client visuals verified.
 return result;
}
const installedRespawn=new WeakMap();
const publicDeclarationEvents=new Set(['kaleidoscope_world_liquor:declare_respawn_context','kaleidoscope_world_liquor:declare_respawn_metadata']);
function onlyKeys(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).every(key=>keys.includes(key));}
/** Cross-pack declarations are JSON data, not executable callbacks. The Server
 * source is required; entity/block command sources cannot modify this context.
 */
export function installJavaRespawn(world,system){
 if(installedRespawn.has(world))return installedRespawn.get(world);
 const metadata=installRespawnMetadata(world,system);
 const declarations=system.afterEvents.scriptEventReceive.subscribe(event=>{
  if(!publicDeclarationEvents.has(event.id)||event.sourceType!=='Server'||event.sourceEntity!==undefined||event.sourceBlock!==undefined||event.initiator!==undefined||typeof event.message!=='string'||event.message.length>4096)return;
  try{
   const payload=JSON.parse(event.message);
   if(event.id==='kaleidoscope_world_liquor:declare_respawn_context'){
    if(!onlyKeys(payload,['schema','border','adventure'])||!onlyKeys(payload.border,['centerX','centerZ','size','absoluteMax']))return;
    declareJavaRespawnContext(world,payload);return;
   }
   if(!onlyKeys(payload,['entity','point','yaw','forced'])||!onlyKeys(payload.point,['x','y','z','dimensionId'])||typeof payload.entity!=='string'||!payload.entity.length||payload.entity.length>256)return;
   const player=world.getEntity(payload.entity);if(player?.typeId!=='minecraft:player')return;
   const current=player.getSpawnPoint();
   if(!current||current.dimension?.id!==payload.point.dimensionId||!['x','y','z'].every(axis=>current[axis]===payload.point[axis]))return;
   declareRespawnMetadata(player,payload);
  }catch{} // bounded, quiet declaration rejection; no HUD/chat or log replay.
 },{namespaces:['kaleidoscope_world_liquor']});
 const handle={metadata,declarations};installedRespawn.set(world,handle);return handle;
}

const sourceNonCollidableEntities=new Set('allay area_effect_cloud armadillo armor_stand arrow axolotl bat bee blaze bogged breeze camel cat cave_spider chest_minecart chicken cod command_block_minecart cow creeper dolphin donkey dragon_fireball drowned egg elder_guardian ender_dragon ender_pearl enderman endermite fireball fox frog ghast glow_squid goat guardian hoglin hopper_minecart horse husk iron_golem lightning_bolt llama llama_spit magma_cube minecart mooshroom mule ocelot ominous_item_spawner panda parrot phantom pig piglin piglin_brute pillager player polar_bear pufferfish rabbit ravager salmon sheep shulker_bullet silverfish skeleton skeleton_horse slime small_fireball sniffer snow_golem snowball spider squid stray strider tadpole tnt tnt_minecart trader_llama turtle vex villager vindicator wandering_trader warden witch wither wither_skeleton wither_skull wolf zoglin zombie zombie_horse zombie_villager'.split(' ').map(name=>'minecraft:'+name));
