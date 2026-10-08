package org.senluo.oracle;
import java.lang.reflect.*;
public class FrostLightOracle {
 static Class<?> c(String n)throws Exception{return Class.forName(n);}
 static Object call(String type,String name,Object target,Class<?>[] types,Object...args)throws Exception{return c(type).getMethod(name,types).invoke(target,args);}
 public static void main(String[] args)throws Exception{
  call("ab","a",null,new Class<?>[0]);call("akt","a",null,new Class<?>[0]);
  Object block=c("dga").getField("kI").get(null),state=call("dfy","o",block,new Class<?>[0]),empty=c("dcl").getField("a").get(null),pos=c("jd").getConstructor(int.class,int.class,int.class).newInstance(0,0,0);
  Object light=call("dtb$a","b",state,new Class<?>[]{c("dcc"),c("jd")},empty,pos);
  System.out.println("FROST_LIGHT_BLOCK="+light);
 }
}
