import {luckBonus,luckHolder} from './luck-loot.js';

/** Java EventHandlers.onLivingDrops (NeoForge 1.21.1 author 1.1.12): when the
 * damage source's owner entity has Treasure Guide, one nextDouble() against
 * 0.15 + amplifier * 0.05 decides for the whole death; on success every entry of
 * the drop list is copied into a new ItemEntity at that entry's position with the
 * default pickup delay. Bedrock reads the same list from the native entityItemDrop
 * event of the dying entity instead of scanning nearby items one tick later. */
export function treasureDropChance(amplifier){return Math.min(.15+amplifier*.05,1);}
export const treasureDropDiagnostics={deaths:0,duplicated:0,errors:[]};
function failure(error){
 treasureDropDiagnostics.errors.push({error:String(error)});
 if(treasureDropDiagnostics.errors.length>16)treasureDropDiagnostics.errors.shift();
}
/** Luck modifies loot before LivingDrops sees it. Own the native death cohort
 * once, so Treasure Guide also copies those new types without copying copies.
 * Mining, chest and fishing contexts are not inferred from this death event.
 */
export function installDeathDrops(world,system,{read,killCredit,random=Math.random}){
 const pending=new Map();
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const context=pending.get(event.entity.id);
  if(!context)return;
  pending.delete(event.entity.id);
  try{
   // Java copies a snapshot of the list, so the added copies are not copied again.
   const items=event.items,drops=[],extra=[];
   for(let index=0;index<items.length;index++){
    const stack=items[index].getComponent('minecraft:item')?.itemStack;
    if(!stack||stack.amount<=0||stack.typeId==='minecraft:air')continue;
    drops.push({stack:stack.clone(),location:{...(items[index].location??context.location)}});
   }
   if(context.luckAmplifier!==undefined)try{
    const manager=world.getLootTableManager();
    for(const stack of luckBonus(drops.map(drop=>drop.stack),context.luckAmplifier,()=>manager.generateLootFromEntity(event.entity,context.tool),random)){
     const drop={stack,location:context.location};drops.push(drop);extra.push(drop);
    }
   }catch(error){failure(error);}
   // Snapshot before spawning: native callbacks must never add our own copies
   // to this death's original cohort, even if spawnItem dispatches immediately.
   if(context.treasure)for(const drop of drops)extra.push({stack:drop.stack.clone(),location:drop.location,treasure:true});
   for(const copy of extra){
    const entity=context.dimension.spawnItem(copy.stack,copy.location);
    if(!entity)throw Error('TREASURE_DROP_REJECTED');
    if(copy.treasure)treasureDropDiagnostics.duplicated++;
   }
  }catch(error){failure(error);}
 });
 world.afterEvents.entityRemove.subscribe(event=>pending.delete(event.removedEntityId));
 return {
  /** Capture both effects for one death; Treasure rolls once for the whole list. */
  death(event){
   const actor=event.deadEntity,source=event.damageSource??{},attacker=source.damagingEntity;
   let holder,row;
   try{
    const credit=killCredit.state(actor.id);
    const lastDamagePlayer=credit.player&&system.currentTick-credit.playerTick<=100?world.getEntity(credit.player):undefined;
    holder=luckHolder({lastDamagePlayer,attackingEntity:attacker,directAttackingEntity:source.damagingProjectile??attacker,thisEntity:actor},read);
    if(attacker)row=read(attacker).treasure_guide;
   }catch(error){failure(error);return false;}
   const treasure=!!row&&random()<treasureDropChance(row.amplifier);
   if(!holder&&!treasure)return false;
   const context={dimension:actor.dimension,location:{...actor.location},luckAmplifier:holder?.effect.amplifier,treasure};
   if(holder)context.tool=attacker?.getComponent('minecraft:equippable')?.getEquipment('Mainhand')?.clone();
   pending.set(actor.id,context);if(treasure)treasureDropDiagnostics.deaths++;
   system.runTimeout(()=>{if(pending.get(actor.id)===context)pending.delete(actor.id);},2);
   return true;
  },
 };
}
