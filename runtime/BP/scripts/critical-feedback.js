import {AcceptedHurtFeedback} from './accepted-hurt-feedback.js';
import {trackingAttempt,criticalSeed,JavaParticleRandom} from './critical-source.js';
/** Event-only feedback; no player simulation, UI transport or foreign state. */
export class CriticalFeedback {
 constructor(system,{randomFloat,randomDouble,spriteFloat,variables,delivery,report=error=>console.warn('[World Liquor critical particles] '+error)}={}){
  const seed=BigInt(Date.now()),tracking=new JavaParticleRandom(seed),noise=new JavaParticleRandom(seed^0x9e3779b97f4a7c15n),sprites=new JavaParticleRandom(seed^0x6a09e667f3bcc909n);
  this.system=system;this.randomFloat=randomFloat??(()=>tracking.nextFloat());this.randomDouble=randomDouble??(()=>noise.nextDouble());this.spriteFloat=spriteFloat??(()=>sprites.nextFloat());this.variables=variables;this.report=report;this.delivery=delivery??new AcceptedHurtFeedback(system,{report});this.bursts=new Map();
 }
 snapshot(target){const box=target.getAABB();return {x:target.location.x,y:target.location.y,z:target.location.z,width:box.extent.x*2,height:box.extent.y*2};}
 get pending(){return this.delivery.pending;}
 queue(event,sourcePlayer){
  const target=event.hurtEntity;
  // ServerPlayer.crit broadcasts in the source player's level. Clients there
  // cannot resolve a target entity ID from a different dimension.
  if(sourcePlayer&&sourcePlayer.dimension.id!==target.dimension.id)return;
  let row=this.bursts.get(event);if(row){row.emitters++;return;}
  row={target,dimension:target.dimension,last:this.snapshot(target),emitters:1};this.bursts.set(event,row);
  this.delivery.queue(event,accepted=>{
   this.bursts.delete(event);if(!accepted)return;
   this.frame(row);this.system.runTimeout(()=>this.frame(row),1);this.system.runTimeout(()=>this.frame(row),2);
  });
 }
 applied(event){this.delivery.applied(event);}
 frame(row){
  try{if(row.target.dimension.id===row.dimension.id)row.last=this.snapshot(row.target);}catch{/* Java emitter retains the removed client's last entity position. */}
  for(let emitter=0;emitter<row.emitters;emitter++)for(let i=0;i<16;i++){
   const attempt=trackingAttempt(row.last,this.randomFloat);if(!attempt)continue;
   const seed=criticalSeed(attempt.velocity,this.randomDouble,this.spriteFloat);if(!Object.values(seed.velocity).every(Number.isFinite))continue;
   try{const vars=this.variables();for(const axis of ['x','y','z'])vars.setFloat('variable.kwlc_v'+axis,seed.velocity[axis]);
    for(const [name,value]of Object.entries({gray:seed.color,size:seed.size,life:seed.lifetime}))vars.setFloat('variable.kwlc_'+name,value);
    row.dimension.spawnParticle('kaleidoscope_world_liquor:java_critical',attempt.at,vars);
   }catch(error){this.report(error);return;}
  }
 }
}
