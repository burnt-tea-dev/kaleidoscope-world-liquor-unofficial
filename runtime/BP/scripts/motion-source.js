/** Current NeoForge 1.1.11 BoatMixin/LivingEntityMixin numeric rules. */
export function boatingVelocity(velocity,amplifier,forward){
 let {x,y,z}=velocity;
 if(forward){
  const bonus=Math.min(Math.fround(Math.fround(amplifier)*Math.fround(.2)),1);
  const multiplier=Math.fround(Math.fround(1.3)+bonus);x*=multiplier;z*=multiplier;
  const speed=Math.sqrt(x*x+z*z);if(speed>1.2){const ratio=1.2/speed;x*=ratio;z*=ratio;}
 }else if(x*x+z*z>1e-4){x*=Math.fround(.85);z*=Math.fround(.85);}
 return {x,y,z};
}

/** The measured native impulse is added after gravity/levitation and drag.
 * Compensate that order for the default living-entity physics; don't overwrite
 * horizontal movement. Player collision/input/render fidelity is separate.
 */
export function reverseGravityImpulse({velocityY,flying,water,lava,levitation,slowFalling}){
 if(flying||water||lava)return undefined;
 if(levitation!==undefined){
  const nativeBase=(velocityY+(.05*(levitation+1)-velocityY)*.2)*.98;
  return -.05*(levitation+1)-nativeBase;
 }
 const boost=slowFalling?.09:.16;
 const nativeGravity=slowFalling&&velocityY<0?.01:.08;
 const sourceGravity=slowFalling&&velocityY+boost<=0?.01:.08;
 return (boost+nativeGravity-sourceGravity)*.98;
}

/** Source client tick state, not an unconditional button-event air jump. */
export function multiJumpStep(previous,input){
 if(!input.effect)return {remaining:0,pressed:false,jump:false};
 let remaining=previous?.remaining??0;
 if(input.ground||input.climbing)remaining=input.amplifier+1;
 const eligible=!input.elytra&&!input.gliding&&!input.riding&&!input.water&&!input.levitation;
 const falling=input.reverse?input.velocityY>0:input.velocityY<0;
 const jump=eligible&&!input.ground&&!previous?.pressed&&remaining>0&&falling&&input.pressed&&!input.flying;
 if(jump)remaining--;
 return {remaining,pressed:input.pressed,jump};
}

const sinTable=new Float32Array(65536);
for(let i=0;i<sinTable.length;i++)sinTable[i]=Math.sin(i*Math.PI*2/65536);
function sin(angle){return sinTable[Math.trunc(Math.fround(angle*Math.fround(10430.378)))&65535];}
function cos(angle){return sinTable[Math.trunc(Math.fround(Math.fround(angle*Math.fround(10430.378))+16384))&65535];}
export function sourceJumpVelocity({reverse,jumpFactor=1,jumpBoost,sprinting,yaw=0}){
 const boost=jumpBoost===undefined?0:Math.fround(Math.fround(.1)*(jumpBoost+1));
 const power=Math.fround(Math.fround(Math.fround(.42)*Math.fround(jumpFactor))+boost);
 const angle=Math.fround(Math.fround(yaw)*Math.fround(Math.PI/180));
 const sprintFactor=reverse?Math.fround(.2):.2;
 return {x:sprinting?(reverse?Math.fround(-sin(angle)*sprintFactor):-sin(angle)*sprintFactor):0,y:reverse?-power:power,z:sprinting?(reverse?Math.fround(cos(angle)*sprintFactor):cos(angle)*sprintFactor):0};
}
export function nativeJumpImpulse(velocity,target,{slowFalling=false,lava=false}={}){
 const nativeGravity=slowFalling&&velocity.y<0?.01:.08;
 const sourceGravity=slowFalling&&target.y<=0?.01:.08;
 if(lava)return {x:target.x*.5,y:(target.y-velocity.y)*.5+(nativeGravity-sourceGravity)/4,z:target.z*.5};
 return {x:target.x*.91,y:(target.y-velocity.y+nativeGravity-sourceGravity)*.98,z:target.z*.91};
}
