/** Current source predicates transcribed from World Liquor NeoForge 1.1.11
 * EventHandlers.isVanillaCrit, DamageEvents, DoubleDamageEffect and official
 * Minecraft 1.21.1 LivingEntity.shouldTriggerItemUseEffects bytecode.
 * Plain numeric/boolean fixtures; no Minecraft player or game simulation.
 */
public class JavaUseCombatOracle {
    public static void main(String[] args) {
        for (int flags=0; flags<32; flags++) for (double y : new double[]{-.25,0,.1}) {
            boolean ground=(flags&1)!=0,climb=(flags&2)!=0,water=(flags&4)!=0,blind=(flags&8)!=0,riding=(flags&16)!=0;
            boolean expected=!ground&&!climb&&!water&&!blind&&!riding&&y<0;
            System.out.println("{\"kind\":\"crit\",\"flags\":"+flags+",\"y\":"+y+",\"expected\":"+expected+"}");
        }
        for (int amp=0; amp<=10; amp++) for (float health:new float[]{16.0001f,20f,37.75f}) {
            float fraction=0.4f-(float)amp*0.05f;
            if(fraction<0.05f)fraction=0.05f;
            float cap=health*fraction,chance=0.2f+(float)amp*0.2f;
            System.out.println("{\"kind\":\"damage\",\"amplifier\":"+amp+",\"health\":"+health+",\"cap\":"+cap+",\"chance\":"+chance+"}");
        }
        for (int duration:new int[]{1,16,32,48}) for(int remaining=duration;remaining>0;remaining--) {
            int used=duration-remaining;
            int threshold=(int)((float)duration*0.21875f);
            boolean expected=used>threshold&&remaining%4==0;
            System.out.println("{\"kind\":\"use\",\"duration\":"+duration+",\"remaining\":"+remaining+",\"expected\":"+expected+"}");
        }
    }
}
