import {javaFloatRoll} from './combat-source.js';

const EFFECTS=Object.freeze({
 'kaleidoscope_world_liquor:cola':['haste','speed'],
 'kaleidoscope_world_liquor:tonic_water':['regeneration'],
});
export const bottledDrinkDiagnostics={completed:0,dropped:0,unresolved:0,errors:[],audioErrors:[]};
export function burpPitch(roll){return Math.fround(Math.fround(javaFloatRoll(roll)*Math.fround(.1))+Math.fround(.9));}
export function eatingPitch(first,second){return Math.fround(Math.fround(1)+Math.fround(Math.fround(javaFloatRoll(first)-javaFloatRoll(second))*Math.fround(.4)));}
function sound(dimension,player,id,volume,pitch){
 try{dimension.playSound(id,{...player.location},{volume,pitch});}
 catch(error){bottledDrinkDiagnostics.audioErrors.push({id,error:String(error)});if(bottledDrinkDiagnostics.audioErrors.length>16)bottledDrinkDiagnostics.audioErrors.shift();}
}
export function bottledCompletionAudio(player,dimension,worldRng=Math.random){
 sound(dimension,player,'kaleidoscope_world_liquor.java.burp',.5,burpPitch(worldRng()));
 sound(dimension,player,'kaleidoscope_world_liquor.java.eating',1,eatingPitch(worldRng(),worldRng()));
}
function unresolved(status,error){
 bottledDrinkDiagnostics.unresolved++;
 bottledDrinkDiagnostics.errors.push({status,...(error?{error:String(error)}:{})});
 if(bottledDrinkDiagnostics.errors.length>16)bottledDrinkDiagnostics.errors.shift();
 return {status};
}
function sameUse(actual,expected){
 return !!actual&&!!expected&&actual.typeId===expected.typeId&&actual.amount===expected.amount&&actual.isStackableWith(expected);
}
function room(stack,bottle){return !!stack&&stack.amount<stack.maxAmount&&stack.isStackableWith(bottle);}

/** Java Player Inventory.add: selected merge, offhand merge, first main merge,
 * then first free main slot. Do not replace the selected hand with a remainder.
 */
export function giveGlassBottle(player,createStack){
 const inventory=player.getComponent('minecraft:inventory').container;
 const bottle=createStack('minecraft:glass_bottle',1),selected=player.selectedSlotIndex;
 const merge=slot=>{const stack=inventory.getItem(slot);if(!room(stack,bottle))return false;stack.amount++;inventory.setItem(slot,stack);return true;};
 if(merge(selected))return 'INVENTORY';
 const equipment=player.getComponent('minecraft:equippable'),offhand=equipment?.getEquipment('Offhand');
 if(room(offhand,bottle)){offhand.amount++;if(equipment.setEquipment('Offhand',offhand)!==true)throw Error('OFFHAND_BOTTLE_WRITE_REJECTED');return 'OFFHAND';}
 for(let slot=0;slot<inventory.size;slot++)if(merge(slot))return 'INVENTORY';
 for(let slot=0;slot<inventory.size;slot++)if(!inventory.getItem(slot)){inventory.setItem(slot,bottle);return 'INVENTORY';}
 // Bedrock has no Player.drop(false) packet/physics hook. Count is preserved;
 // exact Java throw velocity, eye offset and pickup delay remain tracked gaps.
 player.dimension.spawnItem(bottle,player.location);return 'DROP';
}

/** BottledDrinkItem.finishUsingItem calls Item/Player/LivingEntity.eat first:
 * each food effect draw/dispatch, consume the original stack, then add a bottle
 * to the fresh Player inventory iff its current abilities are not Creative.
 * These items have no native food component, so Native does not debit them.
 */
export function completeBottledDrink(event,{createStack,rng=Math.random,worldRng=Math.random}){
 const player=event.source,expected=event.itemStack?.clone(),effects=EFFECTS[expected?.typeId];
 if(!effects||player?.typeId!=='minecraft:player')return {status:'NOT_OWNED_PLAYER_DRINK'};
 let slot,entry;
 try{slot=player.selectedSlotIndex;entry=player.getComponent('minecraft:inventory').container.getItem(slot);}
 catch(error){return unresolved('UNRESOLVED_ENTRY',error);}
 if(!sameUse(entry,expected))return unresolved('UNRESOLVED_ENTRY');
 try{
  // The finishUsingItem level remains the original world, but each sound reads
  // the current entity coordinates at its own call. Java uses world RNG here,
  // before its separate entity RNG draws for food-effect probability.
  bottledCompletionAudio(player,player.dimension,worldRng);
  for(const effect of effects)if(javaFloatRoll(rng())<1)player.addEffect(effect,300,{amplifier:0,showParticles:true});
  // Sample abilities after the effect calls; never cache pre-effect Creative.
  if(String(player.getGameMode()).toLowerCase()!=='creative'){
   const inventory=player.getComponent('minecraft:inventory').container,current=inventory.getItem(slot);
   if(!sameUse(current,expected))return unresolved('UNRESOLVED_ORIGINAL_STACK');
   if(current.amount===1)inventory.setItem(slot,undefined);
   else{current.amount--;inventory.setItem(slot,current);}
  }
  let delivery='CREATIVE';
  if(String(player.getGameMode()).toLowerCase()!=='creative')delivery=giveGlassBottle(player,createStack);
  bottledDrinkDiagnostics.completed++;if(delivery==='DROP')bottledDrinkDiagnostics.dropped++;
  return {status:'COMPLETED',delivery};
 }catch(error){return unresolved('COMPLETION_FAILED',error);}
}
