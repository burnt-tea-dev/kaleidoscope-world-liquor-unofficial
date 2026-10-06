/** Current Java 1.1.11 EventHandlers.freezeWater selection.
 * The source PlayerTick.Post calls this every tick with radius 3 + effect amplifier.
 * Native frosted-ice melting is a separately tracked parity gap; no second guessed timer.
 */
export function freezeWater(entity,amplifier){
 if(!entity.isOnGround)return 0;
 const radius=3+amplifier,location=entity.location;
 const center={x:Math.floor(location.x),y:Math.floor(location.y)-1,z:Math.floor(location.z)};
 let frozen=0;
 for(let x=-radius;x<=radius;x++)for(let z=-radius;z<=radius;z++){
  if(x*x+z*z>radius*radius)continue;
  try{
   const at={x:center.x+x,y:center.y,z:center.z+z},block=entity.dimension.getBlock(at);
   if(block?.typeId!=='minecraft:water'||block.permutation.getState('liquid_depth')!==0)continue;
   if(!entity.dimension.getBlock({...at,y:at.y+1})?.isAir)continue;
   block.setType('minecraft:frosted_ice');frozen++;
  }catch{/* Native queries cannot load unavailable chunks; preserve that explicit gap. */}
 }
 return frozen;
}
