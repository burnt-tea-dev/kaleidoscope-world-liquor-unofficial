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
