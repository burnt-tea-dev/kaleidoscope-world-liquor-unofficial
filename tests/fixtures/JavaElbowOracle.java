/** Self-written numeric oracle from original SMCEffect/Player/Mob/LivingEntity bytecode.
 * No source implementation, official JAR or third-party library redistributed.
 */
public class JavaElbowOracle {
 static final float[] SIN=new float[65536];
 static {for(int i=0;i<SIN.length;i++)SIN[i]=(float)Math.sin(i*Math.PI*2/65536.0);}
 static float sin(float a){return SIN[(int)(a*10430.378f)&65535];}
 static float cos(float a){return SIN[(int)(a*10430.378f+16384.0f)&65535];}
 public static void main(String[] args){
  for(String actor:new String[]{"player","mob"})for(int amp:new int[]{0,1,4,5,255})
   for(float yaw:new float[]{0,90,180,-90,12.345f,-721.23f})for(double resistance:new double[]{0,.5,1})for(boolean ground:new boolean[]{false,true}){
    double attribute=Math.max(0,Math.min(5,1.0*(amp+1)));float attack=(float)attribute;
    float strength=attack*.5f,angle=yaw*((float)Math.PI/180.0f);
    double dx=sin(angle),dz=-cos(angle),effective=strength*(1-resistance),length=Math.sqrt(dx*dx+dz*dz);
    double x=.2,y=.3,z=-.4;
    if(effective>0){x=x/2-dx/length*effective;y=ground?Math.min(.4,y/2+effective):y;z=z/2-dz/length*effective;}
    System.out.println("{\"actor\":\""+actor+"\",\"amplifier\":"+amp+",\"yaw\":"+yaw+",\"resistance\":"+resistance+",\"ground\":"+ground+",\"attribute\":"+attribute+",\"strength\":"+strength+",\"direction\":{\"x\":"+dx+",\"z\":"+dz+"},\"velocity\":{\"x\":"+x+",\"y\":"+y+",\"z\":"+z+"}}");
   }
 }
}
