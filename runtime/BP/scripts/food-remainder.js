import {giveJavaInventoryItem} from './java-player-inventory.js';

/** CompatFoodItem.remainderItem per owned food: only the pudding keeps a bowl. */
export const FOOD_REMAINDERS=Object.freeze({'kaleidoscope_world_liquor:pochi_pudding':'minecraft:bowl'});
export const foodRemainderDiagnostics={completed:0,hand:0,dropped:0,relocated:0,unresolved:0,errors:[]};
function unresolved(status,error){
 foodRemainderDiagnostics.unresolved++;
 foodRemainderDiagnostics.errors.push({status,...(error?{error:String(error)}:{})});
 if(foodRemainderDiagnostics.errors.length>16)foodRemainderDiagnostics.errors.shift();
 return {status};
}
const sameFood=(current,expected)=>!!current&&current.typeId===expected.typeId&&current.isStackableWith(expected);

/** Java CompatFoodItem.finishUsingItem: super.finishUsingItem applies the food
 * effects and consumes one from the used stack unless the player has infinite
 * materials. If that stack became empty, a fresh remainder stack is returned and
 * LivingEntity.completeUsingItem puts it in the used hand; otherwise, including
 * Creative, one remainder is spawnAtLocation'd at the entity and the original
 * stack stays. Native food debits its own stack around this callback, so the
 * branch is read from the same slot on the next tick, after every native write
 * of this use has landed. Abilities are sampled at completion, like Java.
 */
export function completeFoodRemainder(event,{createStack,run}){
 const player=event.source,expected=event.itemStack?.clone(),remainder=FOOD_REMAINDERS[expected?.typeId];
 if(!remainder||player?.typeId!=='minecraft:player')return {status:'NOT_OWNED_REMAINDER_FOOD'};
 let slot,creative;
 try{slot=player.selectedSlotIndex;creative=String(player.getGameMode()).toLowerCase()==='creative';}
 catch(error){return unresolved('UNRESOLVED_HAND',error);}
 run(()=>settleFoodRemainder(player,{slot,expected,remainder,creative,createStack}));
 return {status:'SCHEDULED',slot,remainder};
}

/** One tick later: empty used slot => hand replacement; the same food still
 * there (Survival with servings left, or Creative which never debits) => one
 * remainder entity at the player; anything else in that slot means the player
 * moved items during the tick, so the remainder goes through Java Inventory.add
 * rather than overwriting their item or vanishing. Nothing is written twice.
 */
export function settleFoodRemainder(player,{slot,expected,remainder,creative,createStack}){
 try{
  if(player.isValid===false)return unresolved('PLAYER_GONE');
  const inventory=player.getComponent('minecraft:inventory').container,current=inventory.getItem(slot),item=createStack(remainder,1);
  const drop=()=>{
   const entity=player.dimension.spawnItem(item,player.location);
   if(!entity)throw Error('REMAINDER_DROP_REJECTED');
   foodRemainderDiagnostics.completed++;foodRemainderDiagnostics.dropped++;
   return {status:'COMPLETED',delivery:'DROP'};
  };
  if(creative)return drop();
  if(!current){inventory.setItem(slot,item);foodRemainderDiagnostics.completed++;foodRemainderDiagnostics.hand++;return {status:'COMPLETED',delivery:'HAND'};}
  if(sameFood(current,expected))return drop();
  const delivery=giveJavaInventoryItem(player,item);
  foodRemainderDiagnostics.completed++;foodRemainderDiagnostics.relocated++;
  return {status:'COMPLETED',delivery:'RELOCATED_'+delivery};
 }catch(error){return unresolved('COMPLETION_FAILED',error);}
}
