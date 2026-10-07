package org.senluo.oracle;

import com.google.gson.*;
import java.io.*;
import java.lang.reflect.*;
import java.nio.file.*;
import java.util.*;
import java.util.zip.*;

/** Calls the untouched Mojang 1.21.1 classes. No client, entity or world is created. */
public final class VanillaShapeOracle {
 static Class<?> c(String name) throws Exception{return Class.forName(name);}
 static Object field(String type,String name) throws Exception{return c(type).getField(name).get(null);}
 static Object call(String type,String name,Object target,Class<?>[] types,Object... args) throws Exception{return c(type).getMethod(name,types).invoke(target,args);}
 static final Class<?>[] NONE=new Class<?>[0];
 static Map<String,Set<String>> tagValues=new TreeMap<>();
 static Set<String> resolveTag(String name,Map<String,JsonArray> raw,Set<String> visiting){
  if(tagValues.containsKey(name))return tagValues.get(name);
  if(!visiting.add(name))throw new IllegalArgumentException("tag cycle "+name);
  JsonArray values=raw.get(name);if(values==null)throw new IllegalArgumentException("missing tag "+name);
  Set<String> out=new TreeSet<>();
  for(JsonElement entry:values){String id=entry.isJsonObject()?entry.getAsJsonObject().get("id").getAsString():entry.getAsString();if(id.startsWith("#"))out.addAll(resolveTag(id.substring(1),raw,visiting));else out.add(id);}
  visiting.remove(name);tagValues.put(name,out);return out;
 }
 static void bindVanillaBlockTags(String jar) throws Exception {
  Map<String,JsonArray> raw=new TreeMap<>();
  try(ZipFile z=new ZipFile(jar)){
   for(ZipEntry e:Collections.list(z.entries()))if(e.getName().startsWith("data/minecraft/tags/block/")&&e.getName().endsWith(".json")){
    String id="minecraft:"+e.getName().substring("data/minecraft/tags/block/".length(),e.getName().length()-5);
    raw.put(id,JsonParser.parseReader(new InputStreamReader(z.getInputStream(e))).getAsJsonObject().getAsJsonArray("values"));
   }
  }
  for(String name:raw.keySet())resolveTag(name,raw,new HashSet<>());
  Object registry=field("lt","e"),registryKey=call("jz","d",registry,NONE);
  Map<Object,List<Object>> bound=new HashMap<>();
  for(var entry:tagValues.entrySet()){
   Object tagLocation=call("akr","a",null,new Class<?>[]{String.class},entry.getKey());
   Object tag=call("awu","a",null,new Class<?>[]{c("akq"),c("akr")},registryKey,tagLocation);
   List<Object> holders=new ArrayList<>();
   for(String id:entry.getValue()){
    Object location=call("akr","a",null,new Class<?>[]{String.class},id);
    if(!(Boolean)call("jz","d",registry,new Class<?>[]{c("akr")},location))throw new IllegalArgumentException("unknown builtin block "+id);
    Object block=call("jz","a",registry,new Class<?>[]{c("akr")},location);
    holders.add(call("jz","e",registry,new Class<?>[]{Object.class},block));
   }
   bound.put(tag,holders);
  }
  call("jz","a",registry,new Class<?>[]{Map.class},bound);
 }
 static List<List<Double>> boxes(Object shape) throws Exception{
  List<?> list=(List<?>)call("exv","e",shape,NONE);List<List<Double>> out=new ArrayList<>();
  for(Object box:list){List<Double> v=new ArrayList<>();for(String name:new String[]{"a","b","c","d","e","f"})v.add(c("ewx").getField(name).getDouble(box));out.add(v);}return out;
 }
 static Map<String,String> properties(Object state)throws Exception{
  Map<?,?> values=(Map<?,?>)call("dte","C",state,NONE);Map<String,String> out=new TreeMap<>();
  for(var entry:values.entrySet())out.put((String)call("duf","f",entry.getKey(),NONE),(String)call("duf","a",entry.getKey(),new Class<?>[]{Comparable.class},entry.getValue()));return out;
 }
 public static void main(String[]args)throws Exception{
  if(args.length!=2)throw new IllegalArgumentException("client.jar output.json");
  PrintStream original=System.out;call("ab","a",null,NONE);call("akt","a",null,NONE);bindVanillaBlockTags(args[0]);
  Object empty=field("dcl","a"),position=c("jd").getConstructor(int.class,int.class,int.class).newInstance(0,0,0),context=call("exh","a",null,NONE),up=field("ji","b"),player=field("bsx","by");
  Class<?>[] shapeTypes={c("dcc"),c("jd"),c("exh")},supportTypes={c("dcc"),c("jd"),c("ji")};
  List<Map<String,Object>> rows=new ArrayList<>();
  Object blockRegistry=field("lt","e"),fluidRegistry=field("lt","c");
  String[] selections={"minecraft:air","minecraft:stone","minecraft:red_bed","minecraft:oak_slab","minecraft:oak_fence","minecraft:cactus","minecraft:white_carpet","minecraft:water","minecraft:lava","minecraft:fire","minecraft:wither_rose","minecraft:end_portal","minecraft:end_gateway"};
  for(String id:selections){
   Object location=call("akr","a",null,new Class<?>[]{String.class},id);
   if(!(Boolean)call("jz","d",blockRegistry,new Class<?>[]{c("akr")},location))throw new IllegalArgumentException("unknown sample block "+id);
   Object block=call("jz","a",blockRegistry,new Class<?>[]{c("akr")},location);List<?> states=(List<?>)call("dtd","a",call("dfy","l",block,NONE),NONE);
   boolean all=id.endsWith("bed")||id.endsWith("slab");
   if(!all)states=List.of(call("dfy","o",block,NONE));
   for(Object state:states){
    Map<String,Object> row=new LinkedHashMap<>();row.put("block",id);row.put("states",properties(state));row.put("dynamic_shape",call("dfy","p",block,NONE));row.put("collision_boxes",boxes(call("dtb$a","b",state,shapeTypes,empty,position,context)));row.put("selection_boxes",boxes(call("dtb$a","a",state,shapeTypes,empty,position,context)));row.put("sturdy_up",call("dtb$a","d",state,supportTypes,empty,position,up));row.put("player_block_dangerous",call("bsx","a",player,new Class<?>[]{c("dtc")},state));row.put("invalid_spawn_inside",tagValues.get("minecraft:invalid_spawn_inside").contains(id));
    Object fluid=call("dtb$a","u",state,NONE),fluidType=call("epe","a",fluid,NONE);
    row.put("fluid_state",Map.of("id",call("jz","b",fluidRegistry,new Class<?>[]{Object.class},fluidType).toString(),"states",properties(fluid),"source",call("epe","b",fluid,NONE),"empty",call("epe","c",fluid,NONE)));rows.add(row);
   }
  }
  int blockCount=0,stateCount=0;List<String> dynamicBlocks=new ArrayList<>();
  for(Object block:(Iterable<?>)blockRegistry){blockCount++;stateCount+=((List<?>)call("dtd","a",call("dfy","l",block,NONE),NONE)).size();if((Boolean)call("dfy","p",block,NONE))dynamicBlocks.add(call("jz","b",blockRegistry,new Class<?>[]{Object.class},block).toString());}
  Map<String,Object> result=new LinkedHashMap<>();result.put("registry_blocks",blockCount);result.put("registry_possible_block_states",stateCount);result.put("dynamic_shape_blocks",dynamicBlocks);result.put("source","untouched Mojang Minecraft1.21.1 official client.jar + official mappings + official core libraries");result.put("scope","vanilla registry, builtin vanilla tags, EmptyBlockGetter air neighbors, CollisionContext.empty; no entities/client/native raycast");result.put("builtin_block_tags_bound",tagValues.size());result.put("invalid_spawn_inside",tagValues.get("minecraft:invalid_spawn_inside"));result.put("rows",rows);Files.writeString(Path.of(args[1]),new GsonBuilder().setPrettyPrinting().create().toJson(result)+"\n");original.println("SHAPE_ORACLE_OK rows="+rows.size());
 }
}
