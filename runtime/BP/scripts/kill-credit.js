/** Minecraft 1.21.1 transient kill credit, read before the current hurt updates it.
 * NeoForge LivingDamage.Pre runs inside actuallyHurt; hurt updates credit later.
 * Nothing here is persisted or written to another pack's dynamic properties.
 */
export function isLivingCombatEntity(actor){
 try{return !!actor?.getComponent?.('minecraft:health')&&(actor.typeId==='minecraft:player'||actor.typeId==='minecraft:armor_stand'||actor.getComponent('minecraft:type_family')?.hasTypeFamily('mob')===true);}catch{return false;}
}
export function damageCreditMutation(source){
 try{
  const actor=source.damagingEntity,player=actor?.typeId==='minecraft:player';
  // Native hurt also fires for health-bearing vehicles; Java's hook is LivingEntity.
  if(!isLivingCombatEntity(actor))return undefined;
  const tame=actor.getComponent('minecraft:tameable');
  return {mob:actor.id,playerChanged:player||tame?.isTamed===true,
   player:player?actor.id:tame?.isTamed?(tame.tamedToPlayerId??tame.tamedToPlayer?.id):undefined};
 }catch{return undefined;}
}

export class JavaKillCredit {
 constructor({now,resolve}){this.now=now;this.resolve=resolve;this.states=new Map();this.pending=new Map();this.sequence=0;}
 valid(row){try{return row.event.cancel!==true;}catch{return false;}}
 apply(state,row){
  const next={...state,sequence:row.sequence,mob:row.mutation.mob,mobTick:row.tick};
  if(row.mutation.playerChanged){next.player=row.mutation.player;next.playerTick=row.tick;}
  return next;
 }
 state(id,through=Infinity,confirmed=false){
  let state=this.states.get(id)??{};
  for(const row of this.pending.get(id)??[])if(row.sequence>(state.sequence??0)&&row.sequence<=through&&this.valid(row)&&(!confirmed||row.accepted))state=this.apply(state,row);
  return state;
 }
 previous(id){
  const state=this.state(id),now=this.now();
  if(state.player&&now-state.playerTick<=100)return this.resolve(state.player);
  if(state.mob&&now-state.mobTick<=100)try{const mob=this.resolve(state.mob);if(mob?.getComponent('minecraft:health')?.currentValue>0)return mob;}catch{}
 }
 begin(id,event,mutation){
  if(!mutation||event.cancel===true)return undefined;
  const source=event.damageSource??{};
  const row={id,event,mutation,tick:this.now(),sequence:++this.sequence,
   cause:source.cause,owner:source.damagingEntity?.id,projectile:source.damagingProjectile?.id,accepted:false};
  const rows=this.pending.get(id)??[];rows.push(row);this.pending.set(id,rows);return row;
 }
 applied(event){
  const source=event.damageSource,rows=this.pending.get(event.hurtEntity.id)??[];
  const matches=rows.filter(row=>!row.accepted&&this.valid(row)&&row.cause===source.cause&&row.owner===source.damagingEntity?.id&&row.projectile===source.damagingProjectile?.id);
  const row=matches.find(row=>Math.fround(row.event.damage)===Math.fround(event.damage))??matches[0];
  if(row)row.accepted=true;
 }
 complete(row){
  if(!row)return;
  const rows=this.pending.get(row.id);if(!rows?.includes(row))return;
  // The live before-event wrapper retains the final cancel flag. Folding the
  // bounded pending queue also preserves multiple successful hurts in one tick.
  const state=this.state(row.id,row.sequence,true);
  if(state.sequence)this.states.set(row.id,state);
  const remaining=rows.filter(other=>other.sequence>row.sequence);
  if(remaining.length)this.pending.set(row.id,remaining);else this.pending.delete(row.id);
 }
 forget(id){this.states.delete(id);this.pending.delete(id);}
 prune(){
  const now=this.now();
  for(const [id,state] of this.states)if(!this.pending.has(id)&&now-Math.max(state.mobTick??-Infinity,state.playerTick??-Infinity)>100)this.states.delete(id);
 }
}
