// CaptainGiftMixinHooks checks a 3x3 area at the feet and the middle row one cell below.
const OFFSETS=[[1,0,1],[1,0,0],[1,-1,0],[1,0,-1],[0,0,1],[0,0,0],
 [0,-1,0],[0,0,-1],[-1,0,1],[-1,0,0],[-1,-1,0],[-1,0,-1]];
const water=block=>block&&(block.isWaterlogged||block.typeId==='minecraft:water'||block.typeId==='minecraft:flowing_water');

/** Java clips only descending movement against translated water-fluid cubes.
 * Ground/fall-distance writes remain native API gaps; no block is replaced.
 */
export function captainWaterStep(entity,velocityY,underWater=false){
 if(velocityY>0||entity.isSneaking||underWater)return undefined;
 const at=entity.location,box=entity.getAABB(),minimum={x:box.center.x-box.extent.x-.5,y:box.center.y-box.extent.y-.5,z:box.center.z-box.extent.z-.5},
  maximum={x:box.center.x+box.extent.x+.5,y:box.center.y+box.extent.y+.5,z:box.center.z+box.extent.z+.5};
 const origin={x:Math.floor(at.x),y:Math.floor(at.y),z:Math.floor(at.z)};
 let clipped=velocityY;
 for(const [dx,dy,dz] of OFFSETS){
  const position={x:origin.x+dx,y:origin.y+dy,z:origin.z+dz};
  let block;try{block=entity.dimension.getBlock(position);}catch{continue;}
  if(!water(block))continue;
  const depth=block.isWaterlogged?0:block.permutation.getState('liquid_depth');
  if(depth===undefined)continue;
  // Java getOwnHeight ignores the block above, then adds blockY as float.
  const height=Math.fround((depth>=8?8:8-depth)/9),surface=Math.fround(Math.fround(position.y)+height);
  if(position.x>=maximum.x||position.x+1<=minimum.x||surface>=maximum.y||surface+1<=minimum.y||position.z>=maximum.z||position.z+1<=minimum.z)continue;
  clipped=Math.max(clipped,surface-at.y);
 }
 return clipped>velocityY?clipped:undefined;
}

/** Native API impulses settle after gravity/drag. Preserve horizontal movement. */
export function applyCaptainWaterStep(entity,{underWater=false,pendingImpulseY=0}={}){
 const velocity=entity.getVelocity(),levitation=entity.getEffect('levitation')?.amplifier;
 const gravity=entity.getEffect('slow_falling')&&velocity.y<0?.01:.08;
 // Native Player liquid gravity is .005; ordinary bodies use .02.
 const liquidGravity=entity.typeId==='minecraft:player'?.005:.02;
 const native=entity.isInWater?velocity.y*.8-liquidGravity:(levitation===undefined?velocity.y-gravity:velocity.y+(.05*(levitation+1)-velocity.y)*.2)*.98;
 const next=native+pendingImpulseY;
 const step=captainWaterStep(entity,next,underWater);
 if(step===undefined)return false;
 entity.applyImpulse({x:0,y:step-next,z:0});
 return true;
}
