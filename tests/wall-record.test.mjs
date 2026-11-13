import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {world,system,BlockPermutation,ItemStack,Dimension,player,reset,setup,placements} from './wall-record-mock.mjs';
import {registerFurniture,installFurniture} from '../runtime/BP/scripts/furniture.js';
import {WALL_RECORD,wallRecordItem} from '../runtime/BP/scripts/wall-record-state.js';
import {RECORD_MODELS} from '../runtime/BP/scripts/wall-record-models.js';
const NS='kaleidoscope_world_liquor',F='kaleidoscope_tavern:facing',faces=['north','east','south','west'],vectors=[[0,-1],[1,0],[0,1],[-1,0]];
let c;registerFurniture({blockComponentRegistry:{registerCustomComponent:(id,comp)=>{if(id.endsWith(':furniture'))c=comp;}}});setup(c);installFurniture();
const idAt=i=>i<19?Object.keys(RECORD_MODELS).find(id=>RECORD_MODELS[id]===i):NS+':custom_record';
const perm=(i,f=0)=>BlockPermutation.resolve(WALL_RECORD,{[F]:f,[NS+':model_group']:Math.floor(i/5),[NS+':model_variant']:i%5});
const key=b=>NS+':storage/overworld/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
function wall(i,f=0){const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setPermutation(perm(i,f));return {b,d,p:player(d)};}
function broken(b,p){const old=b.permutation;b.setType('minecraft:air');c.onBreak({block:b,brokenBlockPermutation:old,entitySource:p});return old;}
const live=d=>d.drops.filter(e=>!e.removed);
const block=JSON.parse(fs.readFileSync(new URL('../runtime/BP/blocks/wall_record.json',import.meta.url)))['minecraft:block'];
for(let i=0;i<25;i++)test(`model ${i}: exact item, legacy/corrupt/stale DP recovery, native survival drop once`,()=>{
 for(const raw of [undefined,'{bad',JSON.stringify({record:'minecraft:music_disc_cat'})]){
  reset();const {b,d,p}=wall(i);world.setDynamicProperty(key(b),raw);const old=broken(b,p);
  assert.equal(wallRecordItem(old),idAt(i));assert.equal(b.isAir,true);assert.equal(live(d).length,1);assert.equal(live(d)[0].item.typeId,idAt(i));assert.equal(live(d)[0].item.amount,1);
  c.onBreak({block:b,brokenBlockPermutation:old,entitySource:p});assert.equal(live(d).length,1);assert.equal(world.getDynamicProperty(key(b)),undefined);
 }
});
for(let f=0;f<4;f++)test(`facing ${faces[f]}: all 25 meshes and hitboxes stay on the actual support side`,()=>{
 const row=block.permutations.find(p=>p.condition===`q.block_state('${F}') == ${f}`);
 const angle=(row?.components['minecraft:transformation']??block.components['minecraft:transformation']).rotation[1]*Math.PI/180;
 const backing=vectors[(f+2)%4];
 for(let i=0;i<25;i++){
  const shape=block.permutations.find(p=>p.condition===`q.block_state('${NS}:model_group') == ${Math.floor(i/5)} && q.block_state('${NS}:model_variant') == ${i%5}`).components['minecraft:geometry'].identifier;
  const g=JSON.parse(fs.readFileSync(new URL('../runtime/RP/models/entity/kwl_'+shape.split('geometry.kwl.')[1]+'.geo.json',import.meta.url)))['minecraft:geometry'][0];
  for(const bone of g.bones)for(const cube of bone.cubes??[]){const [x,,z]=cube.origin,[sx,,sz]=cube.size;const cx=x+sx/2,cz=z+sz/2;const xx=Math.cos(angle)*cx+Math.sin(angle)*cz,zz=-Math.sin(angle)*cx+Math.cos(angle)*cz;assert(xx*backing[0]+zz*backing[1]>=7,`${i}: geometry is on the wrong side`);}
 }
 const box=block.components['minecraft:selection_box'];assert.deepEqual(box,block.components['minecraft:collision_box']);const z=box.origin[2]+box.size[2]/2;assert(Math.sin(angle)*z*backing[0]+Math.cos(angle)*z*backing[1]>7);
});
for(const mode of ['sync','deferred'])for(let f=0;f<4;f++)test(`${mode} onPlace: ${faces[f]} placement preserves identity and wall support`,()=>{
 for(const [id,i] of [...Object.entries(RECORD_MODELS),[NS+':custom_record',19]]){
  reset();placements(mode);const d=new Dimension(),support=d.getBlock({x:0,y:0,z:0});support.setType('minecraft:stone');const p=player(d);p.inv.setItem(0,new ItemStack(id));
  const e={block:support,player:p,blockFace:faces[f],itemStack:p.inv.getItem(0),isFirstEvent:true};world.beforeEvents.playerInteractWithBlock.emit(e);assert.equal(e.cancel,true);system.flush();
  const [x,z]=vectors[f],b=d.getBlock({x,y:0,z});assert.equal(b.typeId,WALL_RECORD);assert.equal(b.permutation.getState(F),f);assert.equal(p.inv.getItem(0),undefined);assert.equal(JSON.parse(world.getDynamicProperty(key(b))).record,id);
  c.onTick({block:b});assert.equal(b.typeId,WALL_RECORD);assert.equal(live(d).length,0);broken(b,p);assert.equal(live(d)[0].item.typeId,id);
 }
});
for(let f=0;f<4;f++)test(`${faces[f]} support removal drops the exact recovered disc only once`,()=>{
 reset();const {b,d}=wall(18,f);c.onTick({block:b});assert.equal(b.isAir,true);assert.equal(live(d).length,1);assert.equal(live(d)[0].item.typeId,idAt(18));c.onBreak({block:b,brokenBlockPermutation:perm(18,f)});assert.equal(live(d).length,1);
});
for(const mode of ['creative','Creative'])test(mode+' player break does not duplicate records',()=>{reset();const {b,d}=wall(3);broken(b,player(d,mode));assert.equal(live(d).length,0);assert(b.isAir);});
test('doTileDrops=false suppresses native and support-loss drops',()=>{for(const native of [true,false]){reset();world.gameRules.doTileDrops=false;const {b,d,p}=wall(4);if(native)broken(b,p);else c.onTick({block:b});assert(b.isAir);assert.equal(live(d).length,0);}});
test('normal empty-hand retrieval repairs missing DP, removes once and grants inventory item',()=>{reset();const {b,d,p}=wall(20);c.onPlayerInteract({block:b,player:p});assert(b.isAir);assert.equal(p.inv.getItem(0).typeId,NS+':custom_record');c.onBreak({block:b,brokenBlockPermutation:perm(20)});assert.equal(live(d).length,0);});
test('inventory write failure during retrieval rolls back the disc and inventory',()=>{reset();const {b,d,p}=wall(5);p.inv.failWrite=true;c.onPlayerInteract({block:b,player:p});assert.equal(b.typeId,WALL_RECORD);assert.equal(p.inv.getItem(0),undefined);assert.equal(live(d).length,0);});
for(const native of [true,false])test(`${native?'native':'support'} drop failure preserves recoverable block`,()=>{reset();const {b,d,p}=wall(9);d.failSpawn=true;if(native)broken(b,p);else c.onTick({block:b});assert.equal(b.typeId,WALL_RECORD);assert.equal(live(d).length,0);d.failSpawn=false;system.currentTick+=3;broken(b,p);assert.equal(live(d).length,1);});
test('block-removal failure rolls back an already spawned item',()=>{reset();const {b,d}=wall(10);d.failSet=true;c.onTick({block:b});assert.equal(b.typeId,WALL_RECORD);assert.equal(live(d).length,0);});
test('save failure rolls back native drop without creating a second disc',()=>{reset();const {b,d,p}=wall(11);world.failSave=true;broken(b,p);assert.equal(b.typeId,WALL_RECORD);assert.equal(live(d).length,0);});
test('unknown model refuses to guess a disc and restores the wall',()=>{reset();const {b,d,p}=wall(0);b.setPermutation(perm(25));broken(b,p);assert.equal(b.typeId,WALL_RECORD);assert.equal(live(d).length,0);});
test('destroy and replace at same coordinate resets duplicate guard',()=>{reset();const {b,d,p}=wall(1);broken(b,p);b.setPermutation(perm(2));c.onPlace({block:b});broken(b,p);assert.deepEqual(live(d).map(e=>e.item.typeId),[idAt(1),idAt(2)]);});
for(const change of ['slot','support','dimension','adventure','spectator'])test(`deferred placement rejects changed ${change}`,()=>{reset();const d=new Dimension(),support=d.getBlock({x:0,y:0,z:0});support.setType('minecraft:stone');const p=player(d,['adventure','spectator'].includes(change)?change:'survival');p.inv.setItem(0,new ItemStack(idAt(0)));world.beforeEvents.playerInteractWithBlock.emit({block:support,player:p,blockFace:'north',itemStack:p.inv.getItem(0),isFirstEvent:true});if(change==='slot'){p.selectedSlotIndex=1;p.inv.setItem(1,new ItemStack(idAt(0)));}if(change==='support')support.setType('minecraft:air');if(change==='dimension')p.dimension={id:'minecraft:nether'};system.flush();assert.equal(d.getBlock({x:0,y:0,z:-1}).isAir,true);assert.equal(p.inv.getItem(0).typeId,idAt(0));});
test('invalid model indices are rejected individually (no clamping/empty item)',()=>{for(const value of [-1,5,undefined,NaN,'0']){assert.throws(()=>wallRecordItem(BlockPermutation.resolve(WALL_RECORD,{[NS+':model_group']:value,[NS+':model_variant']:0})));assert.throws(()=>wallRecordItem(BlockPermutation.resolve(WALL_RECORD,{[NS+':model_group']:0,[NS+':model_variant']:value})));}});

