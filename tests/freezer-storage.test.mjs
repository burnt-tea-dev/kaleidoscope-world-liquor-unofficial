import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Dimension,ItemStack,BlockPermutation,reset,system} from './wall-record-mock.mjs';
import {readFreezerItems,planFreezerStorage,freezerStorageKey,freezerNativeItems,installFreezerStoragePinning} from '../runtime/BP/scripts/freezer-storage.js';
import {nativeItemKey,NATIVE_STORAGE_OWNER} from '../runtime/BP/scripts/freezer-native-storage.js';
const N='kaleidoscope_world_liquor';
function fixture(input=[]){reset();const d=new Dimension(),b=d.getBlock({x:0,y:64,z:0});b.setPermutation(BlockPermutation.resolve(N+':freezer'));const state={type:b.typeId,input:input.slice(),fluid:null,remaining:0,output:0};world.setDynamicProperty(freezerStorageKey(b),JSON.stringify(state));return {b,d,key:freezerStorageKey(b),state};}
function append(f,name='first',id='minecraft:sugar'){
 const item=new ItemStack(id,3);item.nameTag=name;item.lore=['opaque '+name];item.data={foreign:{serial:name}};
 const old=JSON.parse(world.getDynamicProperty(f.key)),next={...old,input:[...old.input,id]},m=planFreezerStorage(f.b,next,{incoming:item});m.apply();m.finish();return item;
}
test('legacy IDs are readable without entities and adopted alongside complete incoming stacks',()=>{
 const f=fixture(['minecraft:ice','minecraft:apple']);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.deepEqual(readFreezerItems(f.b,f.state).filter(Boolean).map(x=>x.typeId),f.state.input);
 const incoming=append(f);const state=JSON.parse(world.getDynamicProperty(f.key)),items=readFreezerItems(f.b,state);assert.equal(items[0].typeId,'minecraft:ice');assert.equal(items[1].typeId,'minecraft:apple');incoming.amount=1;assert.deepEqual(items[2],incoming);assert.equal(items[3],undefined);
});
test('API vector enumeration/order is not mistaken for different block coordinates',()=>{
 const f=fixture();append(f);const state=JSON.parse(world.getDynamicProperty(f.key)),position=f.b.location;
 f.b.location={z:position.z,y:position.y,x:position.x};assert.equal(readFreezerItems(f.b,state)[0].nameTag,'first');
 f.b.location=Object.defineProperties({},{x:{get:()=>position.x},y:{get:()=>position.y},z:{get:()=>position.z}});assert.equal(JSON.stringify(f.b.location),'{}');assert.equal(readFreezerItems(f.b,state)[0].nameTag,'first');
 f.b.location={...position,x:position.x+1};assert.throws(()=>freezerNativeItems.read({key:f.key,dimension:f.d,position:f.b.location,ids:state.input}),/NATIVE_STORAGE_MISMATCH/);
});
test('same-ID stacks retain distinct native metadata and exact last-slot removal',()=>{
 const f=fixture();append(f,'first');append(f,'second');const old=JSON.parse(world.getDynamicProperty(f.key));assert.deepEqual(readFreezerItems(f.b,old).filter(Boolean).map(x=>x.nameTag),['first','second']);
 const m=planFreezerStorage(f.b,{...old,input:old.input.slice(0,-1)});assert.equal(m.removed[0].stack.nameTag,'second');m.apply();m.finish();assert.equal(readFreezerItems(f.b,JSON.parse(world.getDynamicProperty(f.key)))[0].nameTag,'first');
});
test('failed machine-row write restores native inventory, markers and original row',()=>{
 const f=fixture();append(f);const raw=world.getDynamicProperty(f.key),marker=world.getDynamicProperty(nativeItemKey(f.key)),before=readFreezerItems(f.b,JSON.parse(raw));const m=planFreezerStorage(f.b,{...JSON.parse(raw),input:[]});
 const set=world.setDynamicProperty;world.setDynamicProperty=(key,value)=>{if(key===f.key&&value!==raw)throw Error('ROW_WRITE_FAILED');set.call(world,key,value);};
 try{assert.throws(()=>m.apply(),/ROW_WRITE_FAILED/);m.rollback();}finally{world.setDynamicProperty=set;}
 assert.equal(world.getDynamicProperty(f.key),raw);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),marker);assert.deepEqual(readFreezerItems(f.b,JSON.parse(raw)),before);
});
test('craft retirement consumes input once; rollback before finish keeps the same carrier',()=>{
 const f=fixture();append(f);const raw=world.getDynamicProperty(f.key),marker=world.getDynamicProperty(nativeItemKey(f.key)),e=world.getEntity(JSON.parse(marker).entity),m=planFreezerStorage(f.b,{...JSON.parse(raw),input:[],remaining:1200});m.apply();assert.equal(e.isValid,true);m.rollback();assert.equal(world.getDynamicProperty(f.key),raw);assert.equal(world.getEntity(e.id),e);
 const next=planFreezerStorage(f.b,{...JSON.parse(raw),input:[],remaining:1200});next.apply();next.finish();assert.equal(e.isValid,false);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),undefined);assert.deepEqual(readFreezerItems(f.b,JSON.parse(world.getDynamicProperty(f.key))).filter(Boolean),[]);
});
test('missing carrier, wrong owner and wrong contents reject without recreating plain IDs',()=>{
 for(const fault of ['missing','owner','contents']){
  const f=fixture();append(f);const raw=world.getDynamicProperty(f.key),marker=JSON.parse(world.getDynamicProperty(nativeItemKey(f.key))),e=world.getEntity(marker.entity);
  if(fault==='missing')e.remove();else if(fault==='owner')e.setDynamicProperty(NATIVE_STORAGE_OWNER,'foreign');else e.getComponent('minecraft:inventory').container.setItem(0,new ItemStack('minecraft:diamond'));
  assert.throws(()=>readFreezerItems(f.b,JSON.parse(raw)),/NATIVE_STORAGE_/);assert.equal(world.getDynamicProperty(f.key),raw);assert.equal(JSON.parse(world.getDynamicProperty(nativeItemKey(f.key))).entity,marker.entity);
 }
});
test('owned moved carrier is reanchored after the strict read, preserving native metadata',()=>{
 const f=fixture();append(f);const raw=world.getDynamicProperty(f.key),marker=world.getDynamicProperty(nativeItemKey(f.key)),e=world.getEntity(JSON.parse(marker).entity);installFreezerStoragePinning();e.location.x+=2;
 assert.throws(()=>readFreezerItems(f.b,JSON.parse(raw)),/NATIVE_STORAGE_MOVED/);system.flush();assert.deepEqual(e.location,{x:.5,y:64.5,z:.5});assert.equal(world.getDynamicProperty(f.key),raw);assert.equal(world.getDynamicProperty(nativeItemKey(f.key)),marker);assert.equal(readFreezerItems(f.b,JSON.parse(raw))[0].nameTag,'first');
});
