// Real peer storage producers and World Liquor Respawn, with SDK callbacks.
// No native Player/BDS/client evidence is inferred from these source tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {world,Dimension,BlockPermutation,ItemStack,reset,player} from './wall-record-mock.mjs';
import {applyJavaRespawn,setJavaRespawnContextProvider} from '../runtime/BP/scripts/respawn-adapter.js';
import {peerSources,checkRespawnHelperDefinitions} from '../tools/check_respawn_helpers.mjs';

const tavern=await import(pathToFileURL(path.join(peerSources.tavern,'runtime/BP/scripts/core/native-item-storage.js')));
const grilling=await import(pathToFileURL(path.join(peerSources.grilling,'projects/grilling/gameplay_core/behavior_pack/scripts/family_station_storage.js')));

function fixture(){
 reset();setJavaRespawnContextProvider(undefined);
 const dimension=new Dimension(),actor=player(dimension),calls=[];
 Object.assign(actor,{isSneaking:false,isSwimming:false,isGliding:false,isSleeping:false,getSpawnPoint:()=>undefined,
  teleport:(position,options)=>calls.push(['teleport',position,options]),addEffect:(...args)=>calls.push(['effect',...args])});
 world.gameRules.keepInventory=true;world.gameRules.spawnRadius=0;
 world.getDefaultSpawnLocation=()=>({x:0,y:32767,z:0});
 const item=new ItemStack('minecraft:sugar');item.nameTag='family original';item.lore=['retained lore'];item.data={foreign:{marker:'untouched'}};
 const column=position=>({typeId:position.y<64?'minecraft:stone':'minecraft:air',location:{...position},dimension,isWaterlogged:false,permutation:{getAllStates:()=>({})}});
 return {dimension,actor,calls,item,column};
}
function createTavernStorage(f){
 let entity;
 const storage=new tavern.NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),makeStack:(id,amount)=>new ItemStack(id,amount),token:()=> 'test-storage-token',
  createEntity:(dimension,position)=>{
   entity=dimension.spawnEntity(tavern.NATIVE_ITEM_ENTITY,position);
   const items=Array(9),container={size:9,getItem:i=>items[i]?.clone(),setItem:(i,value)=>{items[i]=value?.clone();}};
   entity.getComponent=id=>id==='minecraft:inventory'?{container}:undefined;return entity;
  }});
 const input={key:'respawn-family/tavern',dimension:f.dimension,position:{x:512,y:64,z:512},oldIds:[],nextIds:[f.item.typeId],incoming:f.item};
 const mutation=storage.plan(input);mutation.apply();mutation.finish();
 return {entity,key:tavern.nativeItemKey(input.key),read:()=>storage.read({key:input.key,dimension:f.dimension,position:input.position,ids:[f.item.typeId]}).items.filter(Boolean)};
}
function createGrillingStorage(f){
 const block=f.dimension.getBlock({x:512,y:64,z:512});block.setPermutation(BlockPermutation.resolve('kaleidoscope_grilling:seasoning_bottle_1'));
 const container=grilling.stationContainer(block);container.setItem(0,f.item);
 const key=grilling.storageKey(block),record=JSON.parse(world.getDynamicProperty(key));
 return {entity:world.getEntity(record.entity),key,read:()=>[grilling.peekStationContainer(block).getItem(0)]};
}

test('all 85 listed helper facts match the actual paired BP definitions, including component groups',()=>{
 assert.deepEqual(checkRespawnHelperDefinitions(),{tavern:56,worldLiquor:21,grilling:8});
});
for(const [name,create] of [['Tavern cabinet',createTavernStorage],['Grilling seasoning bottle',createGrillingStorage]]){
 for(const foreign of [false,true])test(`production ${name} storage ${foreign?'retains unknown foreign collision rejection':'does not block shared Respawn'}`,()=>{
  const f=fixture(),stored=create(f),before=world.getDynamicProperty(stored.key);
  f.dimension.getBlock=f.column;
  f.dimension.getEntities=()=>[f.actor,stored.entity,...(foreign?[{id:'foreign',typeId:'foreign:storage_helper',location:{x:512,y:64,z:512}}]:[])];
  const result=applyJavaRespawn(f.actor,world);
  if(foreign){assert.equal(result.status,'unknown');assert.equal(result.fact,'local source collidable entity facts foreign:storage_helper');assert.deepEqual(f.calls,[]);}
  else{assert.equal(result.status,'ready');assert.equal(result.branch,'shared-column');assert.deepEqual(result.position,{x:.5,y:64,z:.5});assert.deepEqual(f.calls.map(row=>row[0]),['teleport','effect']);}
  assert.equal(world.getDynamicProperty(stored.key),before);assert.equal(world.getEntity(stored.entity.id),stored.entity);assert.deepEqual(stored.read(),[f.item]);
 });
}
