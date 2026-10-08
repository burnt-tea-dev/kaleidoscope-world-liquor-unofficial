import {queueFrostedIce,flushFrostedIce,frostBlock} from './frost-aging.js';
/** Current Java 1.1.11 EventHandlers.freezeWater selection.
 * The source PlayerTick.Post calls this every tick with radius 3 + effect amplifier.
 * Native scheduled aging is supplied by the source-backed owned scheduler.
 */
export function freezeWater(entity,amplifier){
 if(!entity.isOnGround)return 0;
 const radius=3+amplifier,location=entity.location;
 const center={x:Math.floor(location.x),y:Math.floor(location.y)-1,z:Math.floor(location.z)};
 let frozen=0;
 for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){
  if(x*x+z*z>radius*radius)continue;
  try{
   const at={x:center.x+x,y:center.y,z:center.z+z},block=frostBlock(entity.dimension,at);
   if(block?.typeId!=='minecraft:water'||block.permutation.getState('liquid_depth')!==0)continue;
   if(!frostBlock(entity.dimension,{...at,y:at.y+1})?.isAir)continue;
   block.setType('minecraft:frosted_ice');queueFrostedIce(entity.dimension,at);frozen++;
  }catch{/* Native queries cannot load unavailable chunks; preserve that explicit gap. */}
 }
 flushFrostedIce();
 return frozen;
}
