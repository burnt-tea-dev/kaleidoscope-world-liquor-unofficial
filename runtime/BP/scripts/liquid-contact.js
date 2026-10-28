/** Fluid contact for the native API, which has isInWater but no isInLava. */
import {BlockVolume} from '@minecraft/server';
export function eyesUnderWater(entity){
 const head=entity.getHeadLocation(),at={x:Math.floor(head.x),y:Math.floor(head.y),z:Math.floor(head.z)};
 const block=entity.dimension.getBlock(at);
 const water=cell=>cell&&(cell.isWaterlogged||['minecraft:water','minecraft:flowing_water'].includes(cell.typeId));
 if(!water(block))return false;
 const above=entity.dimension.getBlock({...at,y:at.y+1});
 const full=water(above),depth=block.isWaterlogged?0:block.permutation.getState('liquid_depth')??0;
 return head.y<at.y+(full?1:Math.fround((depth>=8?8:8-depth)/9));
}
export function lavaContact(entity){
 const box=entity.getAABB(),min={x:box.center.x-box.extent.x+.001,y:box.center.y-box.extent.y+.001,z:box.center.z-box.extent.z+.001},max={x:box.center.x+box.extent.x-.001,y:box.center.y+box.extent.y-.001,z:box.center.z+box.extent.z-.001};
 const volume=new BlockVolume({x:Math.floor(min.x),y:Math.floor(min.y),z:Math.floor(min.z)},{x:Math.floor(max.x),y:Math.floor(max.y),z:Math.floor(max.z)});
 for(const at of entity.dimension.getBlocks(volume,{includeTypes:['minecraft:lava','minecraft:flowing_lava']},false).getBlockLocationIterator()){
  const block=entity.dimension.getBlock(at),depth=block.permutation.getState('liquid_depth')??0;
  const above=entity.dimension.getBlock({...at,y:at.y+1}),full=above&&['minecraft:lava','minecraft:flowing_lava'].includes(above.typeId);
  const height=full?1:Math.fround((depth>=8?8:8-depth)/9);
  if(max.y>at.y&&min.y<at.y+height)return true;
 }
 return false;
}
