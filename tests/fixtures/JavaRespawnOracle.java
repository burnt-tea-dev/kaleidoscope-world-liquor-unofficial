/** Numeric/selection oracle for the reviewed official Minecraft 1.21.1
 * bytecode expressions. It does not run players, collision or a game world. */
import java.util.Arrays;
public class JavaRespawnOracle {
 static final float[] SIN=new float[65536];
 static final double[] ASIN=new double[257],COS=new double[257];
 static final double BIAS=Double.longBitsToDouble(4805340802404319232L);
 static {for(int i=0;i<SIN.length;i++)SIN[i]=(float)Math.sin(i*Math.PI*2/65536);for(int i=0;i<ASIN.length;i++){ASIN[i]=Math.asin(i/256.0);COS[i]=Math.cos(ASIN[i]);}}
 static float sin(float v){return SIN[(int)(v*10430.378f)&65535];}
 static float cos(float v){return SIN[(int)(v*10430.378f+16384f)&65535];}
 static double atan(double y,double x){
  double squared=x*x+y*y;if(Double.isNaN(squared))return Double.NaN;
  boolean ny=y<0,nx=x<0,swapped;
  if(ny)y=-y;if(nx)x=-x;swapped=y>x;if(swapped){double temporary=x;x=y;y=temporary;}
  double half=.5*squared;
  long bits=6910469410427058090L-(Double.doubleToRawLongBits(squared)>>1);
  double inv=Double.longBitsToDouble(bits);inv*=1.5-half*inv*inv;x*=inv;y*=inv;
  double snapped=BIAS+y;int index=(int)Double.doubleToRawLongBits(snapped);
  double residual=y*COS[index]-x*(snapped-BIAS);
  double result=ASIN[index]+(6+residual*residual)*residual*.16666666666666666;
  if(swapped)result=Math.PI/2-result;if(nx)result=Math.PI-result;if(ny)result=-result;return result;
 }
 static float yaw(double px,double py,double pz){
  double x=.5-px,y=-py,z=.5-pz,length=Math.sqrt(x*x+y*y+z*z);
  if(length<1e-4){x=y=z=0;}else{x/=length;y/=length;z/=length;}
  double angle=atan(z,x)*57.2957763671875-90;angle%=360;if(angle>=180)angle-=360;if(angle< -180)angle+=360;return(float)angle;
 }
 static int[][] offsets(int fx,int fz,float yaw){
  int sx=-fz,sz=fx;float radians=yaw*.017453292f;
  if((float)sx*-sin(radians)+(float)sz*cos(radians)>0){sx=-sx;sz=-sz;}
  return new int[][]{{sx,sz},{sx-fx,sz-fz},{sx-2*fx,sz-2*fz},{-2*fx,-2*fz},{-sx-2*fx,-sz-2*fz},{-sx-fx,-sz-fz},{-sx,-sz},{-sx+fx,-sz+fz},{fx,fz},{sx+fx,sz+fz},{0,0},{-fx,-fz}};
 }
 static String array(int[][] values){return Arrays.deepToString(values);}
 public static void main(String[] args){
  String[] names={"north","east","south","west"};int[][] direction={{0,-1},{1,0},{0,1},{-1,0}};
  for(int d=0;d<4;d++)for(float angle:new float[]{0,90,-90,180,37.7f,179.99998f,Float.MAX_VALUE})
   System.out.println("{\"kind\":\"bed\",\"facing\":\""+names[d]+"\",\"angle\":"+(double)angle+",\"expected\":"+array(offsets(direction[d][0],direction[d][1],angle))+"}");
  for(double[] position:new double[][]{{.5,0,-.5},{1.5,0,.5},{-.5,0,-.5},{2.25,.5625,-3.4},{.5,0,.5},{.5,1,.5},{.500001,0,.500001},{1e5,12,-1e5}})
   System.out.println("{\"kind\":\"yaw\",\"position\":{"+"\"x\":"+position[0]+",\"y\":"+position[1]+",\"z\":"+position[2]+"},\"expected\":"+(double)yaw(position[0],position[1],position[2])+"}");
  for(int radius:new int[]{0,1,2,8,25,Integer.MAX_VALUE})for(double distance:new double[]{0,1.9999,100,1e10}){
   int r=Math.max(0,radius),border=(int)Math.floor(distance);if(border<r)r=border;if(border<=1)r=1;
   int width=r*2+1;long square=(long)width*width;int count=square>Integer.MAX_VALUE?Integer.MAX_VALUE:(int)square,step=count<=16?count-1:17;
   int start=count/2,size=Math.min(count,40);int[][] columns=new int[size][2];
   for(int i=0;i<size;i++){int index=(start+step*i)%count;columns[i][0]=index%width-r;columns[i][1]=index/width-r;}
   System.out.println("{\"kind\":\"columns\",\"radius\":"+radius+",\"distance\":"+distance+",\"start\":"+start+",\"expectedPlan\":{\"radius\":"+r+",\"width\":"+width+",\"count\":"+count+",\"step\":"+step+"},\"expected\":"+array(columns)+"}");
  }
 }
}
