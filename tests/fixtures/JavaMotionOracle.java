/** Current NeoForge 1.1.11 BoatMixin/LivingEntityMixin and official MC1.21.1
 * jumpFromGround/Mth numeric expressions; no Minecraft player simulation. */
public class JavaMotionOracle {
 static final float[] SIN=new float[65536];
 static {for(int i=0;i<SIN.length;i++)SIN[i]=(float)Math.sin(i*Math.PI*2.0/65536.0);}
 static float sin(float a){return SIN[(int)(a*10430.378f)&65535];}
 static float cos(float a){return SIN[(int)(a*10430.378f+16384.0f)&65535];}
 public static void main(String[] args){
  for(int amp:new int[]{0,2,5,255})for(boolean forward:new boolean[]{false,true})for(double speed:new double[]{.001,.01,.3,2}){
   double x=speed,y=.17,z=speed*.5;
   if(forward){float multiplier=1.3f+Math.min((float)amp*.2f,1.0f);x*=multiplier;z*=multiplier;double current=Math.sqrt(x*x+z*z);if(current>1.2){double k=1.2/current;x*=k;z*=k;}}
   else if(x*x+z*z>1e-4){x*=.85f;z*=.85f;}
   System.out.println("{\"kind\":\"boat\",\"amp\":"+amp+",\"forward\":"+forward+",\"speed\":"+speed+",\"expected\":{\"x\":"+x+",\"y\":"+y+",\"z\":"+z+"}}");
  }
  for(boolean reverse:new boolean[]{false,true})for(float yaw:new float[]{0,37.7f,90,180,-97.5f})for(float factor:new float[]{1,.5f})for(int jump:new int[]{-1,0,2}){
   float power=.42f*factor+(jump<0?0:.1f*((float)jump+1)),angle=yaw*((float)Math.PI/180);
   double x=reverse?(double)(-sin(angle)*.2f):-sin(angle)*.2,z=reverse?(double)(cos(angle)*.2f):cos(angle)*.2;
   System.out.println("{\"kind\":\"jump\",\"reverse\":"+reverse+",\"yaw\":"+(double)yaw+",\"factor\":"+factor+",\"jump\":"+jump+",\"expected\":{\"x\":"+x+",\"y\":"+(double)(reverse?-power:power)+",\"z\":"+z+"}}");
  }
 }
}
