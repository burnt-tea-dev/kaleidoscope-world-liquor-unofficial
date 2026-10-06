import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {boatingVelocity,sourceJumpVelocity,reverseGravityImpulse,nativeJumpImpulse} from '../runtime/BP/scripts/motion-source.js';
const rows=fs.readFileSync(new URL('./fixtures/java-motion.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('boat and jump numeric results agree with current Java source oracle',()=>{
 for(const r of rows){const got=r.kind==='boat'?boatingVelocity({x:r.speed,y:.17,z:r.speed*.5},r.amp,r.forward):sourceJumpVelocity({reverse:r.reverse,yaw:r.yaw,jumpFactor:r.factor,jumpBoost:r.jump<0?undefined:r.jump,sprinting:true});assert.deepEqual(got,r.expected,JSON.stringify(r));}
 assert.equal(rows.length,92);
});
test('boat brake cutoff preserves tiny movement and all modes preserve vertical speed',()=>{
 const v={x:.01,y:-.23,z:0};assert.deepEqual(boatingVelocity(v,0,false),v);assert.equal(boatingVelocity({...v,x:.01001},0,false).x,.01001*Math.fround(.85));
 for(const amp of [0,5,255])assert.equal(boatingVelocity({x:2,y:-.23,z:2},amp,true).y,-.23);
});
test('reverse liquid/flying skips and levitation tail do not stack the source head boost',()=>{
 for(const flag of ['water','lava','flying'])assert.equal(reverseGravityImpulse({velocityY:-.2,[flag]:true}),undefined);
 for(const v of [-.2,0,.3])for(const amp of [0,2]){const base=(v+(.05*(amp+1)-v)*.2)*.98;assert.ok(Math.abs(base+reverseGravityImpulse({velocityY:v,levitation:amp})+.05*(amp+1))<1e-15);}
 assert.equal(reverseGravityImpulse({velocityY:0,slowFalling:true}),.08819999999999999);
 assert.ok(Math.abs(reverseGravityImpulse({velocityY:-.2,slowFalling:true})-.0882)<1e-15);
 assert.ok(Math.abs(reverseGravityImpulse({velocityY:-.05,slowFalling:true})-.0196)<1e-15);
});
test('air jump replaces falling Y and handles native strict-negative slow-fall boundary',()=>{
 const target=sourceJumpVelocity({reverse:false});for(const v of [-.2,0,.3]){
  const impulse=nativeJumpImpulse({x:.1,y:v,z:.2},target,{slowFalling:true}),gravity=v<0?.01:.08;
  assert.ok(Math.abs((v-gravity)*.98+impulse.y-(target.y-.08)*.98)<1e-15);
 }
});
