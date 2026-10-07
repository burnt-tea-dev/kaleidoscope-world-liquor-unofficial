/** Independently evaluated official MC1.21.1 Player/LivingEntity.eat expressions. */
public class JavaBottledAudioOracle {
 public static void main(String[] args){
  float[] values={0f,1f/16777216f,.1f,.3333333f,.7f,Math.nextDown(1f)};
  for(int i=0;i<values.length;i++)values[i]=(float)Math.floor(values[i]*16777216d)/16777216f;
  for(float value:values)System.out.println("{\"kind\":\"burp\",\"first\":"+value+",\"expected\":"+(value*.1f+.9f)+"}");
  for(float first:values)for(float second:values)System.out.println("{\"kind\":\"eating\",\"first\":"+first+",\"second\":"+second+",\"expected\":"+(1f+(first-second)*.4f)+"}");
 }
}
