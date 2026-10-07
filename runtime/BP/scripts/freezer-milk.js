import {giveJavaInventoryItem} from './java-player-inventory.js';
import {sameCapturedItem} from './captured-item.js';

/** The original FreezerBlock.useItemOn milk-only path fills its tank before
 * sampling Creative and settling the captured milk stack. No food use occurs.
 */
export function fillFreezerMilk(player,state,{createStack,commit,restore}={}){
 if(state.fluid||state.remaining>0||state.output>0)return {status:'NOT_EMPTY_IDLE_TANK'};
 const inventory=player.getComponent('minecraft:inventory').container,slot=player.selectedSlotIndex,held=inventory.getItem(slot);
 if(held?.typeId!=='minecraft:milk_bucket')return {status:'NOT_MILK'};
 const undo=[];
 const writeInventory=(container,index,before,after)=>{undo.push(()=>container.setItem(index,before));container.setItem(index,after);};
 const writeEquipment=(equipment,index,before,after)=>{undo.push(()=>{if(equipment.setEquipment(index,before)!==true)throw Error('MILK_OFFHAND_ROLLBACK_REJECTED');});if(equipment.setEquipment(index,after)!==true)throw Error('MILK_OFFHAND_WRITE_REJECTED');};
 const next={...state,fluid:'kaleidoscope_world_liquor:milk_still'};
 try{
  commit(next);let delivery='CREATIVE';
  if(String(player.getGameMode()).toLowerCase()!=='creative'){
   const current=inventory.getItem(slot);
   if(!sameCapturedItem(current,held))throw Error('MILK_ORIGINAL_STACK_CHANGED');
   const bucket=createStack('minecraft:bucket',1);
   if(held.amount===1){writeInventory(inventory,slot,held,bucket);delivery='HAND';}
   else{
    const reduced=held.clone();reduced.amount--;writeInventory(inventory,slot,held,reduced);
    // Original calls player.addItem(bucket) without checking its return.
    // Do not invent Player.drop when a nonstandard stacked milk bucket is full.
    delivery=giveJavaInventoryItem(player,bucket,{writeInventory,writeEquipment,allowDrop:false});
   }
  }
  return {status:'FILLED',delivery,state:next};
 }catch(error){
  const failures=[];for(const revert of undo.reverse())try{revert();}catch(failure){failures.push(failure);}
  try{restore?.();}catch(failure){failures.push(failure);}
  if(failures.length)throw new AggregateError([error,...failures],'FREEZER_MILK_RECOVERY_FAILED');
  throw error;
 }
}
