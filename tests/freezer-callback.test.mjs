import test from 'node:test';
import assert from 'node:assert/strict';
import {world,system,BlockPermutation,Dimension,reset} from './wall-record-mock.mjs';
import {registerFurniture} from '../runtime/BP/scripts/furniture.js';
const N='kaleidoscope_world_liquor',key=N+':storage/overworld/0_0_0';let c;
registerFurniture({blockComponentRegistry:{registerCustomComponent:(id,callbacks)=>{if(id===N+':freezer_redstone')c=callbacks;}}});
function fixture(){reset();const d=new Dimension(),b=d.getBlock({x:0,y:0,z:0});b.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:false}));world.setDynamicProperty(key,JSON.stringify({type:N+':freezer',input:[],fluid:'minecraft:water',remaining:0,output:0,redstonePowered:false}));return {d,b};}
const power=(b,n)=>c.onRedstoneUpdate({block:b,powerLevel:n});
test('real furniture callback defers writes and starts only on falling power',()=>{const {b}=fixture();power(b,15);assert.equal(b.permutation.getState(N+':open'),false);system.flush();assert.equal(b.permutation.getState(N+':open'),true);power(b,0);system.flush();assert.equal(b.permutation.getState(N+':open'),false);assert.equal(JSON.parse(world.getDynamicProperty(key)).remaining,1800);});
test('deferred callback leaves a replaced block and its data untouched',()=>{const {b}=fixture();power(b,15);b.setType('minecraft:stone');const raw=world.getDynamicProperty(key);system.flush();assert.equal(b.typeId,'minecraft:stone');assert.equal(world.getDynamicProperty(key),raw);});
for(const failure of ['save','block'])test(failure+' failure rolls back power state and lid',()=>{const {b,d}=fixture(),raw=world.getDynamicProperty(key);if(failure==='save')world.failSave=true;else d.failSet=true;power(b,15);system.flush();assert.equal(world.getDynamicProperty(key),raw);assert.equal(b.permutation.getState(N+':open'),false);});
test('non-freezer furniture ignores redstone callback',()=>{const {b}=fixture();b.setType(N+':wall_record');const raw=world.getDynamicProperty(key);power(b,15);system.flush();assert.equal(world.getDynamicProperty(key),raw);});
