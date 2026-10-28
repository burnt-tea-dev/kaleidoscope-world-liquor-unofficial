import {javaFloatRoll} from './combat-source.js';

/** NeoForge1.1.12 LuckLootModifier: each successful reroll adds new item types.
 * Keep the native ItemStack, including its complete opaque metadata.
 */
export function luckBonus(initial,amplifier,reroll,random=Math.random){
 const seen=new Set();
 for(let index=0;index<initial.length;index++)seen.add(initial[index].typeId);
 const bonus=[];
 for(let attempt=0;attempt<Math.min(amplifier+1,5);attempt++){
  if(javaFloatRoll(random())>=.25)continue;
  const stacks=reroll();
  for(let index=0;index<(stacks?.length??0);index++){
   const stack=stacks[index];
   if(!stack||stack.amount<=0||stack.typeId==='minecraft:air'||seen.has(stack.typeId))continue;
   seen.add(stack.typeId);bonus.push(stack.clone());
  }
 }
 return bonus;
}

export function luckHolder(context,read){
 for(const actor of [context.lastDamagePlayer,context.attackingEntity,context.directAttackingEntity,context.fishingOwner??context.thisEntity]){
  if(!actor)continue;
  const effect=read(actor).luck;
  if(effect)return {actor,effect};
 }
}

/** Native death/drop events give the original stacks and the still-valid actor.
 * Other loot contexts are not guessed from nearby items or container contents.
 */
export function installLuckLoot(world,system,read,killCredit,{random=Math.random}={}){
 const deaths=new Map();
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const actor=event.entity,context=deaths.get(actor.id);
  if(!context)return;
  deaths.delete(actor.id);
  try{
   // BDS1.26.60's native drop array has no Symbol.iterator. Capture it once.
   const entities=event.items,initial=[];
   for(let index=0;index<entities.length;index++){
    const stack=entities[index].getComponent('minecraft:item')?.itemStack;
    if(stack)initial.push(stack.clone());
   }
   const manager=world.getLootTableManager();
   const bonus=luckBonus(initial,context.amplifier,()=>manager.generateLootFromEntity(actor,context.tool),random);
   for(const stack of bonus)actor.dimension.spawnItem(stack,context.location);
  }catch(error){console.warn('[World Liquor Luck] '+error);}
 });
 world.afterEvents.entityRemove.subscribe(event=>deaths.delete(event.removedEntityId));
 return {
  death(event){
   const actor=event.deadEntity,source=event.damageSource??{},credit=killCredit.state(actor.id);
   let lastDamagePlayer;
   if(credit.player&&system.currentTick-credit.playerTick<=100)lastDamagePlayer=world.getEntity(credit.player);
   const attacker=source.damagingEntity;
   const context={lastDamagePlayer,attackingEntity:attacker,directAttackingEntity:source.damagingProjectile??attacker,thisEntity:actor};
   const holder=luckHolder(context,read);if(!holder)return;
   context.amplifier=holder.effect.amplifier;context.location={...actor.location};
   context.tool=attacker?.getComponent('minecraft:equippable')?.getEquipment('Mainhand')?.clone();
   deaths.set(actor.id,context);
   system.runTimeout(()=>{if(deaths.get(actor.id)===context)deaths.delete(actor.id);},2);
  }
 };
}
