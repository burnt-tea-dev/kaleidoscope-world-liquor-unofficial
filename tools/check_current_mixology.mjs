/** Execute current source recipes against the actual shared Tavern matcher. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {payload} from '../runtime/BP/scripts/payload.js';
import {CONTENT} from '../runtime/BP/scripts/content.js';
const host=pathToFileURL(path.resolve(process.env.TAVERN_ROOT??'../tavern-src')+path.sep);
const {ExtensionRegistry}=await import(new URL('runtime/BP/scripts/core/registry.js',host));
const {SHAKER_RECIPES}=await import(new URL('runtime/BP/scripts/data/mixology.js',host));
const {FLUIDS}=await import(new URL('runtime/BP/scripts/data/fluids.js',host));
const {inputSnapshot,signaturePayload}=await import(new URL('runtime/BP/scripts/core/mixology.js',host));
const {matchShakerRecipe}=await import(new URL('runtime/BP/scripts/core/mixology-categories.js',host));
const source=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/reference.json',import.meta.url)));
assert.equal(source.file_id,9066406);
assert.deepEqual(payload.shakerColors.map(row=>row.color),[8606770,16351261,3847130,15961002]);
const r=new ExtensionRegistry({recipes:SHAKER_RECIPES,fluids:FLUIDS});r.install(payload);
// NeoForge1.1.12 / Forge1.1.13 share this updated Maotai table. The actual
// host matcher must expose it to signatures as well as direct drink consumers.
const maotai=JSON.parse(fs.readFileSync(new URL('../upstream/data/kaleidoscope_world_liquor/datamap/drink_effect/maotai.json',import.meta.url)));
for(const content of [CONTENT,payload.content])assert.deepEqual(content.find(row=>row.base===maotai.item).effects,maotai.effects);
for(const q of [4,5,6])assert.deepEqual(inputSnapshot(maotai.item+'_q'+q,r).effects,maotai.effects[q-1]);
// Current author data, shared by Forge1.1.13 and NeoForge1.1.12.
// Check both direct drink admission and the actual host's mixology projection.
const dassai=JSON.parse(fs.readFileSync(new URL('../upstream/data/kaleidoscope_world_liquor/datamap/drink_effect/dassai.json',import.meta.url)));
for(const content of [CONTENT,payload.content])assert.deepEqual(content.find(row=>row.base===dassai.item).effects,dassai.effects);
for(const q of [4,5,6]){
 const input=inputSnapshot(dassai.item+'_q'+q,r);
 assert.deepEqual(input.effects,dassai.effects[q-1]);
 const expected=dassai.effects[q-1].find(effect=>effect.effect==='kaleidoscope_world_liquor:luck');
 assert.equal(signaturePayload([input,input,input]).effects.find(effect=>effect.effect==='kaleidoscope_world_liquor:luck').amplifier,expected.amplifier);
}
const recipes=payload.recipes.filter(row=>row.kind==='shaker');assert.equal(recipes.length,18);
let cases=0;
for(const recipe of recipes){
 const original=source.shaker_recipes[recipe.id.split('/').at(-1)];
 assert.deepEqual(recipe.ingredients,original.ingredients);
 assert.equal(recipe.output.item,original.result.id);
 const resolved=r.recipe(recipe.id),[a,b,c]=resolved.ingredients.map(options=>({item:options[0]}));
 assert(a.item&&b.item&&c.item,recipe.id+' has no current candidates');
 for(const inputs of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]){
  assert(matchShakerRecipe(resolved,inputs,r.categoryCatalog),recipe.id);
  assert.equal(r.findShaker(inputs)?.output.item,recipe.output.item,recipe.id);cases++;
 }
}
for(const [item,color] of [['kaleidoscope_tavern:mother_snow_q4',3847130],['kaleidoscope_tavern:sunset_glow_q4',16351261],['kaleidoscope_tavern:sakura_wine_q4',15961002],['kaleidoscope_world_liquor:ice_tea_q4',8606770]])assert.equal(inputSnapshot(item,r).color,color,item);
for(const q of [1,2,3])assert.throws(()=>inputSnapshot('kaleidoscope_world_liquor:jack_daniel_q'+q,r),/QUALITY_TOO_LOW/);
assert.equal(payload.content.find(row=>row.item==='kaleidoscope_world_liquor:highball').effects[0].duration,600);
const cola=inputSnapshot('kaleidoscope_world_liquor:cola',r),signature=signaturePayload([cola,cola,cola]);
assert.deepEqual(signature.effects,[
 {effect:'minecraft:haste',duration:54,amplifier:0,probability:1},
 {effect:'minecraft:speed',duration:54,amplifier:0,probability:1},
]);
const {installContent}=await import(new URL('runtime/BP/scripts/core/extension-content.js',host));
const {cocktailLore}=await import(new URL('runtime/BP/scripts/core/cocktail-tooltip.js',host));
installContent('kaleidoscope_world_liquor',payload.content);
const cocktailNames=payload.content.filter(row=>row.kind==='cocktail').flatMap(row=>
 cocktailLore({typeId:row.item}).flatMap(line=>line.rawtext)
  .filter(message=>message.translate?.startsWith('effect.kaleidoscope_world_liquor.'))
  .map(message=>({item:row.item,key:message.translate})));
assert(cocktailNames.length>0,'no World Liquor cocktail effect names were exercised');
for(const locale of ['en_US','zh_CN','zh_TW']){
 const lines=fs.readFileSync(new URL(`../runtime/RP/texts/${locale}.lang`,import.meta.url),'utf8').split(/\r?\n/);
 const names=new Map(lines.filter(line=>!line.startsWith('#')&&line.includes('='))
  .map(line=>[line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
 for(const {item,key} of cocktailNames)assert(names.get(key)?.trim(),`${locale}: ${item} tooltip has no translation for ${key}`);
}
console.log(JSON.stringify({currentJavaVersion:'NeoForge1.1.12 selected changes; inherited1.1.11 recipes',recipes:18,recipeOrderCases:cases,extraColors:4,coreReclassification:true,highballSourceEffectData:true,localizedCocktailEffects:cocktailNames.length,actualFlightImplemented:false,simulatedPlayers:false}));
