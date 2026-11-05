// Actual production break subscriber; native engine objects use the shared fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,BlockPermutation,ItemStack,Dimension,player,reset} from './wall-record-mock.mjs';
import {installFurniture} from '../runtime/BP/scripts/furniture.js';
import {playRecord} from '../runtime/BP/scripts/record-audio.js';
const record='kaleidoscope_world_liquor:custom_record',key='kaleidoscope_world_liquor:storage/overworld/0_0_0';
installFurniture();

for(const mode of ['Survival','Creative'])for(const tileDrops of [true,false])test(`destroyed jukebox returns its stored disc once: ${mode}, doTileDrops=${tileDrops}`,()=>{
 reset();world.gameRules.doTileDrops=tileDrops;
 const d=new Dimension(),block=d.getBlock({x:0,y:0,z:0}),p=player(d,mode);
 // afterEvents sees the already-destroyed block; the saved disc is the content.
 world.setDynamicProperty(key,JSON.stringify({type:'minecraft:jukebox',record}));
 const event={block,player:p,dimension:d,brokenBlockPermutation:BlockPermutation.resolve('minecraft:jukebox')};
 world.afterEvents.playerBreakBlock.emit(event);
 assert.equal(d.drops.length,1,'container contents must not disappear with the block');
 assert.equal(d.drops[0].item.typeId,record);assert.equal(d.drops[0].item.amount,1);
 assert.equal(world.getDynamicProperty(key),undefined);
 world.afterEvents.playerBreakBlock.emit(event);system.flush();assert.equal(d.drops.length,1,'the consumed saved row cannot emit a second disc');
});

for(const full of [false,true])test(`manual jukebox ejection drops into the world without changing inventory: full=${full}`,()=>{
 reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d,'Survival');p.isSneaking=false;
 if(full)for(let i=0;i<p.inv.size;i++)p.inv.setItem(i,new ItemStack('minecraft:stone',64));
 const before=Array.from({length:p.inv.size},(_,i)=>p.inv.getItem(i)),state={type:'minecraft:jukebox',record};
 world.setDynamicProperty(key,JSON.stringify(state));const sound=playRecord(b,state);
 const event={player:p,block:b,blockFace:'up',itemStack:p.inv.getItem(0),isFirstEvent:true};
 world.beforeEvents.playerInteractWithBlock.emit(event);assert.equal(event.cancel,true);system.flush();
 assert.equal(d.drops.filter(e=>!e.removed).length,1,'Java ejects the disc into the world');
 assert.deepEqual(Array.from({length:p.inv.size},(_,i)=>p.inv.getItem(i)),before);
 assert.equal(world.getDynamicProperty(key),undefined);assert.equal(b.typeId,'minecraft:jukebox');assert.equal(sound.stops,1);
 world.beforeEvents.playerInteractWithBlock.emit({...event});system.flush();assert.equal(d.drops.filter(e=>!e.removed).length,1);
});

for(const mode of ['Creative','Adventure','Spectator'])test(`manual ejection respects ${mode} interaction`,()=>{
 reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d,mode);p.isSneaking=false;
 world.setDynamicProperty(key,JSON.stringify({record}));
 world.beforeEvents.playerInteractWithBlock.emit({player:p,block:b,blockFace:'up',isFirstEvent:true});system.flush();
 const allowed=mode!=='Spectator';assert.equal(d.drops.length,allowed?1:0);assert.equal(!!world.getDynamicProperty(key),!allowed);
});
for(const heldIn of ['mainhand','offhand'])test(`sneaking with occupied ${heldIn} leaves native block interaction available`,()=>{
 reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d,'Survival');
 const item=new ItemStack('minecraft:stone');if(heldIn==='mainhand')p.inv.setItem(0,item);
 else{const component=p.getComponent;p.getComponent=id=>id==='minecraft:equippable'?{getEquipment:()=>item}:component(id);}
 world.setDynamicProperty(key,JSON.stringify({record}));const event={player:p,block:b,blockFace:'up',itemStack:p.inv.getItem(0),isFirstEvent:true};
 world.beforeEvents.playerInteractWithBlock.emit(event);system.flush();assert.notEqual(event.cancel,true);assert.equal(d.drops.length,0);assert.ok(world.getDynamicProperty(key));
});
test('a changed accepted hand does not eject a disc on the later tick',()=>{
 reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setType('minecraft:jukebox');const p=player(d,'Survival');p.isSneaking=false;
 const item=new ItemStack('minecraft:stone');item.nameTag='accepted';p.inv.setItem(0,item);world.setDynamicProperty(key,JSON.stringify({record}));
 world.beforeEvents.playerInteractWithBlock.emit({player:p,block:b,blockFace:'up',itemStack:item,isFirstEvent:true});
 item.nameTag='changed';p.inv.setItem(0,item);system.flush();assert.equal(d.drops.length,0);assert.ok(world.getDynamicProperty(key));
});
