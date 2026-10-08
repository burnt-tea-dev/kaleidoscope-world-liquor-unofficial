// Production storage and Respawn adapters with SDK-shaped callbacks. These are
// source/API regressions, not native Player, BDS or rendered-client evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,Dimension,BlockPermutation,ItemStack,reset,player} from './wall-record-mock.mjs';
import {planFreezerStorage,freezerStorageKey,readFreezerItems} from '../runtime/BP/scripts/freezer-storage.js';
import {nativeItemKey} from '../runtime/BP/scripts/freezer-native-storage.js';
import {applyJavaRespawn,resolveJavaRespawn,setJavaRespawnContextProvider} from '../runtime/BP/scripts/respawn-adapter.js';

function fixture({invalidPersonalSpawn=false}={}){
 reset();setJavaRespawnContextProvider(undefined);
 const dimension=new Dimension(),block=dimension.getBlock({x:512,y:64,z:512}),actor=player(dimension),calls=[];
 block.setPermutation(BlockPermutation.resolve('kaleidoscope_world_liquor:freezer'));
 const state={type:block.typeId,input:['minecraft:sugar'],fluid:null,remaining:0,output:0};
 const incoming=new ItemStack('minecraft:sugar');incoming.nameTag='kept sugar';incoming.lore=['owned by its original freezer'];incoming.data={foreign:{marker:'preserved'}};
 const mutation=planFreezerStorage(block,state,{incoming});mutation.apply();mutation.finish();
 const key=freezerStorageKey(block),carrier=world.getEntity(JSON.parse(world.getDynamicProperty(nativeItemKey(key))).entity);
 Object.assign(actor,{isSneaking:false,isSwimming:false,isGliding:false,isSleeping:false,
  getSpawnPoint:()=>invalidPersonalSpawn?{x:10,y:63,z:10,dimension}:undefined,
  teleport:(position,options)=>calls.push(['teleport',position,options]),
  addEffect:(...args)=>calls.push(['effect',...args])});
 world.gameRules.keepInventory=true;world.gameRules.spawnRadius=0;
 world.getDefaultSpawnLocation=()=>({x:0,y:32767,z:0});
 // The real freezer is far outside the queried spawn column and AABB. Keep its
 // captured block for storage reads; represent that queried column explicitly.
 dimension.getBlock=position=>({typeId:position.y<64?'minecraft:stone':'minecraft:air',location:{...position},dimension,isWaterlogged:false,permutation:{getAllStates:()=>({})}});
 dimension.getEntities=()=>[actor,carrier];
 return {dimension,block,actor,state,incoming,key,carrier,calls};
}

for(const invalidPersonalSpawn of [false,true])test(`production freezer input carrier does not block shared Respawn ${invalidPersonalSpawn?'after a proven invalid personal point':'without a personal point'}`,()=>{
 const f=fixture({invalidPersonalSpawn}),before=world.getDynamicProperty(nativeItemKey(f.key));
 assert.equal(f.carrier.typeId,'kaleidoscope_world_liquor:freezer_inputs');
 assert.deepEqual(f.carrier.location,{x:512.5,y:64.5,z:512.5});
 const result=applyJavaRespawn(f.actor,world);
 assert.equal(result.status,'ready');assert.equal(result.branch,'shared-column');
 assert.deepEqual(result.position,{x:.5,y:64,z:.5});
 assert.deepEqual(f.calls.map(row=>row[0]),['teleport','effect']);
 assert.equal(f.calls[0][2].keepVelocity,true);
 assert.deepEqual(f.calls[1],['effect','hunger',300,{amplifier:0}]);
 assert.equal(f.dimension.sounds.length,2);
 assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),before);
 assert.equal(world.getEntity(f.carrier.id),f.carrier);
 assert.deepEqual(readFreezerItems(f.block,f.state).filter(Boolean),[f.incoming]);
});

test('all exact owned empty-box definitions resolve, and every other owned entity remains unknown',()=>{
 const root=new URL('../runtime/BP/entities/',import.meta.url);let helpers=0,others=0;
 for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.json'))){
  const definition=JSON.parse(fs.readFileSync(new URL(file,root),'utf8'))['minecraft:entity'],components=definition.components??{},box=components['minecraft:collision_box'];
  const groups=Object.values(definition.component_groups??{});
  const zero=components['minecraft:physics']?.has_collision===false&&box?.width===0&&box?.height===0&&groups.every(group=>!('minecraft:collision_box' in group)&&!('minecraft:physics' in group));
  const f=fixture(),entity={id:'definition '+file,typeId:definition.description.identifier,location:{x:.5,y:64,z:.5}};
  f.dimension.getEntities=()=>[f.actor,entity];
  const result=resolveJavaRespawn(f.actor,world);
  assert.equal(result.status,zero?'ready':'unknown',file);
  if(zero)helpers++;else{others++;assert.equal(result.fact,'local source collidable entity facts '+entity.typeId);}
 }
 assert.equal(helpers,21);assert.equal(others,1); // thrown_drink has a real .25×.25 box.
});

test('foreign and unknown same-namespace helpers remain unknown even far away or named like storage',()=>{
 for(const typeId of ['foreign:freezer_inputs','kaleidoscope_world_liquor:unreviewed_visual']){
  const f=fixture(),foreign={id:'unknown',typeId,location:{x:512.5,y:64.5,z:512.5},getComponent:()=>undefined};
  f.dimension.getEntities=()=>[f.actor,f.carrier,foreign];
  const result=applyJavaRespawn(f.actor,world);
  assert.equal(result.status,'unknown');assert.equal(result.fact,'local source collidable entity facts '+typeId);
  assert.deepEqual(f.calls,[]);assert.equal(f.dimension.sounds.length,1);
 }
});

test('explicit entity facts still take precedence over the owned helper default',()=>{
 const f=fixture();
 const result=resolveJavaRespawn(f.actor,world,{entityFact:()=>({collidable:'unknown'})});
 assert.equal(result.status,'unknown');assert.equal(result.fact,'declared source entity bounds');
});
