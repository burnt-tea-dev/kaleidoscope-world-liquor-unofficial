import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {startFreezerRecipe,freezerPowerTransition as transition} from '../runtime/BP/scripts/freezer-state.js';
import {FREEZER_RECIPES as recipes} from '../runtime/BP/scripts/freezer-recipes.js';
import {LEGACY_FREEZER_RECIPES} from '../runtime/BP/scripts/legacy-freezer-recipes.js';
import {advanceFreezerTick} from '../runtime/BP/scripts/freezer-state.js';
const state=()=>({input:[],fluid:'minecraft:water',remaining:0,output:0,redstonePowered:false});
test('rising power opens, falling power closes and starts the exact recipe once',()=>{const s=state(),a=transition(s,false,true,false,recipes);assert.equal(a.open,true);assert.equal(a.state.remaining,0);const b=transition(a.state,true,false,false,recipes);assert.equal(b.open,false);assert.equal(b.state.recipe,'kaleidoscope_world_liquor:freezer/ice');assert.equal(b.state.remaining,1800);assert.equal(b.state.fluid,null);assert.equal(transition(b.state,false,false,false,recipes).changed,false);assert.equal(s.fluid,'minecraft:water');});
test('repeated power keeps manual overrides and survives serialized reload',()=>{const s={...state(),redstonePowered:true};assert.equal(transition(JSON.parse(JSON.stringify(s)),false,true,false,recipes).changed,false);});
test('blocked lid consumes edge without opening or consuming ingredients',()=>{const s=state(),p=transition(s,false,true,true,recipes);assert.equal(p.open,false);assert.equal(p.state.fluid,s.fluid);assert.equal(transition(p.state,false,true,false,recipes).changed,false);});
test('working machine will not open or overwrite progress on a pulse',()=>{const s={...state(),remaining:123,recipe:'existing'},p=transition(s,false,true,false,recipes);assert.equal(p.open,false);assert.equal(p.state.remaining,123);const q=transition(p.state,false,false,false,recipes);assert.equal(q.state.remaining,123);assert.equal(q.state.recipe,'existing');});
test('existing output and nonmatching input never get consumed',()=>{for(const s of [{...state(),output:1},{...state(),input:['minecraft:diamond']}]){const p=transition({...s,redstonePowered:true},true,false,false,recipes);assert.equal(p.open,false);assert.deepEqual(p.state,{...s,redstonePowered:false});}});
test('manual and redstone close share recipe selection for all five recipes',()=>{for(const r of recipes){const s={...state(),fluid:r.fluid,input:r.ingredients.map(opts=>opts[0])};const manual=startFreezerRecipe(s,recipes),redstone=transition({...s,redstonePowered:true},true,false,false,recipes);assert.equal(manual.recipe,r.id);assert.equal(redstone.state.recipe,r.id);assert.equal(manual.remaining,r.craft_time);}});

test('redstone callbacks use dedicated components only on consumer blocks',async()=>{
 const fs=await import('node:fs');const root=new URL('../runtime/BP/blocks/',import.meta.url);
 for(const file of fs.readdirSync(root))if(file.endsWith('.json')){const b=JSON.parse(fs.readFileSync(new URL(file,root)))['minecraft:block'];for(const id of ['kaleidoscope_world_liquor:freezer_redstone','kaleidoscope_tavern:external_cellar_redstone'])if(id in b.components)assert.ok(b.components['minecraft:redstone_consumer'],file);}
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/furniture.js',import.meta.url),'utf8');assert.ok(!source.split("registerCustomComponent(NS+':furniture',{")[1].split('});}')[0].includes('onRedstoneUpdate'));
});

// Current NeoForge 1.1.11 fixture values, independently preserved from its JAR.
for(const name of ['kita_stuffed_crisp','liangshan_ice_cone','pochi_pudding'])test(name+' starts with the exact current Java dessert timer',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/freezer/'+name+'.json',import.meta.url)));
 const recipe=recipes.find(r=>r.id.endsWith('/'+name));assert.equal(source.craft_time,1200);assert.equal(recipe.craft_time,source.craft_time);
 const before={input:recipe.ingredients.map(options=>options[0]),fluid:recipe.fluid,remaining:0,output:0};
 const after=startFreezerRecipe(before,recipes);assert.equal(after.remaining,source.craft_time);assert.equal(after.recipe,recipe.id);
 assert.deepEqual(after.input,[]);assert.equal(after.fluid,null);assert.equal(before.fluid,recipe.fluid);
});
test('current source lava recipe produces one obsidian and preserves the exact duration',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/freezer/obsidian.json',import.meta.url)));
 const recipe=recipes.find(r=>r.id.endsWith('/obsidian'));assert.deepEqual(recipe.result,source.result);assert.equal(recipe.craft_time,1800);assert.equal(recipe.texture,source.texture);
 assert.equal(recipes.some(r=>r.id.endsWith('/magma_block')),false);assert.equal(startFreezerRecipe({input:[],fluid:'minecraft:lava',remaining:0,output:0},recipes).recipe,recipe.id);
});
test('legacy saved lava batch retains its countdown and three magma outputs, but cannot be selected for new work',()=>{
 const old={recipe:'kaleidoscope_world_liquor:freezer/magma_block',input:[],fluid:null,remaining:1,output:0};const next=advanceFreezerTick(old,[...recipes,...LEGACY_FREEZER_RECIPES]);assert.equal(next.state.remaining,0);assert.equal(next.state.output,3);assert.equal(next.state.recipe,old.recipe);
 assert.deepEqual(old,{recipe:'kaleidoscope_world_liquor:freezer/magma_block',input:[],fluid:null,remaining:1,output:0});
});
test('updating recipes does not restart an already active saved-world batch',()=>{
 const oldBatch={recipe:'kaleidoscope_world_liquor:freezer/pochi_pudding',input:[],fluid:null,remaining:1500,output:0};
 assert.equal(startFreezerRecipe(oldBatch,recipes),oldBatch);
});
