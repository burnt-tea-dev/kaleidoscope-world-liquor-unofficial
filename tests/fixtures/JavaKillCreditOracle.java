/** Primitive source-state oracle, not Minecraft actors or a simulated game.
 * Minecraft 1.21.1 LivingEntity.getKillCredit/baseTick/hurt + NeoForge's
 * LivingDamage.Pre placement inside actuallyHurt, before hurt updates credit.
 */
public class JavaKillCreditOracle {
 static String player,mob;static int timer,mobTick,now;static boolean mobAlive=true;
 static String credit(){return player!=null?player:mob;}
 static void reset(String scenario){player=null;mob=null;timer=0;mobTick=0;now=0;mobAlive=true;System.out.println("{\"op\":\"reset\",\"scenario\":\""+scenario+"\"}");}
 static String string(String s){return s==null?"null":"\""+s+"\"";}
 static void hurt(String owner,String kind,boolean accepted){
  String before=credit();
  if(accepted&&owner!=null){mob=owner;mobTick=now;mobAlive=true;
   if(kind.equals("player")){player=owner;timer=100;}
   else if(kind.equals("tame")){player="P";timer=100;}
   else if(kind.equals("ownerless_tame")){player=null;timer=100;}
  }
  System.out.println("{\"op\":\"hurt\",\"owner\":"+string(owner)+",\"kind\":\""+kind+"\",\"accepted\":"+accepted+",\"now\":"+now+",\"before\":"+string(before)+",\"after\":"+string(credit())+"}");
 }
 static void advance(int ticks){for(int i=0;i<ticks;i++){now++;if(timer>0)timer--;else player=null;if(mob!=null&&(!mobAlive||now-mobTick>100))mob=null;}
  System.out.println("{\"op\":\"advance\",\"ticks\":"+ticks+",\"now\":"+now+",\"credit\":"+string(credit())+"}");
 }
 public static void main(String[] args){
  reset("previous-attacker");hurt("A","mob",true);hurt(null,"environment",true);hurt("B","mob",true);hurt(null,"environment",true);advance(100);advance(1);
  reset("player-priority");hurt("P","player",true);advance(50);hurt("A","mob",true);advance(50);advance(1);advance(50);
  reset("cancelled-incoming");hurt("A","mob",true);hurt("B","mob",false);hurt(null,"environment",true);
  reset("tame-owner");hurt("pet","tame",true);hurt("A","mob",true);hurt("pet","ownerless_tame",true);advance(101);
 }
}
