import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CriticalFeedback} from '../runtime/BP/scripts/critical-feedback.js';
import {JavaParticleRandom,criticalSeed,trackingAttempt} from '../runtime/BP/scripts/critical-source.js';
const rows=fs.readFileSync(new URL('./fixtures/java-critical.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('private particle Random48, initial floats and velocities match Java numeric evaluation',()=>{
 for(const row of rows){const r=new JavaParticleRandom(row.seed),f=new JavaParticleRandom(BigInt(row.seed)^123n);const got=criticalSeed(row.input,()=>r.nextDouble(),()=>f.nextFloat());assert.deepEqual(got,row.expected);}
});
function fixture(){let now=0,gone=false;const queue=[],particles=[],failures=[],dimension={id:'overworld',spawnParticle:(id,at,vars)=>particles.push({id,at:{...at},vars})};
 const target={id:'target',location:{x:1,y:20,z:3},getAABB:()=>{if(gone)throw Error('removed');return {extent:{x:.3,y:.9,z:.3}};},get dimension(){if(gone)throw Error('removed');return dimension;}};
 const system={run:fn=>queue.push({at:now+1,fn}),runTimeout:(fn,n)=>queue.push({at:now+n,fn})};
 const feedback=new CriticalFeedback(system,{randomFloat:()=>.5,randomDouble:()=>.25,spriteFloat:()=>.5,variables:()=>({setFloat(key,value){this[key]=value;}}),report:error=>failures.push(error)});
 const event={hurtEntity:target,damage:6,cancel:false,damageSource:{cause:'entityAttack',damagingEntity:{id:'owner'}}};
 const advance=()=>{now++;const ready=queue.filter(r=>r.at<=now);ready.forEach(r=>queue.splice(queue.indexOf(r),1));ready.forEach(r=>r.fn());};
 return {feedback,event,target,particles,failures,advance,remove:()=>gone=true};
}
test('accepted critical tracks target dimensions/position for exactly three frames',()=>{
 const f=fixture();f.feedback.queue(f.event);f.feedback.applied(f.event);f.advance();assert.equal(f.particles.length,16);assert.deepEqual(f.particles[0].at,{x:1,y:20.9,z:3});
 f.target.location.x=5;f.advance();assert.equal(f.particles.length,32);assert.equal(f.particles[16].at.x,5);f.advance();f.advance();assert.equal(f.particles.length,48);assert.equal(f.feedback.pending.size,0);assert.deepEqual(f.failures,[]);
});
test('later cancellation and native hurt rejection emit nothing and release their queue',()=>{
 for(const mode of ['cancel','native-rejected']){const f=fixture();f.feedback.queue(f.event);if(mode==='cancel'){f.feedback.applied(f.event);f.event.cancel=true;}f.advance();f.advance();assert.equal(f.particles.length,0);assert.equal(f.feedback.pending.size,0);}
});
test('source ground crit plus double damage retain two emitter calls, and removal retains last position',()=>{
 const f=fixture();f.feedback.queue(f.event);f.feedback.queue(f.event);f.feedback.applied(f.event);f.advance();assert.equal(f.particles.length,32);f.remove();f.advance();f.advance();assert.equal(f.particles.length,96);assert.deepEqual(f.particles[95].at,f.particles[0].at);assert.deepEqual(f.failures,[]);
});
test('sphere rejection is not a fixed sixteen-particle burst',()=>{
 const box={x:0,y:0,z:0,width:2,height:4};assert.equal(trackingAttempt(box,()=>0),undefined);assert.deepEqual(trackingAttempt(box,()=>.5),{at:{x:0,y:2,z:0},velocity:{x:0,y:.2,z:0}});
});
