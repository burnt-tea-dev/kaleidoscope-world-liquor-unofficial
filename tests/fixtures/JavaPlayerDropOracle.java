/** Official Minecraft 1.21.1 Player.drop(stack,false,false) directional branch
 * and Mth lookup expressions. Standalone arithmetic, not a game simulation. */
public class JavaPlayerDropOracle {
 static final float[] SIN=new float[65536];
 static {for(int i=0;i<SIN.length;i++)SIN[i]=(float)Math.sin(i*Math.PI*2.0/65536.0);}
 static float sin(float a){return SIN[(int)(a*10430.378f)&65535];}
 static float cos(float a){return SIN[(int)(a*10430.378f+16384.0f)&65535];}
 public static void main(String[] args){
  float last=1.0f-1.0f/16777216.0f;
  float[][] cases={{0,0,0,0},{.5f,.5f,.5f,.5f},{last,last,last,0},{.125f,.75f,.25f,.875f},{.875f,.25f,.75f,.125f}};
  for(float yaw:new float[]{-1080,-180,-97.5f,0,37.7f,90,179.9f,1080})for(float pitch:new float[]{-90,-89.9f,-45,0,45,89.9f,90})for(float[] r:cases){
   float sinPitch=sin(pitch*((float)Math.PI/180)),cosPitch=cos(pitch*((float)Math.PI/180));
   float sinYaw=sin(yaw*((float)Math.PI/180)),cosYaw=cos(yaw*((float)Math.PI/180));
   float angle=r[0]*((float)Math.PI*2),radius=.02f*r[1];
   double x=(double)(-sinYaw*cosPitch*.3f)+Math.cos(angle)*(double)radius;
   double y=(double)(-sinPitch*.3f+.1f+(r[2]-r[3])*.1f);
   double z=(double)(cosYaw*cosPitch*.3f)+Math.sin(angle)*(double)radius;
   System.out.println("{\"yaw\":"+(double)yaw+",\"pitch\":"+(double)pitch+",\"rolls\":["+(double)r[0]+","+(double)r[1]+","+(double)r[2]+","+(double)r[3]+"],\"expected\":{\"x\":"+x+",\"y\":"+y+",\"z\":"+z+"}}");
  }
 }
}
