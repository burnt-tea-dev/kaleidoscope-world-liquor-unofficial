import {frostEffectFixture} from './frost-effect-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {applyJavaRespawn,resolveJavaRespawn,installJavaRespawn,setJavaRespawnContextProvider,JAVA_RESPAWN_DEFAULT_CONTEXT,sourceBorderContains,sourceBlockCollision,sourceBorderBounds,sourceBorderCollision} from '../runtime/BP/scripts/respawn-adapter.js';
import {javaBlockView,sourceFullUpperFace,UnknownRespawnFact} from '../runtime/BP/scripts/respawn-blocks.js';
import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import {JavaKillCredit} from '../runtime/BP/scripts/kill-credit.js';
function fixture({dimension='nether',keepInventory=true,spawn=true}={}){
 const calls=[],overrides=new Map(),key=p=>[p.x,p.y,p.z].join(',');
 const makeBlock=(id,p,states={})=>({typeId:id,location:{...p},dimension:d,isWaterlogged:false,permutation:{getAllStates:()=>({...states}),withState:(name,value)=>{calls.push(['charge-state',name,value]);return {name,value};}},setPermutation:value=>calls.push(['charge',value])});
 const d={id:'minecraft:'+dimension,getBlock:p=>overrides.get(key(p))??makeBlock(p.y<=63?'minecraft:stone':'minecraft:air',p),getEntities:()=>[player],playSound:(id,at,options)=>calls.push(['sound',d.id,id,{...at},{...options}])};
 const source={id:'minecraft:overworld',playSound:(id,at,options)=>calls.push(['sound',source.id,id,{...at},{...options}])};
 const anchor=makeBlock('minecraft:respawn_anchor',{x:10,y:64,z:10},{respawn_anchor_charge:2});overrides.set('10,64,10',anchor);
 const dp=new Map();
 const player={id:'real-api-shape fixture',typeId:'minecraft:player',location:{x:100,y:80,z:100},dimension:source,isSneaking:false,isSwimming:false,isGliding:false,isSleeping:false,getSpawnPoint:()=>spawn?{x:10,y:64,z:10,dimension:d}:undefined,getDynamicProperty:id=>dp.get(id),setDynamicProperty:(id,v)=>dp.set(id,v),teleport:(at,options)=>{calls.push(['teleport',{...at},options]);player.dimension=options.dimension;player.location={...at};},addEffect:(...args)=>calls.push(['effect',...args])};
 const world={gameRules:{keepInventory,spawnRadius:0},getDimension:()=>d,getDefaultSpawnLocation:()=>({x:0,y:32767,z:0}),getDynamicProperty:()=>undefined};
 return {player,world,d,calls,overrides,anchor,block:makeBlock};
}
function production(f){
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const context=vm.createContext({...frostEffectFixture,world:f.world,system:{},applyJavaRespawn,JavaKillCredit,AcceptedHurtFeedback,CriticalFeedback:class{},MolangVariableMap:class{},readTavernEffects:()=>({}),ItemStack:class{},actor:f.player});
 vm.runInContext(source,context);vm.runInContext("applyEffect(actor,'kaleidoscope_world_liquor:respawn',1,0)",context);
}
function registeredProduction(f){
 const callbacks=[],deferred=[],intervals=[],worldProperties=new Map();
 const signal=()=>({subscribe:fn=>fn});
 f.world.beforeEvents={entityHurt:signal(),playerInteractWithBlock:signal()};
 f.world.afterEvents=Object.fromEntries(['entityHurt','entityRemove','playerSpawn','playerLeave','playerButtonInput','entityDie','playerBreakBlock'].map(name=>[name,signal()]));
 f.world.getAllPlayers=()=>[f.player];f.world.getEntity=id=>id===f.player.id?f.player:{id,typeId:'minecraft:cow'};
 f.world.getDynamicProperty=key=>worldProperties.get(key);f.world.setDynamicProperty=(key,value)=>worldProperties.set(key,value);
 const system={afterEvents:{scriptEventReceive:{subscribe:(fn,options)=>{assert.deepEqual([...options.namespaces],['kaleidoscope_world_liquor']);callbacks.push(fn);return fn;}}},run:fn=>deferred.push(fn),runInterval:fn=>{intervals.push(fn);return intervals.length;}};
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const context=vm.createContext({...frostEffectFixture,world:f.world,system,applyJavaRespawn,installJavaRespawn,JavaKillCredit,AcceptedHurtFeedback,CriticalFeedback:class{},MolangVariableMap:class{},readTavernEffects:()=>({}),ItemStack:class{},actor:f.player});
 vm.runInContext(source,context);vm.runInContext('installEffects()',context);
 return {worldProperties,callbacks,emit:(id,payload,extra={})=>{const event={id:'kaleidoscope_world_liquor:'+id,sourceType:'Server',message:typeof payload==='string'?payload:JSON.stringify(payload),...extra};for(const callback of callbacks)callback(event);},again:()=>vm.runInContext('installEffects()',context)};
}
test('actual production Respawn uses the first Java anchor candidate without forced/yaw/provider and preserves source sound/Hunger order',()=>{
 setJavaRespawnContextProvider(undefined);const f=fixture();production(f);
 assert.deepEqual(f.calls.map(row=>row[0]),['sound','teleport','sound','effect']);
 assert.deepEqual(f.calls[1][1],{x:10.5,y:64,z:9.5});assert.equal(f.calls[1][2].keepVelocity,true);
 assert.equal(f.calls[1][2].rotation.x,0);assert.ok(Number.isFinite(f.calls[1][2].rotation.y));
 assert.equal(f.calls[0][1],'minecraft:overworld');assert.equal(f.calls[2][1],'minecraft:nether');
 assert.deepEqual(f.calls[3],['effect','hunger',300,{amplifier:0}]);
 assert.ok(!('isSolid' in f.anchor));
});
test('a queried unknown first anchor candidate stops quietly without skipping to another candidate',()=>{
 const f=fixture();f.overrides.set('10,64,9',f.block('foreign:opaque',{x:10,y:64,z:9}));
 const result=applyJavaRespawn(f.player,f.world);assert.equal(result.status,'unknown');assert.match(result.fact,/source block identity/);
 assert.deepEqual(f.calls.map(row=>row[0]),['sound']);
});
test('known nonforced charged anchor consumes once after resolution and before teleport; missing forced is not guessed',()=>{
 const f=fixture({keepInventory:false});assert.equal(resolveJavaRespawn(f.player,f.world).status,'unknown');assert.equal(f.calls.length,0);
 setJavaRespawnContextProvider(()=>({metadata:()=>({forced:false})}));production(f);setJavaRespawnContextProvider(undefined);
 assert.deepEqual(f.calls.map(row=>row[0]),['sound','charge-state','charge','teleport','sound','effect']);assert.deepEqual(f.calls[1],['charge-state','respawn_anchor_charge',1]);
});
test('source default heightmaps resolve Native dynamic-height sentinel by a real column, without using raw Y or a height cap',()=>{
 const f=fixture({dimension:'overworld',spawn:false});f.overrides.clear();
 const result=resolveJavaRespawn(f.player,f.world,{nextInt:bound=>{assert.equal(bound,1);return 0;}});
 assert.equal(result.status,'ready');assert.equal(result.branch,'shared-column');assert.deepEqual(result.position,{x:.5,y:64,z:.5});assert.equal(result.yaw,0);
});
test('sentinel Y remains unresolved when the source column is rejected; source constructor profile is explicit and validated',()=>{
 const f=fixture({dimension:'overworld',spawn:false});f.overrides.clear();f.world.gameRules.spawnRadius=0;
 // Source surface above ocean floor with fluid: reject the column, not air-scan.
 f.overrides.set('0,64,0',f.block('minecraft:water',{x:0,y:64,z:0},{liquid_depth:0}));
 const result=resolveJavaRespawn(f.player,f.world,{nextInt:()=>0});assert.equal(result.status,'unknown');assert.match(result.fact,/shared spawn Y/);
 assert.deepEqual(JAVA_RESPAWN_DEFAULT_CONTEXT,{schema:1,border:{centerX:0,centerZ:0,size:59999968,absoluteMax:29999984},adventure:false});
 assert.equal(resolveJavaRespawn(f.player,f.world,{profile:{schema:1,border:{centerX:0,centerZ:0,size:'20',absoluteMax:29999984},adventure:false}}).status,'unknown');
});
test('bed side choice uses declared saved yaw and source bed/anchor look-at yaw, not current player yaw',()=>{
 const f=fixture({dimension:'overworld'});f.overrides.set('10,64,10',f.block('minecraft:bed',{x:10,y:64,z:10},{direction:2,head_piece_bit:true,occupied_bit:false}));
 const without=resolveJavaRespawn(f.player,f.world);assert.equal(without.status,'unknown');assert.match(without.fact,/saved respawn yaw/);
 const plus=resolveJavaRespawn(f.player,f.world,{metadata:()=>({yaw:90,forced:false})}),minus=resolveJavaRespawn(f.player,f.world,{metadata:()=>({yaw:-90,forced:false})});
 assert.equal(plus.status,'ready');assert.equal(minus.status,'ready');assert.equal(plus.branch,'bed');assert.notDeepEqual(plus.position,minus.position);assert.notEqual(plus.yaw,90);
});
test('unknown irrelevant Java states are reduced by queried consensus, and support face is distinct from solidity',()=>{
 const water=javaBlockView({typeId:'minecraft:water',location:{x:0,y:0,z:0},isWaterlogged:false,permutation:{getAllStates:()=>({liquid_depth:7})}});
 assert.deepEqual(water.collisionBoxes(),[]);assert.equal(water.nonemptyFluid(),true);assert.equal(water.flag('player_block_dangerous'),false);
 const stone=javaBlockView({typeId:'minecraft:stone',location:{x:0,y:0,z:0},isWaterlogged:false,permutation:{getAllStates:()=>({stone_type:'granite'})}});assert.equal(stone.id,'minecraft:granite');
 assert.equal(sourceFullUpperFace([[0,0,0,1,.875,1]]),false);assert.equal(sourceFullUpperFace([[0,0,0,.5,1,1],[.5,0,0,1,1,1]]),true);
 assert.equal(sourceFullUpperFace([[0,0,0,1,1,1],[0,1,0,.1,1.5,.1]]),true);
 assert.equal(sourceFullUpperFace([[0,0,0,1,1.5,1]]),true);
 assert.equal(sourceFullUpperFace([[0,0,0,1,1,1],[-.1,.9,0,0,1.5,1]]),false);
 const fence=javaBlockView({typeId:'minecraft:oak_fence',location:{x:0,y:0,z:0},isWaterlogged:false,permutation:{getAllStates:()=>({})}});
 assert.equal(fence.floorMaximum(),1.5);assert.throws(()=>fence.collisionBoxes(),UnknownRespawnFact);
 assert.equal(fence.upperFaceFull(),false);assert.equal(fence.intersects({x:0,y:0,z:0},{minX:2,minY:0,minZ:0,maxX:3,maxY:2,maxZ:1}),false);
});
test('source world-border AABB semantics use constructor clamp and float epsilon, not a Native border claim',()=>{
 const b=JAVA_RESPAWN_DEFAULT_CONTEXT.border;assert.deepEqual(sourceBorderBounds(b),{minX:-29999984,minZ:-29999984,maxX:29999984,maxZ:29999984});
 assert.equal(sourceBorderContains(b,{minX:29999983,minZ:0,maxX:29999984,maxZ:1}),true);
 assert.equal(sourceBorderContains(b,{minX:29999984,minZ:0,maxX:29999985,maxZ:1}),false);
 // noCollision's exterior shape rounds outward and is only queried nearby.
 const small={centerX:0,centerZ:0,size:5.5,absoluteMax:29999984};
 assert.equal(sourceBorderCollision(small,{x:2.8,z:0},{minX:2.7,minY:0,minZ:0,maxX:2.9,maxY:1,maxZ:1}),false);
 assert.equal(sourceBorderCollision(small,{x:3,z:0},{minX:2.7,minY:0,minZ:0,maxX:3.3,maxY:1,maxZ:1}),true);
 assert.equal(sourceBorderCollision(small,{x:100,z:0},{minX:99,minY:0,minZ:0,maxX:101,maxY:1,maxZ:1}),false);
});
test('default source entity checks exclude remote vanilla mobs and prove distant source shulker geometry irrelevant',()=>{
 const f=fixture({dimension:'overworld',spawn:false});f.overrides.clear();
 const cow={id:'cow',typeId:'minecraft:cow',location:{x:5000,y:64,z:5000}},boat={id:'boat',typeId:'minecraft:boat',location:{x:5000,y:64,z:5000}},shulker={id:'shulker',typeId:'minecraft:shulker',location:{x:5000,y:64,z:5000}};
 f.d.getEntities=()=>[cow,boat,shulker,f.player];assert.equal(resolveJavaRespawn(f.player,f.world,{nextInt:()=>0}).status,'ready');
 shulker.location={x:.5,y:64,z:.5};assert.match(resolveJavaRespawn(f.player,f.world,{nextInt:()=>0}).fact,/local source collidable entity/);
 const declared=resolveJavaRespawn(f.player,f.world,{nextInt:()=>0,entityFact:e=>e.id==='shulker'?{collidable:false}:undefined});assert.equal(declared.status,'ready');
});
test('default collision uses source Boat dimensions and source root-vehicle exclusion without reading Native AABB',()=>{
 const f=fixture({dimension:'overworld',spawn:false});f.overrides.clear();
 const boat={id:'boat',typeId:'minecraft:boat',location:{x:.5,y:64,z:.5},getAABB:()=>{throw Error('must not use Native dimensions');},getComponent:()=>undefined};f.d.getEntities=()=>[f.player,boat];
 assert.match(resolveJavaRespawn(f.player,f.world,{nextInt:()=>0}).fact,/shared spawn Y/);
 f.player.getComponent=name=>name==='minecraft:riding'?{entityRidingOn:boat}:undefined;
 assert.equal(resolveJavaRespawn(f.player,f.world,{nextInt:()=>0}).status,'ready');
});
test('proven solid invalid personal point reaches real default without guessing saved forced/yaw',()=>{
 const f=fixture({dimension:'overworld'});f.overrides.set('10,64,10',f.block('minecraft:stone',{x:10,y:64,z:10}));
 const result=resolveJavaRespawn(f.player,f.world,{nextInt:()=>0});assert.equal(result.status,'ready');assert.equal(result.branch,'shared-column');assert.deepEqual(result.position,{x:.5,y:64,z:.5});
});
test('source collision cursor advances X fastest and skips all three-boundary cells before reading state',()=>{
 const calls=[],bounds={minX:.2,minY:1,minZ:.2,maxX:.8,maxY:2.8,maxZ:.8};
 assert.equal(sourceBlockCollision(bounds,p=>{calls.push({...p});return {id:'minecraft:air',largeCollision:()=>false,collisionBoxes:()=>[]};}),false);
 assert.deepEqual(calls.slice(0,3),[{x:0,y:-1,z:-1},{x:-1,y:0,z:-1},{x:0,y:0,z:-1}]);
 assert.ok(!calls.some(p=>p.x===-1&&p.y===-1&&p.z===-1));
});
test('keepInventory is captured once after the source sound and before provider/resolver callbacks',()=>{
 const f=fixture();setJavaRespawnContextProvider(()=>{f.world.gameRules.keepInventory=false;return {};});
 try{production(f);}finally{setJavaRespawnContextProvider(undefined);}
 assert.deepEqual(f.calls.map(row=>row[0]),['sound','teleport','sound','effect']);
});
test('actual production registration exposes bounded Server profile declarations and preserves source defaults on malformed/foreign data',()=>{
 const f=fixture(),r=registeredProduction(f),good={schema:1,border:{centerX:10,centerZ:10,size:20,absoluteMax:29999984},adventure:false};
 assert.equal(r.callbacks.length,2);r.emit('declare_respawn_context',good);
 assert.deepEqual(JSON.parse([...r.worldProperties.values()][0]),good);const before=[...r.worldProperties.entries()];
 for(const [payload,extra] of [[{...good,adventure:'false'},{}],[{...good,border:{...good.border,size:'20'}},{}],[{...good,border:{...good.border,absoluteMax:30000000}},{}],['{invalid',{}],[' '.repeat(4097),{}],[good,{sourceType:'Entity',sourceEntity:f.player}],[good,{sourceEntity:f.player}],[good,{initiator:f.player}],[{...good,execute:'not executable'},{}]])r.emit('declare_respawn_context',payload,extra);
 assert.deepEqual([...r.worldProperties.entries()],before);assert.equal(resolveJavaRespawn(f.player,f.world).status,'ready');
 r.again();assert.equal(r.callbacks.length,3); // one declaration bridge, two calls to the existing effects installer.
});
test('actual registered metadata event targets a real current Player point and enables old nonforced anchor charge semantics',()=>{
 const f=fixture({keepInventory:false}),r=registeredProduction(f),declaration={entity:f.player.id,point:{x:10,y:64,z:10,dimensionId:f.d.id},yaw:90,forced:false};
 r.emit('declare_respawn_metadata',{...declaration,entity:'cow'});assert.equal(resolveJavaRespawn(f.player,f.world).status,'unknown');
 for(const payload of [{...declaration,point:{...declaration.point,x:11}},{...declaration,yaw:1e300},{...declaration,forced:0},{...declaration,point:{...declaration.point,x:2147483648}},{...declaration,point:{...declaration.point,dimensionId:'minecraft:overworld'}}])r.emit('declare_respawn_metadata',payload);
 assert.equal(resolveJavaRespawn(f.player,f.world).status,'unknown');r.emit('declare_respawn_metadata',declaration);
 const ready=resolveJavaRespawn(f.player,f.world);assert.equal(ready.status,'ready');assert.equal(ready.consumeAnchor.charges,2);
 production(f);assert.deepEqual(f.calls.map(row=>row[0]),['sound','charge-state','charge','teleport','sound','effect']);
});
