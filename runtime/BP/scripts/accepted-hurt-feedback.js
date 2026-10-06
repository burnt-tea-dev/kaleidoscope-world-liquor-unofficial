/** One accepted-hurt decision shared by audio and particle feedback.
 * Native before-hurt can still be canceled/rejected by later handlers/engine.
 * This queue never changes damage, health, inventory or persistent state.
 */
function valid(row){try{return row.event.cancel!==true;}catch{return false;}}
export class AcceptedHurtFeedback {
 constructor(system,{report=error=>console.warn('[World Liquor accepted feedback] '+error)}={}){this.system=system;this.report=report;this.pending=new Map();}
 queue(event,callback){
  const id=event.hurtEntity.id,rows=this.pending.get(id)??[];let row=rows.find(r=>r.event===event);
  if(row){row.callbacks.push(callback);return;}
  const source=event.damageSource;
  row={event,callbacks:[callback],accepted:false,cause:source.cause,owner:source.damagingEntity?.id,projectile:source.damagingProjectile?.id};
  rows.push(row);this.pending.set(id,rows);this.system.run(()=>this.flush(row,id));
 }
 applied(event){
  const source=event.damageSource,rows=this.pending.get(event.hurtEntity.id)??[];
  const matches=rows.filter(row=>!row.accepted&&valid(row)&&row.cause===source.cause&&row.owner===source.damagingEntity?.id&&row.projectile===source.damagingProjectile?.id);
  const row=matches.find(row=>Math.fround(row.event.damage)===Math.fround(event.damage))??matches[0];if(row)row.accepted=true;
 }
 flush(row,id){
  const rows=(this.pending.get(id)??[]).filter(r=>r!==row);if(rows.length)this.pending.set(id,rows);else this.pending.delete(id);
  const accepted=row.accepted&&valid(row);
  for(const callback of row.callbacks)try{callback(accepted);}catch(error){this.report(error);}
 }
}
