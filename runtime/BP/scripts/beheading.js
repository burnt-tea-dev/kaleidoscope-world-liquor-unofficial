import {beheadingHeadId} from './beheading-head.js';

/** Java EventHandlers BEHEADED_MARKER: persistent entity data, so a beheaded
 * target that survived (totem) or was saved before dropping still drops a head. */
export const BEHEADED_MARKER='kaleidoscope_world_liquor:beheaded';
/** `kaleidoscope_world_liquor:bosses` entity-type tag: the three required vanilla
 * members. The optional modded members of that tag do not exist on Bedrock. */
export const BOSSES=Object.freeze(['minecraft:ender_dragon','minecraft:wither','minecraft:warden']);
/** onLivingIncomingDamage: 0.04 + amplifier * 0.03, evaluated in double. */
export function beheadingChance(amplifier){return .04+amplifier*.03;}
/** ItemStack.isSameItemSameComponents for the drop-list deduplication. */
export function sameHead(stack,head){return !!stack&&stack.typeId===head.typeId&&stack.isStackableWith(head);}

/** getEntityHead: class-specific vanilla heads, registry heads for other mobs, and
 * a player head bound to the victim. Java stores SkullOwner=profile name; Bedrock
 * has no scriptable skull owner, so the name is kept as the item name and lore. */
export function headFor(entity,{createStack,lookup}){
 const id=beheadingHeadId(entity.typeId,lookup);
 if(!id)return undefined;
 const head=createStack(id,1);
 if(entity.typeId==='minecraft:player'){
  const owner=String(entity.name??'');
  if(owner){head.nameTag=owner+"'s Head";head.setLore(['SkullOwner: '+owner]);}
 }
 return head;
}

export const beheadingDiagnostics={beheaded:0,forced:0,heads:0,deduplicated:0,errors:[]};
function failure(stage,error){
 beheadingDiagnostics.errors.push({stage,error:String(error)});
 if(beheadingDiagnostics.errors.length>16)beheadingDiagnostics.errors.shift();
}

/** Java EventHandlers beheading, in event order.
 * onLivingIncomingDamage: direct LivingEntity attacker with the effect, target not
 * in the bosses tag and alive, RANDOM.nextDouble() < chance => mark the target,
 * cancel the incoming damage and hurt it for 10000 with a player/mob attack source
 * attributed to the attacker. If the health did not drop (blocked), set 1, hurt 2,
 * and if still alive set 0 and die. BEHEADING_PROCESSING suppresses the roll
 * during that inner hurt. onLivingDropsBeheading: a marked entity's drop list
 * gets the head unless an identical head is already in it; the marker is cleared.
 * Bedrock keeps the attacker-attributed damage on the same before-event (10000 on
 * the direct hit), runs the blocked fallback on the next tick, and deduplicates
 * against the native death-drop list (entityItemDrop), spawning the head two ticks
 * after death when no drop list arrives (an entity with no drops).
 */
export function installBeheading(world,system,{createStack,lookup,random=Math.random}){
 const processing=new Set(),pending=new Map();
 const spawn=context=>{
  try{const entity=context.dimension.spawnItem(context.head,context.location);if(!entity)throw Error('HEAD_DROP_REJECTED');beheadingDiagnostics.heads++;}
  catch(error){failure('spawn',error);}
 };
 const fallback=(target,attacker,before)=>{
  try{
   if(target.isValid===false)return;
   const health=target.getComponent('minecraft:health');if(!health)return;
   const after=health.currentValue;
   if(!(Number.isNaN(after)||after>=before))return;
   beheadingDiagnostics.forced++;
   processing.add(target.id);
   try{
    health.setCurrentValue(1);
    target.applyDamage(2,{cause:'entityAttack',damagingEntity:attacker});
    if(target.isValid!==false&&target.getComponent('minecraft:health')?.currentValue>0)target.getComponent('minecraft:health').setCurrentValue(0);
   }finally{processing.delete(target.id);}
  }catch(error){failure('fallback',error);}
 };
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const context=pending.get(event.entity.id);
  if(!context)return;
  pending.delete(event.entity.id);
  try{
   const items=event.items;
   for(let index=0;index<items.length;index++){
    if(sameHead(items[index].getComponent('minecraft:item')?.itemStack,context.head)){beheadingDiagnostics.deduplicated++;return;}
   }
  }catch(error){failure('drops',error);}
  spawn(context);
 });
 return {
  /** The before-hurt branch. `effect` is the attacker's active beheading effect.
   * Returns true when this hit beheads (the event damage was raised to 10000). */
  incoming(event,attacker,target,effect){
   if(processing.has(target.id)||BOSSES.includes(target.typeId))return false;
   const health=target.getComponent('minecraft:health');
   if(!health||!(health.currentValue>0))return false;
   if(!(random()<beheadingChance(effect.amplifier)))return false;
   try{target.setDynamicProperty(BEHEADED_MARKER,true);}catch(error){failure('marker',error);}
   const before=health.currentValue;
   event.damage=10000;
   beheadingDiagnostics.beheaded++;
   system.run(()=>fallback(target,attacker,before));
   return true;
  },
  /** entityDie: resolve and queue the head for the native drop list. */
  death(event){
   const actor=event.deadEntity;
   let marked=false;
   try{marked=actor.getDynamicProperty(BEHEADED_MARKER)===true;}catch(error){failure('marker',error);}
   if(!marked)return false;
   try{actor.setDynamicProperty(BEHEADED_MARKER,undefined);}catch{}
   let head;
   try{head=headFor(actor,{createStack,lookup});}catch(error){failure('head',error);return false;}
   if(!head)return false;
   const context={head,dimension:actor.dimension,location:{...actor.location}};
   pending.set(actor.id,context);
   system.runTimeout(()=>{if(pending.get(actor.id)===context){pending.delete(actor.id);spawn(context);}},2);
   return true;
  },
 };
}
