/** Author NeoForge1.1.11 Player.crit and official MC1.21.1 TrackingEmitter/CritParticle. */
const f=Math.fround;
/** Private Java Random48 streams avoid consuming combat's Math.random. */
export class JavaParticleRandom {
 constructor(seed){this.seed=(BigInt(seed)^0x5deece66dn)&0xffffffffffffn;}
 bits(n){this.seed=(this.seed*0x5deece66dn+11n)&0xffffffffffffn;return Number(this.seed>>BigInt(48-n));}
 nextFloat(){return this.bits(24)/16777216;}
 nextDouble(){return (this.bits(26)*134217728+this.bits(27))/9007199254740992;}
}
export function trackingAttempt(box,randomFloat){
 const axis=()=>f(f(randomFloat()*2)-1),x=axis(),y=axis(),z=axis();
 if(x*x+y*y+z*z>1)return undefined;
 return {at:{x:box.x+x*box.width/4,y:box.y+box.height*(.5+y/4),z:box.z+z*box.width/4},velocity:{x,y:y+.2,z}};
}
export function criticalSeed(input,randomDouble,randomFloat){
 const noise=()=>((randomDouble()*2)-1)*f(.4),x=noise(),y=noise(),z=noise(),speed=(randomDouble()+randomDouble()+1)*f(.15),length=Math.sqrt(x*x+y*y+z*z);
 const base={x:(x/length)*speed*f(.4),y:(y/length)*speed*f(.4)+f(.1),z:(z/length)*speed*f(.4)};
 const velocity={x:base.x*f(.1)+input.x*.4,y:base.y*f(.1)+input.y*.4,z:base.z*f(.1)+input.z*.4};
 const color=f(randomDouble()*f(.3)+f(.6)),size=f(f(f(f(.1)*f(f(randomFloat()*f(.5))+f(.5)))*2)*f(.75));
 const lifetime=Math.max(Math.trunc(6/(randomDouble()*.8+.6)),1);
 return {velocity,color,size,lifetime};
}
