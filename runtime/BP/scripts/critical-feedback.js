import {trackingAttempt,criticalSeed,JavaParticleRandom} from './critical-source.js';
/** Event-only feedback; no player simulation, UI transport or foreign state. */
export class CriticalFeedback {
 constructor(system,{randomFloat,randomDouble,spriteFloat,variables,report=error=>console.warn('[World Liquor critical particles] '+error)}={}){
  const seed=BigInt(Date.now()),tracking=new JavaParticleRandom(seed),noise=new JavaParticleRandom(seed^0x9e3779b97f4a7c15n),sprites=new JavaParticleRandom(seed^0x6a09e667f3bcc909n);
  this.system=system;this.randomFloat=randomFloat??(()=>tracking.nextFloat());this.randomDouble=randomDouble??(()=>noise.nextDouble());this.spriteFloat=spriteFloat??(()=>sprites.nextFloat());this.variables=variables;this.report=report;this.pending=new Map();
 }
 snapshot(target){const box=target.getAABB();return {x:target.location.x,y:target.location.y,z:target.location.z,width:box.extent.x*2,height:box.extent.y*2};}
 queue(event){
  const id=event.hurtEntity.id,rows=this.pending.get(id)??[];let row=rows.find(r=>r.event===event);
  if(row){row.emitters++;return;}
  const source=event.damageSource;
  row={event,target:event.hurtEntity,dimension:event.hurtEntity.dimension,last:this.snapshot(event.hurtEntity),emitters:1,accepted:false,cause:source.cause,owner:source.damagingEntity?.id,projectile:source.damagingProjectile?.id};
  rows.push(row);this.pending.set(id,rows);this.system.run(()=>this.flush(row,id));
 }
 applied(event){
  const source=event.damageSource,rows=this.pending.get(event.hurtEntity.id)??[];
  const matches=rows.filter(row=>!row.accepted&&row.event.cancel!==true&&row.cause===source.cause&&row.owner===source.damagingEntity?.id&&row.projectile===source.damagingProjectile?.id);
  const row=matches.find(row=>Math.fround(row.event.damage)===Math.fround(event.damage))??matches[0];if(row)row.accepted=true;
 }
 flush(row,id){
  const rows=(this.pending.get(id)??[]).filter(r=>r!==row);if(rows.length)this.pending.set(id,rows);else this.pending.delete(id);
  if(!row.accepted||row.event.cancel===true)return;
  this.frame(row);this.system.runTimeout(()=>this.frame(row),1);this.system.runTimeout(()=>this.frame(row),2);
 }
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
