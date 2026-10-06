import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {isTreasureBlock,treasureBlockChance,addTreasureBlockDrops} from '../runtime/BP/scripts/treasure-block.js';
const permutation=(id,tags=[])=>({type:{id},hasTag:tag=>tags.includes(tag)});
test('eligibility follows captured current Java crop/ore tags and native redstone aliases',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../data/java-treasure-block-source.json',import.meta.url)));
 for(const id of source.vanilla_ore_ids)assert.equal(isTreasureBlock(permutation(id)),true,id);
 for(const id of source.vanilla_crop_tag.values)assert.equal(isTreasureBlock(permutation(id==='minecraft:beetroots'?'minecraft:beetroot':id)),true,id);
 for(const id of ['minecraft:lit_redstone_ore','minecraft:lit_deepslate_redstone_ore'])assert.equal(isTreasureBlock(permutation(id)),true);
 for(const id of ['minecraft:nether_wart','minecraft:cocoa','minecraft:stone','fixture:imaginary_ore','fixture:pretty_crop'])assert.equal(isTreasureBlock(permutation(id)),false,id);
 for(const tag of ['minecraft:crops','kaleidoscope_world_liquor:crop_block','c:ores','forge:ores','c:ores/netherite_scrap'])assert.equal(isTreasureBlock(permutation('fixture:tagged', [tag])),true,tag);
 assert.equal(isTreasureBlock(permutation('fixture:unreferenced_subtag',['c:ores/imaginary'])),false);
});
test('ore and crop use the same source15% base with the exact threshold and cap',()=>{
 assert.equal(treasureBlockChance(0),.15);assert.equal(treasureBlockChance(5),.4);assert.equal(treasureBlockChance(255),1);
 const event={brokenBlockPermutation:permutation('minecraft:diamond_ore')};let generated=0;
 assert.equal(addTreasureBlockDrops(event,0,{generateLootFromBlockPermutation(){generated++;}},()=>.17),0);
 assert.equal(addTreasureBlockDrops(event,0,{generateLootFromBlockPermutation(){generated++;}},()=>.15),0);assert.equal(generated,0);
});
test('source state and pre-break tool are rerolled once, cloned fully and dropped at block center',()=>{
 const oldTool={id:'pre-break tool',durability:1,enchantments:['fortune']},laterTool={id:'after-break tool'},original=permutation('minecraft:wheat'),cloned={id:'source loot including components'},spawned=[];let calls=0;
 const event={brokenBlockPermutation:original,itemStackBeforeBreak:oldTool,itemStackAfterBreak:laterTool,block:{location:{x:-2,y:64,z:3},typeId:'minecraft:air'},dimension:{spawnItem:(stack,at)=>spawned.push({stack,at}),getEntities(){throw Error('must not inspect unrelated nearby item entities');}}};
 const manager={generateLootFromBlockPermutation(state,tool){calls++;assert.equal(state,original);assert.equal(tool,oldTool);return [{typeId:'minecraft:wheat',amount:1,clone:()=>cloned},{typeId:'minecraft:air',amount:1},{typeId:'minecraft:wheat_seeds',amount:0}];}};
 assert.equal(addTreasureBlockDrops(event,0,manager,()=>.149999),1);assert.equal(calls,1);assert.deepEqual(spawned,[{stack:cloned,at:{x:-1.5,y:64.5,z:3.5}}]);
});
test('empty Native loot result never falls back to duplicating other drops or rerolling with a different tool',()=>{
 let generated=0,spawned=0;const event={brokenBlockPermutation:permutation('minecraft:ancient_debris'),block:{location:{x:0,y:64,z:0}},dimension:{spawnItem(){spawned++;}}};
 assert.equal(addTreasureBlockDrops(event,0,{generateLootFromBlockPermutation(state,tool){generated++;assert.equal(tool,undefined);return undefined;}},()=>0),0);assert.equal(generated,1);assert.equal(spawned,0);
});
test('the actual registered break callback uses the source effect amplifier and skips inactive effects',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 let callback,enabled=false;const manager={},calls=[],subscribe={subscribe(){}},actor={id:'break API snapshot'};
 const world={beforeEvents:{entityHurt:subscribe},afterEvents:{entityHurt:subscribe,entityRemove:subscribe,playerSpawn:subscribe,playerLeave:subscribe,playerButtonInput:subscribe,entityDie:subscribe,playerBreakBlock:{subscribe:fn=>callback=fn}},getLootTableManager:()=>manager};
 const ctx=vm.createContext({world,system:{afterEvents:{scriptEventReceive:subscribe},runInterval(){}},readTavernEffects:()=>enabled?{treasure_guide:{amplifier:2}}:{},JavaKillCredit:class{},AcceptedHurtFeedback:class{},CriticalFeedback:class{},MolangVariableMap:class{},addTreasureBlockDrops:(...args)=>calls.push(args)});
 vm.runInContext(source+'\ninstallEffects();',ctx);const event={player:actor};callback(event);assert.equal(calls.length,0);enabled=true;callback(event);assert.deepEqual(calls,[[event,2,manager]]);
});
