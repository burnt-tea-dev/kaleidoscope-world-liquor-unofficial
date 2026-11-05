// Actual production break subscriber; native engine objects use the shared fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,BlockPermutation,Dimension,player,reset} from './wall-record-mock.mjs';
import {installFurniture} from '../runtime/BP/scripts/furniture.js';
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
