import {giveJavaInventoryItem} from './java-player-inventory.js';

/** Current FreezerBlockEntity.extractOutput. Successful item settlement precedes
 * the saved output debit. SDK failures undo owned writes/drop before rethrowing;
 * that failure handling is an adapter, not a Java callback-phase claim.
 */
export function extractFreezerOutput(player,state,recipe,{createStack,commit,restore}={}){
 if(!(state.output>0)||!recipe)return {status:'NO_OUTPUT'};
 const inventory=player.getComponent('minecraft:inventory').container,slot=player.selectedSlotIndex;
 const held=inventory.getItem(slot),required=recipe.extract_condition?.item;
 if(required&&held?.typeId!==required)return {status:'NEED_ITEM',required};
 const undo=[],drops=[];
 const writeInventory=(container,index,before,after)=>{undo.push(()=>container.setItem(index,before));container.setItem(index,after);};
 const writeEquipment=(equipment,index,before,after)=>{undo.push(()=>{if(equipment.setEquipment(index,before)!==true)throw Error('OFFHAND_ROLLBACK_REJECTED');});if(equipment.setEquipment(index,after)!==true)throw Error('OFFHAND_ITEM_WRITE_REJECTED');};
 const output=createStack(recipe.result.id,1);let delivery;
 try{
  if(required&&String(player.getGameMode()).toLowerCase()!=='creative'){
   if(held.amount===1){writeInventory(inventory,slot,held,output);delivery='HAND';}
   else{const reduced=held.clone();reduced.amount--;writeInventory(inventory,slot,held,reduced);delivery=giveJavaInventoryItem(player,output,{writeInventory,writeEquipment,recordDrop:entity=>drops.push(entity)});}
  }else delivery=giveJavaInventoryItem(player,output,{writeInventory,writeEquipment,recordDrop:entity=>drops.push(entity)});
  const next={...state,output:state.output-1};commit(next);
  return {status:'EXTRACTED',delivery,state:next};
 }catch(error){
  const failures=[];
  for(const entity of drops)try{entity.remove();}catch(failure){failures.push(failure);}
  for(const revert of undo.reverse())try{revert();}catch(failure){failures.push(failure);}
  try{restore?.();}catch(failure){failures.push(failure);}
  if(failures.length)throw new AggregateError([error,...failures],'FREEZER_OUTPUT_RECOVERY_FAILED');
  throw error;
 }
}