test('failed retrieval does not suppress an immediate real break after rollback',()=>{reset();const {b,d,p}=wall(6);p.inv.failWrite=true;c.onPlayerInteract({block:b,player:p});assert.equal(b.typeId,WALL_RECORD);broken(b,p);assert.equal(live(d).length,1);});

test('deferred wall placement does not consume a different same-ID stack',()=>{
 reset();const d=new Dimension(),support=d.getBlock({x:0,y:0,z:0});support.setType('minecraft:stone');const p=player(d),original=new ItemStack(idAt(0));original.nameTag='clicked record';p.inv.setItem(0,original);
 world.beforeEvents.playerInteractWithBlock.emit({block:support,player:p,blockFace:'north',itemStack:p.inv.getItem(0),isFirstEvent:true});
 const replacement=new ItemStack(idAt(0));replacement.nameTag='replacement record';p.inv.setItem(0,replacement);system.flush();
 assert.equal(d.getBlock({x:0,y:0,z:-1}).isAir,true);assert.deepEqual(p.inv.getItem(0),replacement);
});
test('deferred painting placement preserves normal placement and rejects changed dimension',()=>{
 for(const moved of [false,true]){
  reset();const d=new Dimension(),support=d.getBlock({x:0,y:0,z:0});support.setType('minecraft:stone');const p=player(d),item=new ItemStack(NS+':test_painting');p.inv.setItem(0,item);
  world.beforeEvents.playerInteractWithBlock.emit({block:support,player:p,blockFace:'north',itemStack:p.inv.getItem(0),isFirstEvent:true});
  if(moved)p.dimension={id:'minecraft:nether'};system.flush();
  assert.equal(d.getBlock({x:0,y:0,z:-1}).typeId,moved?'minecraft:air':item.typeId);assert.equal(p.inv.getItem(0)?.typeId,moved?item.typeId:undefined);
 }
});
test('deferred jukebox insertion preserves normal use and rejects a replaced record',()=>{
 for(const changed of [false,true]){
  reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d),item=new ItemStack(NS+':custom_record');item.nameTag='clicked record';p.isSneaking=false;p.inv.setItem(0,item);
  world.beforeEvents.playerInteractWithBlock.emit({block:b,player:p,blockFace:'up',itemStack:p.inv.getItem(0),isFirstEvent:true});
  if(changed){const replacement=item.clone();replacement.nameTag='replacement record';p.inv.setItem(0,replacement);}system.flush();
  assert.equal(JSON.parse(world.getDynamicProperty(key(b))??'null')?.record,changed?undefined:item.typeId);assert.equal(p.inv.getItem(0)?.nameTag,changed?'replacement record':undefined);
 }
});

