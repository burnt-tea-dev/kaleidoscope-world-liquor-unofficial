/** Self-written expression oracle from official1.21.1 Player mapped bytecode.
 * No Mojang implementation or libraries redistributed.
 */
public class JavaPlayerChargeOracle {
 public static void main(String[] args){
  for(double speed:new double[]{0,.6,1.1,1.6,3.2,4,4.4,1024})
   for(int ticker:new int[]{Integer.MIN_VALUE,-1,0,1,2,3,10,20,100,Integer.MAX_VALUE}){
    float delay=(float)((1.0/speed)*20.0);
    float scale=Math.max(0F,Math.min(1F,((float)ticker+.5F)/delay));
    String delayJson=Float.isInfinite(delay)?"\"Infinity\"":Float.toString(delay);
    System.out.println("{\"speed\":"+speed+",\"ticker\":"+ticker+",\"delay\":"+delayJson+",\"scale\":"+scale+",\"sprintBonus\":"+(scale>.9F)+"}");
   }
 }
}
