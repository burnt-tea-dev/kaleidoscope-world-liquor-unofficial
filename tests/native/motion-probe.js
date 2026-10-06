import {world,system} from '@minecraft/server';
import {reverseGravityImpulse,nativeJumpImpulse,sourceJumpVelocity} from './motion-source.js';
import {lavaContact} from './liquid-contact.js';
const out=(kind,row)=>console.log('[MOTION_QA] '+JSON.stringify({kind,...row})),tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
world.afterEvents.worldLoad.subscribe(()=>{const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 80 0 3 motion_qa');system.runTimeout(async()=>{try{
 for(const mode of ['reverse','slowReverse','levReverse','airJump','slowAirJump','deepLavaJump']){
  d.runCommand('fill -2 70 -2 2 105 2 air');if(mode==='deepLavaJump')d.runCommand('fill -2 70 -2 2 105 2 lava');
  const mob=d.spawnEntity('motion_qa:mover',{x:0,y:90,z:0});if(mode.startsWith('slow'))mob.addEffect('slow_falling',600);if(mode==='levReverse')mob.addEffect('levitation',600);await tick(3);mob.clearVelocity();await tick(1);
  for(let i=0;i<5;i++){
   const v=mob.getVelocity(),p={...mob.location},lava=lavaContact(mob);let impulse,expected;
   if(mode.includes('Reverse')||mode==='reverse'){
    impulse={x:0,y:reverseGravityImpulse({velocityY:v.y,levitation:mode==='levReverse'?0:undefined,slowFalling:mode==='slowReverse',lava,water:false,flying:false}),z:0};
    if(mode==='levReverse')expected=-.05;else {const boost=mode==='slowReverse'?.09:.16,gravity=mode==='slowReverse'&&v.y+boost<=0?.01:.08;expected=(v.y+boost-gravity)*.98;}
   }
   if(mode.includes('Jump')&&i===0){const target=sourceJumpVelocity({reverse:false,sprinting:true,yaw:90});impulse=nativeJumpImpulse(v,target,{slowFalling:mode==='slowAirJump',lava});expected=mode==='deepLavaJump'?target.y*.5-.02:(target.y-.08)*.98;}
   if(impulse)mob.applyImpulse(impulse);await tick(1);const nextV=mob.getVelocity();
   out('sample',{mode,step:i,v,p,lava,impulse,expected,nextV,nextP:mob.location});
   if(expected!==undefined&&Math.abs(nextV.y-expected)>2e-5)throw Error(mode+' native velocity differs '+nextV.y+' / '+expected);
   if(lava!==(mode==='deepLavaJump'))throw Error('Lava API contact mismatch in '+mode);
  }mob.remove();
 }out('done',{players:world.getAllPlayers().length});
}catch(e){out('failure',{error:String(e),stack:e.stack});}},30);});