// useWithoutItem names the default block callback, not an empty-hand gate.
function wallUse({model=1,facing=0,mode='survival',held,offhand,sneaking=false}={}){
 reset();const f=wall(model,facing);f.p=player(f.d,mode);f.p.isSneaking=sneaking;
 if(held){const stack=new ItemStack(held,3);stack.nameTag='held tool';f.p.inv.setItem(0,stack);}
 const base=f.p.getComponent.bind(f.p),equipment={item:offhand?new ItemStack(offhand):undefined,getEquipment(){return this.item?.clone();}};f.p.getComponent=id=>id==='minecraft:equippable'?equipment:base(id);
 const event=()=>({block:f.b,player:f.p,blockFace:'north',itemStack:f.p.inv.getItem(0),isFirstEvent:true,cancel:false});
 return {...f,equipment,event,direct:()=>c.onPlayerInteract({block:f.b,player:f.p})};
}
for(const input of [{mode:'adventure'},{held:'minecraft:stick'},{held:'minecraft:cobblestone'}])test('wall default use admits '+JSON.stringify(input),()=>{
 const f=wallUse(input),held=f.p.inv.getItem(0),event=f.event();world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);assert.equal(f.b.typeId,WALL_RECORD,'before-event does not remove the wall');system.flush();assert.equal(f.b.isAir,true);if(held)assert.deepEqual(f.p.inv.getItem(0),held);assert.equal(f.p.inv.getItem(held?1:0).typeId,idAt(1));assert.equal(live(f.d).length,0);
});
test('wall secondary use with offhand bypasses default retrieval',()=>{
 const f=wallUse({sneaking:true,offhand:'minecraft:shield'}),event=f.event();world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,false);system.flush();f.direct();assert.equal(f.b.typeId,WALL_RECORD);assert.equal(f.p.inv.getItem(0),undefined);assert.equal(f.equipment.item.typeId,'minecraft:shield');
});
test('wall default-use admission matches 25 models, four facings, modes and ordinary hands',()=>{
 let cases=0,admitted=0;
 for(let model=0;model<25;model++)for(let facing=0;facing<4;facing++)for(const mode of ['survival','creative','adventure','spectator'])for(const sneaking of [false,true])for(const held of [undefined,'minecraft:stick','minecraft:cobblestone'])for(const offhand of [undefined,'minecraft:shield']){
  const f=wallUse({model,facing,mode,sneaking,held,offhand}),before=f.p.inv.getItem(0),other=f.equipment.item?.clone(),event=f.event(),eligible=mode!=='spectator'&&(!sneaking||!held&&!offhand);
  world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,eligible,JSON.stringify({model,facing,mode,sneaking,held,offhand}));assert.equal(f.b.typeId,WALL_RECORD);system.flush();if(!event.cancel)f.direct();assert.equal(f.b.isAir,eligible);assert.deepEqual(f.equipment.item,other);
  if(eligible){admitted++;if(held)assert.deepEqual(f.p.inv.getItem(0),before);assert.equal(f.p.inv.getItem(held?1:0).typeId,idAt(model));assert.equal(f.p.inv.getItem(held?1:0).amount,1);}else assert.deepEqual(f.p.inv.getItem(0),before);
  assert.equal(live(f.d).length,0);cases++;
 }
 assert.equal(cases,4800);assert.equal(admitted,2100);
});
test('wall direct-component use has the same Adventure and held-item admission',()=>{
 for(const input of [{mode:'adventure',held:'minecraft:stick'},{held:'minecraft:cobblestone'},{sneaking:true},{}]){const f=wallUse(input);f.direct();assert.equal(f.b.isAir,true);assert.equal(f.p.inv.getItem(input.held?1:0).typeId,idAt(1));}
});
for(const change of ['slot','held metadata','offhand','sneaking','block','spectator'])test('wall deferred retrieval rechecks '+change+' without changing held inventory',()=>{
 const f=wallUse({held:change==='offhand'?undefined:'minecraft:stick',sneaking:change==='offhand'}),event=f.event();world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);
 if(change==='slot')f.p.selectedSlotIndex=1;
 if(change==='held metadata'){const item=f.p.inv.getItem(0);item.nameTag='different item';f.p.inv.setItem(0,item);}
 if(change==='offhand')f.equipment.item=new ItemStack('minecraft:shield');
 if(change==='sneaking')f.p.isSneaking=true;
 if(change==='block')f.b.setType('minecraft:stone');
 if(change==='spectator')f.p.getGameMode=()=>'spectator';
 const before=Array.from({length:f.p.inv.size},(_,i)=>f.p.inv.getItem(i));system.flush();assert.equal(f.b.typeId,change==='block'?'minecraft:stone':WALL_RECORD);assert.deepEqual(Array.from({length:f.p.inv.size},(_,i)=>f.p.inv.getItem(i)),before);assert.equal(live(f.d).length,0);
});
test('repeated held wall input schedules one return only',()=>{
 const f=wallUse({held:'minecraft:stick'});world.beforeEvents.playerInteractWithBlock.emit(f.event());for(let i=0;i<3;i++){const event={...f.event(),isFirstEvent:false};world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);}system.flush();assert.equal(f.b.isAir,true);assert.equal(f.p.inv.getItem(0).amount,3);assert.equal(f.p.inv.getItem(1).amount,1);assert.equal(f.p.inv.getItem(2),undefined);
});
for(const failure of ['full inventory','inventory write'])test('held wall retrieval preserves both items after '+failure,()=>{
 const f=wallUse({held:'minecraft:stick'});if(failure==='full inventory')for(let i=1;i<f.p.inv.size;i++)f.p.inv.setItem(i,new ItemStack('minecraft:stone',64));const before=Array.from({length:f.p.inv.size},(_,i)=>f.p.inv.getItem(i));const event=f.event();world.beforeEvents.playerInteractWithBlock.emit(event);if(failure==='inventory write')f.p.inv.failWrite=true;system.flush();assert.equal(f.b.typeId,WALL_RECORD);assert.deepEqual(Array.from({length:f.p.inv.size},(_,i)=>f.p.inv.getItem(i)),before);assert.equal(live(f.d).length,0);
});
