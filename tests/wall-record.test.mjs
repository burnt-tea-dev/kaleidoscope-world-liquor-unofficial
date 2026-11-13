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

// The authored wall block entity stores a complete count-one ItemStack, not
// merely the ID encoded by its visual model. Exercise the actual placement.
const wallNativeKey=b=>'kwl:native_items/'+NS+':wall_record_items/overworld/'+b.location.x+'_'+b.location.y+'_'+b.location.z;
function namedWall({id='minecraft:music_disc_cat',mode='sync',gameMode='survival'}={}){
 reset();placements(mode);const d=new Dimension(),support=d.getBlock({x:0,y:0,z:0});support.setType('minecraft:stone');const p=player(d,gameMode),item=new ItemStack(id);item.maxAmount=1;item.nameTag='My original disc';item.lore=['A gift'];item.data={'other_addon:serial':'disc-42'};item.keepOnDeath=true;p.inv.setItem(0,item);
 const b=d.getBlock({x:0,y:0,z:-1});
 const use=()=>{world.beforeEvents.playerInteractWithBlock.emit({block:support,player:p,blockFace:'north',itemStack:p.inv.getItem(0),isFirstEvent:true});system.flush();};
 return {b,d,p,item,support,use};
}
for(const id of ['minecraft:music_disc_cat',NS+':custom_record'])for(const mode of ['sync','deferred'])for(const exit of ['retrieve','break','support'])test(`named wall disc retains complete stack: ${id} / ${mode} / ${exit}`,()=>{
 const f=namedWall({id,mode});f.use();assert.equal(f.b.typeId,WALL_RECORD);assert.equal(f.p.inv.getItem(0),undefined);
 if(exit==='retrieve'){f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(f.p.inv.getItem(0),f.item);}
 else{if(exit==='break')broken(f.b,f.p);else{f.support.setType('minecraft:air');c.onTick({block:f.b});}assert.equal(live(f.d).length,1);assert.deepEqual(live(f.d)[0].item,f.item);}
 assert.equal(f.b.isAir,true);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);assert.equal(world.getDynamicProperty(key(f.b)),undefined);
});
for(const gameMode of ['creative','Creative'])test(gameMode+' wall placement keeps the held metadata and stores one independent copy',()=>{
 const f=namedWall({gameMode});f.use();assert.deepEqual(f.p.inv.getItem(0),f.item);f.p.inv.setItem(0,undefined);f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(f.p.inv.getItem(0),f.item);
});
for(const failure of ['payment','block','storage'])test('named wall placement rolls back all owned state after '+failure+' failure',()=>{
 const f=namedWall();if(failure==='payment')f.p.inv.failWrite=true;else if(failure==='block')f.d.failSet=true;else world.failSave=true;f.use();assert.equal(f.b.isAir,true);assert.deepEqual(f.p.inv.getItem(0),f.item);assert.equal(world.getDynamicProperty(key(f.b)),undefined);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);assert.equal(live(f.d).length,0);
});
for(const failure of ['inventory','block','storage'])test('named wall retrieval retains original stack after '+failure+' failure',()=>{
 const f=namedWall();f.use();const raw=world.getDynamicProperty(wallNativeKey(f.b));f.p.isSneaking=false;if(failure==='inventory')f.p.inv.failWrite=true;else if(failure==='block')f.d.failSet=true;else world.failSave=true;c.onPlayerInteract({block:f.b,player:f.p});assert.equal(f.b.typeId,WALL_RECORD);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),raw);assert.equal(f.p.inv.getItem(0),undefined);assert.equal(live(f.d).length,0);
 system.currentTick+=5;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(f.p.inv.getItem(0),f.item);
});
for(const failure of ['spawn','storage'])test('named wall break retains original stack after '+failure+' failure',()=>{
 const f=namedWall();f.use();const raw=world.getDynamicProperty(wallNativeKey(f.b));if(failure==='spawn')f.d.failSpawn=true;else world.failSave=true;broken(f.b,f.p);assert.equal(f.b.typeId,WALL_RECORD);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),raw);assert.equal(live(f.d).length,0);
 f.d.failSpawn=false;system.currentTick+=3;broken(f.b,f.p);assert.deepEqual(live(f.d)[0].item,f.item);
});

