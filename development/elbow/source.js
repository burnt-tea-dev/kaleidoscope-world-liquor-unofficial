/** Original NeoForge 1.1.11 SMCEffect plus Mojang 1.21.1 attack/knockback facts.
 * Development source core only. No native additive-force adapter is installed.
 */
const SIN=new Float32Array(65536);
for(let i=0;i<SIN.length;i++)SIN[i]=Math.sin(i*Math.PI*2/65536);
const f=Math.fround;
const sin=a=>SIN[(Math.trunc(f(a*f(10430.378))))&65535];
const cos=a=>SIN[(Math.trunc(f(f(a*f(10430.378))+f(16384))))&65535];
function finite(value){if(!Number.isFinite(value))throw Error('SOURCE_INPUT_REQUIRED');return value;}
export function elbowModifier(amplifier){
 if(!Number.isInteger(amplifier)||amplifier<0)throw Error('SOURCE_AMPLIFIER_REQUIRED');
 return 1*(amplifier+1);
}
/** Caller must supply the actual ordered modifier collections, not inferred native defaults. */
export function attackAttribute({base,addValues=[],addMultipliedBase=[],addMultipliedTotal=[]}){
 let added=finite(base);for(const amount of addValues)added+=finite(amount);
 let value=added;for(const amount of addMultipliedBase)value+=added*finite(amount);
 for(const amount of addMultipliedTotal)value*=1+finite(amount);
 return Math.max(0,Math.min(5,value));
}
export function attackKnockbackPlan({actorKind,yaw,knockbackAfterEnchantments,successfulAttack,sprinting=false,attackStrengthScale}){
 if(!successfulAttack)return undefined;
 if(!['player','mob'].includes(actorKind))throw Error('SOURCE_ATTACK_CLASS_REQUIRED');
 const sprintBonus=actorKind==='player'&&sprinting&&f(finite(attackStrengthScale))>f(.9)?1:0;
 const attack=f(f(knockbackAfterEnchantments)+sprintBonus);
 if(!(finite(attack)>0))return undefined;
 const angle=f(f(finite(yaw))*f(Math.PI/180));
 return {strength:f(attack*f(.5)),direction:{x:sin(angle),z:-cos(angle)},attackerXZMultiplier:.6,clearSprint:actorKind==='player'};
}
/** target velocity immediately at original LivingEntity.knockback entry, not before hurt. */
export function livingKnockback({velocity,ground,resistance,strength,direction}){
 const effective=finite(strength)*(1-finite(resistance));
 if(!(effective>0))return {velocity:{...velocity},applied:false};
 const x=finite(direction.x),z=finite(direction.z),length=Math.sqrt(x*x+z*z);
 // Original random-direction loop is irrelevant for the attack's nonzero Mth yaw vector.
 if(x*x+z*z<Number(9.999999747378752e-6))throw Error('SOURCE_RANDOM_DIRECTION_REQUIRED');
 return {velocity:{x:finite(velocity.x)/2-x/length*effective,
  y:ground?Math.min(.4,finite(velocity.y)/2+effective):finite(velocity.y),
  z:finite(velocity.z)/2-z/length*effective},applied:true};
}
export function attackerAfterKnockback(velocity){return {x:finite(velocity.x)*.6,y:finite(velocity.y),z:finite(velocity.z)*.6};}
