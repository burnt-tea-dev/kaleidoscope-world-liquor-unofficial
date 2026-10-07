package org.senluo.oracle;

import com.google.gson.*;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.function.Predicate;

/** Source-derived numeric data only; the untouched Mojang classes perform every query. */
public final class VanillaShapeCatalogOracle {
 static final Class<?>[] NONE=VanillaShapeOracle.NONE;
 static Class<?> c(String name)throws Exception{return VanillaShapeOracle.c(name);}
 static Object call(String type,String name,Object target,Class<?>[] types,Object...args)throws Exception{return VanillaShapeOracle.call(type,name,target,types,args);}
 static Object field(String type,String name)throws Exception{return VanillaShapeOracle.field(type,name);}
 static Map<String,String> properties(Object state)throws Exception{return VanillaShapeOracle.properties(state);}
 static String key(String id,Map<String,String> properties){
  if(properties.isEmpty())return id;
  List<String> parts=new ArrayList<>();for(var e:properties.entrySet())parts.add(e.getKey()+"="+e.getValue());return id+"["+String.join(",",parts)+"]";
 }
 static final int STURDY_UP=1,PLAYER_DANGEROUS=2,CLIMBABLE=4,NONEMPTY_FLUID=8,MOTION_BLOCKING=16,IS_SOLID=32,INVALID_SPAWN_INSIDE=64,BLOCKS_MOTION=128,DYNAMIC=256;
 static <T> int intern(T value,List<T> pool,Map<T,Integer> index){Integer previous=index.get(value);if(previous!=null)return previous;int at=pool.size();pool.add(value);index.put(value,at);return at;}
 @SuppressWarnings("unchecked")
 public static void main(String[]args)throws Exception{
  if(args.length!=2)throw new IllegalArgumentException("client.jar output.json");
  PrintStream original=System.out;call("ab","a",null,NONE);call("akt","a",null,NONE);VanillaShapeOracle.bindVanillaBlockTags(args[0]);
  Object registry=field("lt","e"),fluidRegistry=field("lt","c"),empty=field("dcl","a"),position=c("jd").getConstructor(int.class,int.class,int.class).newInstance(0,0,0),context=call("exh","a",null,NONE),up=field("ji","b"),player=field("bsx","by"),climbableTag=field("awe","aQ"),invalidSpawnTag=field("awe","cr");
  Predicate<Object> motionBlocking=(Predicate<Object>)call("dyy$a","e",field("dyy$a","e"),NONE);
  Class<?>[] shapeTypes={c("dcc"),c("jd"),c("exh")},supportTypes={c("dcc"),c("jd"),c("ji")},tagTypes={c("awu")},stateTypes={c("dtc")};
  List<List<List<Double>>> shapes=new ArrayList<>();Map<List<List<Double>>,Integer> shapeIndex=new HashMap<>();
  List<Map<String,Object>> fluids=new ArrayList<>();Map<Map<String,Object>,Integer> fluidIndex=new HashMap<>();
  Map<String,List<Integer>> staticStates=new TreeMap<>(),dynamicStates=new TreeMap<>();
  Map<String,Map<String,Object>> blocks=new TreeMap<>();List<Map<String,String>> errors=new ArrayList<>();int stateCount=0;
  for(Object block:(Iterable<?>)registry){
   String id=call("jz","b",registry,new Class<?>[]{Object.class},block).toString();boolean dynamic=(Boolean)call("dfy","p",block,NONE);
   List<?> states=(List<?>)call("dtd","a",call("dfy","l",block,NONE),NONE);Map<String,Set<String>> domains=new TreeMap<>();
   for(Object state:states)for(var e:properties(state).entrySet())domains.computeIfAbsent(e.getKey(),k->new TreeSet<>()).add(e.getValue());
   String defaultKey=key(id,properties(call("dfy","o",block,NONE)));
   blocks.put(id,Map.of("default_key",defaultKey,"properties",domains,"state_count",states.size(),"dynamic_shape",dynamic));
   for(Object state:states){
    String stateKey=key(id,properties(state));stateCount++;
    int collision=-1;try{collision=intern(VanillaShapeOracle.boxes(call("dtb$a","b",state,shapeTypes,empty,position,context)),shapes,shapeIndex);}catch(Exception ex){errors.add(Map.of("key",stateKey,"stage","collision","error",ex.toString()));}
    boolean sturdy=false;try{sturdy=(Boolean)call("dtb$a","d",state,supportTypes,empty,position,up);}catch(Exception ex){errors.add(Map.of("key",stateKey,"stage","sturdy_up","error",ex.toString()));}
    Object fluid=call("dtb$a","u",state,NONE),fluidType=call("epe","a",fluid,NONE);
    Map<String,Object> fluidRecord=new TreeMap<>();fluidRecord.put("id",call("jz","b",fluidRegistry,new Class<?>[]{Object.class},fluidType).toString());fluidRecord.put("states",properties(fluid));fluidRecord.put("source",call("epe","b",fluid,NONE));fluidRecord.put("empty",call("epe","c",fluid,NONE));
    int fluidAt=intern(fluidRecord,fluids,fluidIndex);boolean nonempty=!(Boolean)fluidRecord.get("empty"),blocksMotion=(Boolean)call("dtb$a","d",state,NONE),opaque=motionBlocking.test(state);
    if(opaque!=(blocksMotion||nonempty))throw new IllegalStateException("heightmap source predicate mismatch "+stateKey);
    int flags=(sturdy?STURDY_UP:0)|((Boolean)call("bsx","a",player,stateTypes,state)?PLAYER_DANGEROUS:0)|((Boolean)call("dtb$a","a",state,tagTypes,climbableTag)?CLIMBABLE:0)|(nonempty?NONEMPTY_FLUID:0)|(opaque?MOTION_BLOCKING:0)|((Boolean)call("dtb$a","e",state,NONE)?IS_SOLID:0)|((Boolean)call("dtb$a","a",state,tagTypes,invalidSpawnTag)?INVALID_SPAWN_INSIDE:0)|(blocksMotion?BLOCKS_MOTION:0)|(dynamic?DYNAMIC:0);
    Map<String,List<Integer>> destination=dynamic?dynamicStates:staticStates;
    if(destination.put(stateKey,List.of(collision,flags,fluidAt))!=null)throw new IllegalStateException("duplicate state key "+stateKey);
   }
  }
  if(blocks.size()!=1060||stateCount!=26684||staticStates.size()+dynamicStates.size()!=26684)throw new IllegalStateException("source registry scope changed");
  long dynamicBlocks=blocks.values().stream().filter(b->Boolean.TRUE.equals(b.get("dynamic_shape"))).count();
  Map<String,Object> result=new LinkedHashMap<>();result.put("schema",1);result.put("source",Map.of("minecraft","1.21.1","object","https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar","mappings","https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt","runtime_modified",false,"credit","Mojang Studios / Minecraft 1.21.1; generated numeric facts via original class methods, no third-party implementation source copied"));
  result.put("scope",Map.of("blocks",blocks.size(),"states",stateCount,"static_states",staticStates.size(),"dynamic_states",dynamicStates.size(),"dynamic_blocks",dynamicBlocks,"builtin_block_tags",VanillaShapeOracle.tagValues.size()));
  result.put("collision_context",Map.of("block_getter","EmptyBlockGetter (air neighbors, no block entities)","position",List.of(0,0,0),"collision_context","CollisionContext.empty()","dynamic_shapes","observed only in this context; MUST NOT treat as fixed shapes for arbitrary source worlds"));
  result.put("row_layout",List.of("collision_shape_index","flags","fluid_state_index"));result.put("flag_bits",Map.of("sturdy_up",STURDY_UP,"player_block_dangerous",PLAYER_DANGEROUS,"climbable",CLIMBABLE,"nonempty_fluid",NONEMPTY_FLUID,"motion_blocking",MOTION_BLOCKING,"is_solid",IS_SOLID,"invalid_spawn_inside",INVALID_SPAWN_INSIDE,"blocks_motion",BLOCKS_MOTION,"dynamic_shape",DYNAMIC));result.put("blocks",blocks);result.put("shapes",shapes);result.put("fluids",fluids);result.put("static_states",staticStates);result.put("dynamic_states",dynamicStates);result.put("errors",errors);
  try(Writer out=Files.newBufferedWriter(Path.of(args[1]))){new GsonBuilder().disableHtmlEscaping().create().toJson(result,out);out.write("\n");}
  original.println("SHAPE_CATALOG_OK blocks="+blocks.size()+" states="+stateCount+" static="+staticStates.size()+" dynamic="+dynamicStates.size()+" dynamicBlocks="+dynamicBlocks+" shapes="+shapes.size()+" fluids="+fluids.size()+" errors="+errors.size());
  if(!errors.isEmpty())throw new IllegalStateException("source query errors; review export before using");
 }
}
