import test from 'node:test';
import assert from 'node:assert/strict';
import {startFreezerRecipe,freezerPowerTransition as transition} from '../runtime/BP/scripts/freezer-state.js';
import {FREEZER_RECIPES as recipes} from '../runtime/BP/scripts/freezer-recipes.js';
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
