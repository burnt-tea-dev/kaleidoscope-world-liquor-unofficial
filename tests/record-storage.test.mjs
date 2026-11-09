import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,ItemStack,Dimension,player,reset} from './wall-record-mock.mjs';
import {installFurniture} from '../runtime/BP/scripts/furniture.js';
import {ejectRecord} from '../runtime/BP/scripts/record-audio.js';
import {planRecordStorage,recordStorageKey} from '../runtime/BP/scripts/record-storage.js';
import {nativeItemKey,nativeItemRequiredKey} from '../runtime/BP/scripts/freezer-native-storage.js';
const N='kaleidoscope_world_liquor',record=N+':custom_record',key=N+':storage/overworld/0_0_0';
installFurniture();
function fixture(mode='Survival'){
 reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d,mode);p.isSneaking=false;
 const input=new ItemStack(record);input.maxAmount=1;input.nameTag='我的收藏唱片';input.lore=['來自朋友'];input.data={'other_addon:serial':'disc-42'};p.inv.setItem(0,input);
 const use=()=>{world.beforeEvents.playerInteractWithBlock.emit({player:p,block:b,blockFace:'up',itemStack:p.inv.getItem(0),isFirstEvent:true});system.flush();};
 return {d,b,p,input,use,nativeKey:nativeItemKey(recordStorageKey(b))};
}
const metadata=item=>({id:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getLore(),properties:item.getDynamicPropertyIds().map(k=>[k,item.getDynamicProperty(k)])});
for(const mode of ['Survival','Adventure','Creative'])test(`production insert/payment/eject preserves the complete named disc: ${mode}`,()=>{
 const f=fixture(mode);f.use();assert.equal(!!f.p.inv.getItem(0),mode==='Creative');assert.ok(world.getDynamicProperty(f.nativeKey));
 f.p.inv.setItem(0,undefined);f.use();assert.deepEqual(f.d.drops[0].item,f.input);assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(f.nativeKey),undefined);
});
test('spectator cannot insert a custom disc or debit the inventory',()=>{
 const f=fixture('Spectator');f.use();assert.deepEqual(f.p.inv.getItem(0),f.input);
 assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(f.nativeKey),undefined);assert.equal(f.d.drops.length,0);
});
for(const cause of ['break','explosion'])test(`the ${cause} subscriber returns the same adopted metadata`,()=>{
 const f=fixture();f.use();f.b.setType('minecraft:air');
 if(cause==='break')world.afterEvents.playerBreakBlock.emit({block:f.b,player:f.p,brokenBlockPermutation:{type:{id:'minecraft:jukebox'}}});
 else world.afterEvents.explosion.emit({getImpactedBlocks:()=>[f.b]});
 assert.deepEqual(f.d.drops[0].item,f.input);assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(f.nativeKey),undefined);
});
test('inventory payment failure restores the held stack, row and native carrier together',()=>{
 const f=fixture(),set=f.p.inv.setItem;let writes=0;
 f.p.inv.setItem=(i,item)=>{if(++writes===2)throw Error('PAYMENT_ALREADY_DEBITED');set(i,item);};
 f.use();assert.deepEqual(f.p.inv.getItem(0),f.input);assert.equal(world.getDynamicProperty(key),undefined);assert.equal(world.getDynamicProperty(f.nativeKey),undefined);assert.equal(world.getDynamicProperty(nativeItemRequiredKey(recordStorageKey(f.b))),undefined);assert.equal(f.d.drops.length,0);
});
test('insertion row-write failure rolls back the newly created native item',()=>{
 const f=fixture(),set=world.setDynamicProperty;world.setDynamicProperty=(k,v)=>{if(k===key&&v!==undefined)throw Error('ROW_WRITE_FAILED');set.call(world,k,v);};
 try{f.use();}finally{world.setDynamicProperty=set;}
 assert.deepEqual(f.p.inv.getItem(0),f.input);assert.equal(world.getDynamicProperty(f.nativeKey),undefined);assert.equal(world.getDynamicProperty(key),undefined);
});
test('failed native delivery retains the adopted named disc and its saved rows',()=>{
 const f=fixture();f.use();const raw=world.getDynamicProperty(f.nativeKey),row=world.getDynamicProperty(key);f.d.failSpawn=true;assert.throws(()=>ejectRecord(f.b,JSON.parse(row)),/drop failure/);assert.equal(world.getDynamicProperty(f.nativeKey),raw);assert.equal(world.getDynamicProperty(key),row);
 f.d.failSpawn=false;ejectRecord(f.b,JSON.parse(row));assert.deepEqual(metadata(f.d.drops[0].item),metadata(f.input));
});
test('adopted missing native index never falls back to the row type ID',()=>{
 const f=fixture();f.use();const raw=world.getDynamicProperty(key);world.setDynamicProperty(f.nativeKey,undefined);assert.throws(()=>ejectRecord(f.b,JSON.parse(raw)),/NATIVE_STORAGE_MISSING/);assert.equal(f.d.drops.length,0);assert.equal(world.getDynamicProperty(key),raw);
});
test('legacy plain-ID ejection remains available without inventing lost metadata',()=>{
 const f=fixture();f.p.inv.setItem(0,undefined);world.setDynamicProperty(key,JSON.stringify({record}));f.use();assert.equal(f.d.drops.length,1);assert.equal(f.d.drops[0].item.typeId,record);assert.equal(f.d.drops[0].item.nameTag,undefined);assert.equal(world.getDynamicProperty(key),undefined);
});
test('record reanchor accepts replacement furniture while retaining the same native stack',()=>{
 const f=fixture();f.use();const raw=world.getDynamicProperty(f.nativeKey),entity=world.getEntity(JSON.parse(raw).entity);f.b.setType(N+':freezer');const replacement=JSON.stringify({type:N+':freezer',input:['minecraft:diamond']});world.setDynamicProperty(key,replacement);entity.location.x+=2;
 assert.throws(()=>planRecordStorage(f.b,undefined),/NATIVE_STORAGE_MOVED/);system.flush();assert.deepEqual(entity.location,{x:.5,y:.5,z:.5});assert.equal(world.getDynamicProperty(f.nativeKey),raw);assert.equal(world.getDynamicProperty(key),replacement);
 ejectRecord(f.b,JSON.parse(replacement));assert.deepEqual(metadata(f.d.drops[0].item),metadata(f.input));assert.equal(world.getDynamicProperty(key),replacement);
});
