/** MC1.21.1 constructor expressions from Particle/SingleQuadParticle/CritParticle.
 * Numeric inputs only; no Minecraft players, renderer or simulated game. */
import java.util.Random;
public class JavaCriticalOracle {
 public static void main(String[] args){for(long seed:new long[]{0,1,123,4919,27964247,65535})for(double dy:new double[]{-.1,.2,1.2}){
  Random random=new Random(seed),sprite=new Random(seed^123L);double x=(random.nextDouble()*2-1)*(double).4f,y=(random.nextDouble()*2-1)*(double).4f,z=(random.nextDouble()*2-1)*(double).4f;
  double speed=(random.nextDouble()+random.nextDouble()+1)*(double).15f,length=Math.sqrt(x*x+y*y+z*z);
  double vx=x/length*speed*(double).4f*(double).1f,vy=(y/length*speed*(double).4f+(double).1f)*(double).1f+dy*.4,vz=z/length*speed*(double).4f*(double).1f;
  float gray=(float)(random.nextDouble()*(double).3f+(double).6f),size=.1f*(sprite.nextFloat()*.5f+.5f)*2*.75f;int lifetime=Math.max((int)(6/(random.nextDouble()*.8+.6)),1);
  System.out.println("{\"seed\":"+seed+",\"input\":{\"x\":0,\"y\":"+dy+",\"z\":0},\"expected\":{\"velocity\":{\"x\":"+vx+",\"y\":"+vy+",\"z\":"+vz+"},\"color\":"+(double)gray+",\"size\":"+(double)size+",\"lifetime\":"+lifetime+"}}");
 }}
}