for(const damage of ['index','required','carrier','token','stack','model'])test('adopted wall refuses bare-ID fallback after '+damage+' damage',async()=>{
 const f=namedWall();f.use();const nativeKey=wallNativeKey(f.b),raw=world.getDynamicProperty(nativeKey),row=JSON.parse(raw),carrier=world.getEntity(row.entity),required=nativeKey.replace('native_items/','native_required/');
 if(damage==='index')world.setDynamicProperty(nativeKey,undefined);
 if(damage==='required')world.setDynamicProperty(required,undefined);
 if(damage==='carrier')carrier.remove();
 if(damage==='token')carrier.setDynamicProperty(NS+':input_token','wrong token');
 if(damage==='stack')carrier.getComponent('minecraft:inventory').container.setItem(0,new ItemStack('minecraft:stone'));
 if(damage==='model')f.b.setPermutation(perm(0));
 const event={block:f.b,player:f.p};world.beforeEvents.playerBreakBlock.emit(event);assert.equal(event.cancel,true);
 f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.equal(f.b.typeId,WALL_RECORD);assert.equal(f.p.inv.getItem(0),undefined);assert.equal(live(f.d).length,0);
});
test('wall stack is recoverable from persisted native index without a machine row or old JS storage instance',async()=>{
 const f=namedWall();f.use();const nativeKey=wallNativeKey(f.b),raw=world.getDynamicProperty(nativeKey),row=JSON.parse(raw);world.setDynamicProperty(key(f.b),undefined);
 const {NativeItemStorage}=await import('../runtime/BP/scripts/freezer-native-storage.js');
 const cold=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),makeStack:(id,n)=>new ItemStack(id,n)});
 const result=cold.read({key:row.key,dimension:f.d,position:f.b.location,ids:[f.item.typeId]});assert.deepEqual(result.items[0],f.item);assert.equal(world.getDynamicProperty(nativeKey),raw);
 for(const name of world.getDynamicPropertyIds()){const value=String(world.getDynamicProperty(name));assert.equal(value.includes('My original disc'),false);assert.equal(value.includes('other_addon:serial'),false);}
 f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(f.p.inv.getItem(0),f.item);
});
test('wall carrier uses shared reanchor without replacing its native metadata',async()=>{
 const f=namedWall();f.use();const nativeKey=wallNativeKey(f.b),raw=world.getDynamicProperty(nativeKey),carrier=world.getEntity(JSON.parse(raw).entity),{readWallRecord}=await import('../runtime/BP/scripts/record-storage.js');carrier.location.x+=2;
 assert.throws(()=>readWallRecord(f.b),/NATIVE_STORAGE_MOVED/);system.flush();assert.deepEqual(readWallRecord(f.b),f.item);assert.equal(world.getDynamicProperty(nativeKey),raw);
});
for(const fault of ['create','slot'])test('wall carrier '+fault+' failure returns the original hand without an adopted index',()=>{
 const f=namedWall(),spawn=f.d.spawnEntity.bind(f.d);f.d.spawnEntity=(...args)=>{if(fault==='create')throw Error('CARRIER_CREATE_FAILED');const e=spawn(...args),inv=e.getComponent('minecraft:inventory').container,set=inv.setItem;let failed=false;inv.setItem=(slot,item)=>{if(item&&!failed){failed=true;throw Error('CARRIER_WRITE_FAILED');}set(slot,item);};e.getComponent=()=>({container:inv});return e;};
 f.use();assert.equal(f.b.isAir,true);assert.deepEqual(f.p.inv.getItem(0),f.item);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);assert.equal(world.getDynamicProperty(key(f.b)),undefined);assert.equal(live(f.d).length,0);
});
for(const replacement of [NS+':freezer',NS+':test_painting','minecraft:jukebox'])for(const fail of [false,true])test('wall break preserves replacement '+replacement+(fail?' on spawn failure':''),async()=>{
 const f=namedWall();f.use();const old=f.b.permutation,raw=world.getDynamicProperty(wallNativeKey(f.b));f.b.setType(replacement);const next=JSON.stringify({type:replacement,input:['minecraft:diamond'],record:NS+':custom_record'});world.setDynamicProperty(key(f.b),next);f.d.failSpawn=fail;
 c.onBreak({block:f.b,brokenBlockPermutation:old,entitySource:f.p});assert.equal(f.b.typeId,replacement);assert.equal(world.getDynamicProperty(key(f.b)),next);
 if(fail){assert.equal(live(f.d).length,0);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),raw);const {readWallRecord}=await import('../runtime/BP/scripts/record-storage.js');assert.deepEqual(readWallRecord(f.b,old),f.item);}
 else{assert.deepEqual(live(f.d)[0].item,f.item);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);}
});
for(const rule of ['creative','no tile drops'])test('wall '+rule+' break clears only its owned carrier without dropping',()=>{
 const f=namedWall();f.use();const raw=JSON.parse(world.getDynamicProperty(wallNativeKey(f.b)));if(rule==='no tile drops')world.gameRules.doTileDrops=false;broken(f.b,rule==='creative'?player(f.d,'creative'):f.p);assert.equal(f.b.isAir,true);assert.equal(live(f.d).length,0);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);assert.equal(world.getEntity(raw.entity),undefined);
});
test('named wall retrieval uses the free hand when every other inventory slot is full',()=>{
 const f=namedWall();f.use();const raw=world.getDynamicProperty(wallNativeKey(f.b));for(let i=1;i<f.p.inv.size;i++)f.p.inv.setItem(i,new ItemStack('minecraft:stone',64));const get=f.p.inv.getItem;
 // A genuine empty main hand is a free inventory slot, so successful retrieval
 // uses that slot even when every other slot is full.
 f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(get(0),f.item);assert.notEqual(raw,undefined);
});
test('wall and replaced jukebox at one coordinate keep separate native stacks and audio ownership',async()=>{
 const f=namedWall(),{planRecordStorage,recordStorageKey,readWallRecord}=await import('../runtime/BP/scripts/record-storage.js');f.b.setType('minecraft:jukebox');const old=new ItemStack(NS+':custom_record');old.nameTag='old jukebox disc';old.lore=['different owner'];const next={type:'minecraft:jukebox',record:old.typeId},mutation=planRecordStorage(f.b,next,{incoming:old});mutation.apply();mutation.finish();f.b.setType('minecraft:air');f.use();
 assert.deepEqual(readWallRecord(f.b),f.item);assert.equal(JSON.parse(world.getDynamicProperty(key(f.b))).type,'minecraft:jukebox');
 const intervals=[],original=system.runInterval;system.runInterval=f=>intervals.push(f);
 try{const {installRecordCleanup}=await import('../runtime/BP/scripts/record-audio.js?wall-ownership-test');installRecordCleanup();}finally{system.runInterval=original;}
 for(const interval of intervals)interval();assert.equal(live(f.d).length,1);assert.deepEqual(live(f.d)[0].item,old);assert.equal(world.getDynamicProperty('kwl:native_items/'+recordStorageKey(f.b)),undefined);assert.deepEqual(readWallRecord(f.b),f.item);assert.equal(f.b.typeId,WALL_RECORD);
 f.p.isSneaking=false;c.onPlayerInteract({block:f.b,player:f.p});assert.deepEqual(f.p.inv.getItem(0),f.item);assert.equal(live(f.d).length,1);
});
for(const failAt of ['native index','display row'])test('named wall placement restores carrier and hand after '+failAt+' write failure',()=>{
 const f=namedWall(),target=failAt==='native index'?wallNativeKey(f.b):key(f.b),set=world.setDynamicProperty;let failed=false;
 world.setDynamicProperty=(k,v)=>{if(k===target&&v!==undefined&&!failed){failed=true;throw Error('INJECTED_WALL_INDEX_WRITE');}set.call(world,k,v);};try{f.use();}finally{world.setDynamicProperty=set;}
 assert.equal(failed,true);assert.equal(f.b.isAir,true);assert.deepEqual(f.p.inv.getItem(0),f.item);assert.equal(world.getDynamicProperty(wallNativeKey(f.b)),undefined);assert.equal(world.getDynamicProperty(wallNativeKey(f.b).replace('native_items/','native_required/')),undefined);assert.equal(world.getDynamicProperty(key(f.b)),undefined);
});
test('new wall display row cannot be mistaken for a legacy jukebox record',async()=>{
 const f=namedWall();f.use();const {savedRecord,hasStoredRecord}=await import('../runtime/BP/scripts/record-storage.js'),row=JSON.parse(world.getDynamicProperty(key(f.b)));assert.equal(row.type,WALL_RECORD);assert.equal(savedRecord(row),false);assert.equal(hasStoredRecord(f.b,row),false);
});
test('retiring a wall clears its own typed row so the replacement jukebox accepts a new disc',async()=>{
 const f=namedWall();f.use();const old=f.b.permutation;f.b.setType('minecraft:jukebox');c.onBreak({block:f.b,brokenBlockPermutation:old,entitySource:f.p});assert.deepEqual(live(f.d)[0].item,f.item);assert.equal(world.getDynamicProperty(key(f.b)),undefined);
 const item=new ItemStack(NS+':custom_record');item.nameTag='new jukebox disc';f.p.inv.setItem(0,item);f.p.isSneaking=false;world.beforeEvents.playerInteractWithBlock.emit({block:f.b,player:f.p,blockFace:'up',itemStack:f.p.inv.getItem(0),isFirstEvent:true});system.flush();assert.equal(f.p.inv.getItem(0),undefined);
 const {ejectRecord}=await import('../runtime/BP/scripts/record-audio.js');ejectRecord(f.b,JSON.parse(world.getDynamicProperty(key(f.b))));assert.deepEqual(live(f.d)[1].item,item);
});
