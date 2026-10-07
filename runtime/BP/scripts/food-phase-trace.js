// Real-client evidence only. No inventory/effect writes and no simulated use.
const FOODS=new Set(['liangshan_ice_cone','kita_stuffed_crisp','pochi_pudding','magic_crispy_corner'].map(id=>'kaleidoscope_world_liquor:'+id));
const ID='kaleidoscope_world_liquor:food_phase_trace';
let scheduler,enabled=false,deadline=0,remaining=0,sequence=0;
const actors=new Map();
function emit(row){try{console.warn('[World Liquor food phase] '+JSON.stringify(row));}catch{}}
function active(){return enabled&&remaining>0&&scheduler.currentTick<=deadline;}
function stack(row){return row?{kind:FOODS.has(row.typeId)?row.typeId:row.typeId==='minecraft:bowl'?'minecraft:bowl':'other',amount:row.amount}:null;}
function snapshot(player){
 const inventory=player.getComponent('minecraft:inventory')?.container;
 if(!inventory)return {inventory:'unavailable'};
 let bowls=0;for(let slot=0;slot<inventory.size;slot++){const item=inventory.getItem(slot);if(item?.typeId==='minecraft:bowl')bowls+=item.amount;}
 const offhand=player.getComponent('minecraft:equippable')?.getEquipment('Offhand');
 return {selected:player.selectedSlotIndex,hand:stack(inventory.getItem(player.selectedSlotIndex)),bowls,offhand:stack(offhand),mode:String(player.getGameMode())};
}
export function traceFoodPhase(phase,event){
 if(!active()||!FOODS.has(event.itemStack?.typeId)||event.source?.typeId!=='minecraft:player')return;
 try{
  const actor=event.source;if(!actors.has(actor.id)){if(actors.size>=8)return;actors.set(actor.id,actors.size+1);}
  const label=actors.get(actor.id),use=stack(event.itemStack),id=++sequence;
  const record=(observed)=>{if(!active())return;remaining--;emit({id,actor:label,phase:observed,tick:scheduler.currentTick,event:use,...snapshot(actor)});};
  record(phase);
  if(phase==='consume')scheduler.run(()=>{try{record('consume_next_tick');}catch(error){emit({id,phase:'consume_next_tick',unavailable:String(error).slice(0,160)});}});
 }catch(error){emit({phase,unavailable:String(error).slice(0,160)});}
}
export function installFoodPhaseTrace(system,serverSource){
 if(scheduler)return; scheduler=system;
 system.afterEvents.scriptEventReceive.subscribe(event=>{
  if(event.id!==ID||event.sourceType!==serverSource||event.sourceEntity!==undefined||event.sourceBlock!==undefined||event.initiator!==undefined)return;
  if(event.message==='stop'){enabled=false;actors.clear();emit({state:'stopped'});return;}
  if(event.message!=='start')return;
  enabled=true;deadline=system.currentTick+2400;remaining=64;sequence=0;actors.clear();
  emit({state:'started',expiresTick:deadline,maxRows:64,maxActors:8});
  const thisDeadline=deadline;
  system.runTimeout(()=>{if(enabled&&deadline===thisDeadline){enabled=false;actors.clear();emit({state:'expired'});}},2401);
 });
}
