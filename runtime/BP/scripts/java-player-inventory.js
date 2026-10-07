/** Single-item Java Inventory.add ordering shared by bottle and freezer output.
 * Hooks journal actual writes, not a planned parallel inventory implementation.
 */
export function giveJavaInventoryItem(player,item,{writeInventory,writeEquipment,recordDrop,allowDrop=true}={}){
 if(item.amount!==1)throw Error('EXPECTED_SINGLE_INVENTORY_ITEM');
 const inventory=player.getComponent('minecraft:inventory').container;
 const write=(slot,before,after)=>writeInventory?writeInventory(inventory,slot,before,after):inventory.setItem(slot,after);
 const room=stack=>!!stack&&stack.amount<stack.maxAmount&&stack.isStackableWith(item);
 const merge=slot=>{const stack=inventory.getItem(slot);if(!room(stack))return false;const before=stack.clone();stack.amount++;write(slot,before,stack);return true;};
 if(merge(player.selectedSlotIndex))return 'INVENTORY';
 const equipment=player.getComponent('minecraft:equippable'),offhand=equipment?.getEquipment('Offhand');
 if(room(offhand)){
  const before=offhand.clone();offhand.amount++;
  if(writeEquipment)writeEquipment(equipment,'Offhand',before,offhand);
  else if(equipment.setEquipment('Offhand',offhand)!==true)throw Error('OFFHAND_ITEM_WRITE_REJECTED');
  return 'OFFHAND';
 }
 for(let slot=0;slot<inventory.size;slot++)if(merge(slot))return 'INVENTORY';
 for(let slot=0;slot<inventory.size;slot++)if(!inventory.getItem(slot)){write(slot,undefined,item);return 'INVENTORY';}
 if(!allowDrop)return 'UNINSERTED';
 // Item count is preserved; exact Player.drop(false) physics/eye position,
 // thrower, packet and pickup delay remain explicit platform gaps.
 const entity=player.dimension.spawnItem(item,player.location);
 if(!entity)throw Error('PLAYER_ITEM_DROP_REJECTED');recordDrop?.(entity);return 'DROP';
}
