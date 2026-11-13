import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,system,Dimension,BlockPermutation,ItemStack,player,reset} from './wall-record-mock.mjs';
import {registerFurniture,installFurniture} from '../runtime/BP/scripts/furniture.js';

const N='kaleidoscope_world_liquor',F='kaleidoscope_tavern:facing';
let furniture;
registerFurniture({blockComponentRegistry:{registerCustomComponent(id,handler){if(id===N+':furniture')furniture=handler;}}});
installFurniture();
const stools=fs.readdirSync(new URL('../runtime/BP/blocks/',import.meta.url)).filter(name=>name.startsWith('bar_stool_')).map(name=>N+':'+name.replace(/\.json$/,''));

function fixture({mode='survival',held,offhand,sneaking=false,id=stools[0],facing=0}={}){
 reset();
 const dimension=new Dimension(),p=player(dimension,mode),b=dimension.getBlock({x:4,y:64,z:4}),seats=[],riders=[];
 p.isSneaking=sneaking;if(held)p.inv.setItem(0,new ItemStack(held,3));
 const original=p.getComponent.bind(p),equipment={item:offhand?new ItemStack(offhand):undefined,getEquipment(){return this.item?.clone();}};
 p.getComponent=id=>id==='minecraft:equippable'?equipment:original(id);
 b.setPermutation(BlockPermutation.resolve(id,{[F]:facing}));
 dimension.getEntities=()=>seats;
 dimension.spawnEntity=(typeId,location)=>{
  assert.equal(typeId,N+':seat');const data=new Map(),occupants=[];
  const seat={typeId,location:{...location},yaw:undefined,rotation:undefined,occupants,
   setDynamicProperty:(key,value)=>data.set(key,value),getDynamicProperty:key=>data.get(key),
   setProperty(key,value){assert.equal(key,'kaleidoscope_tavern:seat_yaw');this.yaw=value;},
   setRotation(value){this.rotation={...value};},
   getComponent(id){assert.equal(id,'minecraft:rideable');return {getRiders:()=>occupants,addRider(rider){if(occupants.length)return false;occupants.push(rider);riders.push(rider);return true;}};}};
  seats.push(seat);return seat;
 };
 const before=()=>({player:p,block:b,itemStack:p.inv.getItem(0),blockFace:'Up',faceLocation:{x:.5,y:1,z:.5},isFirstEvent:true,cancel:false});
 const direct=()=>furniture.onPlayerInteract({player:p,block:b,face:'Up',faceLocation:{x:.5,y:1,z:.5}});
 return {p,b,dimension,equipment,seats,riders,before,direct};
}

for(const input of [{mode:'adventure'},{held:'minecraft:stick'},{held:'minecraft:cobblestone'},{sneaking:true}])test('source default block-use is admitted: '+JSON.stringify(input),()=>{
 const f=fixture(input),before=f.p.inv.getItem(0),event=f.before();world.beforeEvents.playerInteractWithBlock.emit(event);
 assert.equal(event.cancel,true);assert.equal(f.riders.length,0,'before event must defer ride writes');system.flush();
 assert.equal(f.riders.length,1);assert.deepEqual(f.p.inv.getItem(0),before);
});

test('16 colors × four facings × all ordinary hand/mode/sneak combinations use the Java admission matrix',()=>{
 assert.equal(stools.length,16);let cases=0,admitted=0;
 for(const id of stools)for(let facing=0;facing<4;facing++)for(const mode of ['survival','creative','adventure','spectator'])for(const sneaking of [false,true])for(const held of [undefined,'minecraft:stick','minecraft:cobblestone'])for(const offhand of [undefined,'minecraft:shield']){
  const f=fixture({id,facing,mode,sneaking,held,offhand}),before=f.p.inv.getItem(0),other=f.equipment.item?.clone(),event=f.before();
  const eligible=mode!=='spectator'&&(!sneaking||!held&&!offhand);
  world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,eligible,JSON.stringify({id,facing,mode,sneaking,held,offhand}));system.flush();
  // The direct custom-component path is independently guarded as well.
  if(!event.cancel)f.direct();
  assert.equal(f.riders.length,eligible?1:0);assert.deepEqual(f.p.inv.getItem(0),before);assert.deepEqual(f.equipment.item,other);
  if(eligible){admitted++;assert.equal(f.seats[0].yaw,[180,-90,0,90][facing]);}
  cases++;
 }
 assert.equal(cases,3072);assert.equal(admitted,1344);
});

test('the registered component itself admits Adventure and held-item use',()=>{
 for(const input of [{mode:'adventure',held:'minecraft:stick'},{sneaking:true},{}]){const f=fixture(input);f.direct();assert.equal(f.riders.length,1);}
});

test('occupied stool preserves ordinary held-item use and never ejects its rider',()=>{
 const f=fixture({held:'minecraft:cobblestone'});f.direct();const rider=f.riders[0],seat=f.seats[0];
 system.currentTick+=5;const event=f.before();world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,false);system.flush();f.direct();
 assert.deepEqual(seat.occupants,[rider]);assert.equal(f.seats.length,1);assert.equal(f.riders.length,1);assert.equal(f.p.inv.getItem(0).amount,3);
});

test('existing empty native seat is reused without duplicating the persistent helper',()=>{
 const f=fixture();f.direct();const seat=f.seats[0];seat.occupants.length=0;system.currentTick+=5;f.direct();
 assert.equal(f.seats.length,1);assert.equal(f.riders.length,2);
});

for(const change of ['offhand','main-hand','sneaking','block','occupied'])test('deferred sitting rejects changed '+change+' without consuming an item',()=>{
 const f=fixture({sneaking:change==='offhand'}),event=f.before();world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);
 if(change==='offhand')f.equipment.item=new ItemStack('minecraft:shield');
 if(change==='main-hand')f.p.inv.setItem(0,new ItemStack('minecraft:stick',3));
 if(change==='sneaking')f.p.isSneaking=!f.p.isSneaking;
 if(change==='block')f.b.setType('minecraft:stone');
 if(change==='occupied'){
  const seat=f.dimension.spawnEntity(N+':seat',f.b.location);seat.setDynamicProperty(N+':anchor',N+':storage/overworld/4_64_4');seat.occupants.push({id:'other player'});
 }
 const before=f.p.inv.getItem(0),other=f.equipment.item?.clone();system.flush();assert.equal(f.riders.length,0);assert.deepEqual(f.p.inv.getItem(0),before);assert.deepEqual(f.equipment.item,other);
});

test('held input repeats do not schedule additional seat writes',()=>{
 const f=fixture({held:'minecraft:stick'}),first=f.before();world.beforeEvents.playerInteractWithBlock.emit(first);
 for(let i=0;i<3;i++){const repeated={...f.before(),isFirstEvent:false};world.beforeEvents.playerInteractWithBlock.emit(repeated);assert.equal(repeated.cancel,true);}
 system.flush();assert.equal(f.seats.length,1);assert.equal(f.riders.length,1);
});
