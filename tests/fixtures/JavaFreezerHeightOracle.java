public class JavaFreezerHeightOracle {
 public static void main(String[] args) {
  for (int max : new int[]{0,1,3,7}) for(int count : new int[]{1,2,3,7,8}) {
   float topY=0.625f,bottomY=0.3125f,dropRange=topY-bottomY;
   float ratio=max>0?Math.min(1.0f,(float)count/(float)max):1.0f;
   float y=bottomY+dropRange*ratio;
   System.out.println("{\"count\":"+count+",\"max\":"+max+",\"expected\":"+Double.toString((double)y)+"}");
  }
 }
}
