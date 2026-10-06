import {world,system} from '@minecraft/server';
import {installEffects} from './effects.js';
import {AcceptedHurtFeedback} from './accepted-hurt-feedback.js';
import {createFoundationClient} from './sdk/tavern-foundation-client.js';
const NS='kaleidoscope_world_liquor',out=(kind,row)=>console.log('[HURT_FEEDBACK_QA] '+JSON.stringify({kind,...row})),tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
createFoundationClient(system,world,{source:NS,furniture:[],legacyEffectKey:'hurt_feedback_qa:legacy'},()=>true,{log:console.log});
const deliveries=[],canceled=new Set();let current;
const original=AcceptedHurtFeedback.prototype.queue;
// Observe production callback decisions, then run the original callback/Native
// playSound. No fake players, fake effect classification or mocked damage.
AcceptedHurtFeedback.prototype.queue=function(event,callback){return original.call(this,event,accepted=>{deliveries.push({accepted,cause:event.damageSource.cause,victim:event.hurtEntity.id});callback(accepted);});};
world.afterEvents.worldLoad.subscribe(()=>{installEffects();world.beforeEvents.entityHurt.subscribe(event=>{if(canceled.has(event.hurtEntity.id))event.cancel=true;});const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 2 hurt_feedback_qa');system.runTimeout(async()=>{try{
 const a=d.spawnEntity('senluo_combat_qa:r0',{x:0,y:80,z:0});
 const refresh=rows=>system.sendScriptEvent('kaleidoscope_tavern:effect_snapshot',JSON.stringify({source:NS,entity:a.id,sequence:system.currentTick,parts:1,part:0,rows}));
 for(const mode of ['accepted-elbow','canceled-elbow','rejected-elbow','accepted-double','canceled-double']){
  current=d.spawnEntity('senluo_combat_qa:r0',{x:4,y:80,z:0});refresh([{id:NS+':elbow_strike',ticks:600,amplifier:0}]);await tick(3);
  if(mode==='rejected-elbow'){current.applyDamage(4,{cause:'entityAttack',damagingEntity:a});await tick(6);}
  if(mode.includes('double')){current.applyDamage(4,{cause:'entityAttack',damagingEntity:a});await tick(20);refresh([{id:NS+':double_damage',ticks:600,amplifier:4}]);await tick(3);}
  if(mode.startsWith('canceled'))canceled.add(current.id);const at=deliveries.length,before=current.getComponent('minecraft:health').currentValue;
  current.applyDamage(4,mode.includes('double')?{cause:'fire'}:{cause:'entityAttack',damagingEntity:a});await tick(4);
  const rows=deliveries.slice(at);out('case',{mode,acceptedFeedback:rows.filter(row=>row.accepted).length,rejectedFeedback:rows.filter(row=>!row.accepted).length,damage:before-current.getComponent('minecraft:health').currentValue});canceled.delete(current.id);current.remove();current=undefined;
 }a.remove();out('done',{players:world.getAllPlayers().length});
}catch(error){out('failure',{error:String(error),stack:error.stack});}},30);});
