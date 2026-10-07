import {giveJavaInventoryItem} from './java-player-inventory.js';

/** Current source input settlement for the existing compact ID layout. The
 * caller still rejects unrepresentable metadata; this is not native storage.
 */
export function insertFreezerInput(player,state,{commit,restore}={}){
 if(state.output>0||state.remaining>0||state.input.length>=4)return {status:'UNAVAILABLE'};
 const inventory=player.getComponent('minecraft:inventory').container,slot=player.selectedSlotIndex,held=inventory.getItem(slot);
 if(!held)return {status:'EMPTY_HAND'};
 const next={...state,input:[...state.input,held.typeId]};let written=false;
 try{
  // Java stores the one-item copy before shrinking the captured stack, even
  // in Creative. Do not route this through a Creative-aware fluid transaction.
  commit(next);
  const current=inventory.getItem(slot);
  if(!current||current.typeId!==held.typeId||current.amount!==held.amount||!current.isStackableWith(held))throw Error('FREEZER_INPUT_ORIGIN_CHANGED');
  const reduced=held.amount===1?undefined:held.clone();if(reduced)reduced.amount--;
  written=true;inventory.setItem(slot,reduced);
  return {status:'INSERTED',state:next};
 }catch(error){
  const failures=[];
  if(written)try{inventory.setItem(slot,held);}catch(failure){failures.push(failure);}
  try{restore?.();}catch(failure){failures.push(failure);}
  if(failures.length)throw new AggregateError([error,...failures],'FREEZER_INPUT_RECOVERY_FAILED');
  throw error;
 }
}

export function extractFreezerInput(player,state,{createStack,commit,restore}={}){
 if(!state.input.length)return {status:'EMPTY'};
 const next={...state,input:state.input.slice(0,-1)},item=createStack(state.input.at(-1),1),undo=[];
 const writeInventory=(container,slot,before,after)=>{undo.push(()=>container.setItem(slot,before));container.setItem(slot,after);};
 const writeEquipment=(equipment,slot,before,after)=>{undo.push(()=>{if(equipment.setEquipment(slot,before)!==true)throw Error('FREEZER_INPUT_OFFHAND_ROLLBACK_REJECTED');});if(equipment.setEquipment(slot,after)!==true)throw Error('OFFHAND_ITEM_WRITE_REJECTED');};
 try{
  // Original removes the last occupied slot before unchecked player.addItem.
  // Its false return is ignored: no fabricated ground item or full warning.
  commit(next);
  const delivery=giveJavaInventoryItem(player,item,{writeInventory,writeEquipment,allowDrop:false});
  return {status:'EXTRACTED',delivery,state:next};
 }catch(error){
  const failures=[];for(const revert of undo.reverse())try{revert();}catch(failure){failures.push(failure);}
  try{restore?.();}catch(failure){failures.push(failure);}
  if(failures.length)throw new AggregateError([error,...failures],'FREEZER_INPUT_RECOVERY_FAILED');
  throw error;
 }
}
