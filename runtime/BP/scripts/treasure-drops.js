/** Java EventHandlers.onLivingDrops (NeoForge 1.21.1 author 1.1.11): when the
 * damage source's owner entity has Treasure Guide, one nextDouble() against
 * 0.15 + amplifier * 0.05 decides for the whole death; on success every entry of
 * the drop list is copied into a new ItemEntity at that entry's position with the
 * default pickup delay. Bedrock reads the same list from the native entityItemDrop
 * event of the dying entity instead of scanning nearby items one tick later. */
export function treasureDropChance(amplifier){return .15+amplifier*.05;}
export const treasureDropDiagnostics={deaths:0,duplicated:0,errors:[]};
function failure(error){
 treasureDropDiagnostics.errors.push({error:String(error)});
 if(treasureDropDiagnostics.errors.length>16)treasureDropDiagnostics.errors.shift();
}
export function installTreasureDrops(world,system,{read,random=Math.random}){
 const pending=new Map();
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const context=pending.get(event.entity.id);
  if(!context)return;
  pending.delete(event.entity.id);
  try{
   // Java copies a snapshot of the list, so the added copies are not copied again.
   const items=event.items,copies=[];
   for(let index=0;index<items.length;index++){
    const stack=items[index].getComponent('minecraft:item')?.itemStack;
    if(!stack||stack.amount<=0||stack.typeId==='minecraft:air')continue;
    copies.push({stack:stack.clone(),location:{...(items[index].location??context.location)}});
   }
   for(const copy of copies){
    const entity=context.dimension.spawnItem(copy.stack,copy.location);
    if(!entity)throw Error('TREASURE_DROP_REJECTED');
    treasureDropDiagnostics.duplicated++;
   }
  }catch(error){failure(error);}
 });
 return {
  /** entityDie: roll once for this death when the source owner has the effect. */
  death(event){
   const actor=event.deadEntity,attacker=event.damageSource?.damagingEntity;
   if(!attacker)return false;
   let row;
   try{row=read(attacker).treasure_guide;}catch(error){failure(error);return false;}
   if(!row||!(random()<treasureDropChance(row.amplifier)))return false;
   const context={dimension:actor.dimension,location:{...actor.location}};
   pending.set(actor.id,context);treasureDropDiagnostics.deaths++;
   system.runTimeout(()=>{if(pending.get(actor.id)===context)pending.delete(actor.id);},2);
   return true;
  },
 };
}
