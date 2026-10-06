/** CustomDrinkItem plus Minecraft 1.21.1 LivingEntity's real use-effect cadence.
 * Only owned bottles are tracked. Native stop/complete events cancel scheduled
 * pulses; unrelated drinks and other packs' sound routing are untouched.
 */
export const DRINK_SOUNDS=Object.freeze({
 ice_tea:'kaleidoscope_world_liquor.ice_tea_eat',
 cool_tea:'kaleidoscope_world_liquor.cool_ice_tea_drink',
 sour_plum:'kaleidoscope_world_liquor.sour_plum_drink',
});
export function useSoundPulse(duration,remaining){
 return duration-remaining>Math.trunc(Math.fround(Math.fround(duration)*Math.fround(.21875)))&&remaining%4===0;
}
export function drinkPitch(roll){
 if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('INVALID_RNG');
 const value=Math.floor(roll*16777216)/16777216;
 return Math.fround(Math.fround(value*Math.fround(.1))+Math.fround(.9));
}
export function installDrinkAudio(world,system,content,rng=Math.random){
 const sounds=new Map(),active=new Map();
 for(const row of content){
  const sound=DRINK_SOUNDS[row.base?.split(':').at(-1)];
  if(row.kind==='bottle'&&sound)for(const id of row.items)sounds.set(id,sound);
 }
 const forget=(id,item)=>{const row=active.get(id);if(item&&row&&row.item!==item)return;if(row?.handle!==undefined)system.clearRun(row.handle);active.delete(id);};
 const play=(player,sound)=>{try{player.dimension.playSound(sound,player.location,{volume:.5,pitch:drinkPitch(rng())});}catch{}};
 const arm=row=>{
  let remaining=row.remaining-1;
  while(remaining>0&&!useSoundPulse(row.duration,remaining))remaining--;
  if(remaining<=0){row.handle=system.runTimeout(()=>{if(active.get(row.player.id)===row)forget(row.player.id);},row.remaining);return;}
  const wait=row.remaining-remaining;
  row.handle=system.runTimeout(()=>{
   if(active.get(row.player.id)!==row)return;
   row.remaining=remaining;
   play(row.player,row.sound);arm(row);
  },wait);
 };
 world.afterEvents.itemStartUse.subscribe(e=>{
  forget(e.source.id);const sound=sounds.get(e.itemStack?.typeId);
  if(!sound)return;
  const duration=e.useDuration;
  if(!Number.isInteger(duration)||duration<1||duration>1200)return;
  const row={player:e.source,item:e.itemStack.typeId,sound,duration,remaining:duration};active.set(e.source.id,row);arm(row);
 });
 world.afterEvents.itemStopUse.subscribe(e=>forget(e.source.id,e.itemStack?.typeId));
 world.afterEvents.itemCompleteUse.subscribe(e=>{
  forget(e.source.id,e.itemStack?.typeId);const sound=sounds.get(e.itemStack?.typeId);
  // LivingEntity.completeUsingItem calls triggerItemUseEffects once more.
  if(sound)play(e.source,sound);
 });
 world.afterEvents.playerLeave.subscribe(e=>forget(e.playerId));
 return {active,sounds};
}
