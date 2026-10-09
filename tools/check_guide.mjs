/** Canonical data projection audit. No mocked game, world, inventory, or player. */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const hostRoot=process.env.TAVERN_ROOT?pathToFileURL(path.resolve(process.env.TAVERN_ROOT)+path.sep):new URL('../../tavern-src/',import.meta.url);
import assert from 'node:assert/strict';
import {payload as addon} from '../runtime/BP/scripts/payload.js';
const {ExtensionRegistry}=await import(new URL('runtime/BP/scripts/core/registry.js',hostRoot));
const {BUILTIN_RECIPES}=await import(new URL('runtime/BP/scripts/data/recipes.js',hostRoot));
const {FLUIDS}=await import(new URL('runtime/BP/scripts/data/fluids.js',hostRoot));
const {buildCookeryGuidePayload}=await import(new URL('runtime/BP/scripts/data/cookery-guide-payload.js',hostRoot));
const {encodeCookeryGuideMessages,cookery106WirePayload}=await import(new URL('runtime/BP/scripts/core/cookery-guide-publisher.js',hostRoot));
const {SHAKER_RECIPES}=await import(new URL('runtime/BP/scripts/data/mixology.js',hostRoot));
const {standaloneGuideView,GUIDE_LANGUAGES}=await import(new URL('runtime/BP/scripts/core/standalone-guide-model.js',hostRoot));
const registry=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS});
registry.install(addon);
const payload=buildCookeryGuidePayload(registry);
const byId=new Map(payload.entries.map(e=>[e.id,e]));
assert.equal(byId.size,payload.entries.length,'Duplicate product pages');
const categories=new Set(payload.categories.map(c=>c.id));
for(const e of payload.entries){
 assert(categories.has(e.category),e.id+' missing category');
 for(const lc of ['en_US','zh_CN','zh_TW']){
  assert(payload.names[lc][e.id],e.id+' missing name '+lc);
  assert(e.mechanicsByLocale[lc]?.length||e.recipes?.length,e.id+' missing instructions '+lc);
  for(const row of e.mechanicsByLocale[lc]){
   if(lc==='en_US')assert(!/[\u4e00-\u9fff]/u.test(row),e.id+' Chinese leaked into English: '+row);
   assert(!/(?:kaleidoscope_(?:tavern|world_liquor|cookery)|minecraft):[a-z]/.test(row),e.id+' raw ID in guide: '+row);
  }
 }
}
for(const p of addon.pages){
 const entry=byId.get(p.item);assert(entry,p.item+' not projected');
 assert(payload.categories.find(c=>c.id===entry.category)?.parent,'Addon page needs a small entrance');
 assert.equal(entry.recipes?.length??0,p.preparations?.length??p.recipeIds.length);
 assert.equal(entry.icon,p.icon);
 if(p.preparations?.length)assert.deepEqual(entry.recipes,p.preparations,'SDK discarded native preparation');
 for(const rid of p.recipeIds){
  const recipe=addon.recipes.find(r=>r.id===rid);
  const preparation=entry.recipes.find(r=>r.method===({barrel:'Barrel',shaker:'Shaker'})[recipe.kind]);
  assert(preparation,rid+' preparation missing');
 }

}
assert(!payload.entries.some(e=>e.category==='extensions'),'World Liquor dumped into Extensions');
const around=byId.get('kaleidoscope_world_liquor:around_the_world');
for(const lc of ['zh_CN','zh_TW']){
 const labels=around.recipes[0].ingredients.map(id=>payload.names[lc][id]);
 assert(labels.every(x=>x.includes(lc==='zh_TW'?'調酒材料':'调酒材料')));
 const aroundRecipe=standaloneGuideView(payload,lc,{type:'recipe',id:around.id,index:0});
 assert.equal(aroundRecipe.body.split(lc==='zh_TW'?'品質 4':'品质 4').length-1,1,'Quality restriction belongs once in the shared recipe instructions');
 assert(labels[0].includes('蓝')||labels[0].includes('藍'));
 assert(labels[1].includes('黄')||labels[1].includes('黃'));assert(labels[2].includes('红')||labels[2].includes('紅'));
 assert.equal(byId.get('kaleidoscope_world_liquor:cola').category,'mixers');
 assert.equal(byId.get('kaleidoscope_world_liquor:tonic_water').category,'mixers');
 assert(!labels.some(x=>x.includes('環遊世界')||x.includes('环游世界')));
}
for(const lc of ['en_US','zh_CN','zh_TW'])for(const [id,label]of Object.entries(payload.names[lc]))if(id.includes('/ingredient_'))assert(!/\b(?:minecraft|kaleidoscope_\w+):/.test(label),id+' unresolved '+lc+': '+label);
assert(!byId.get('kaleidoscope_world_liquor:freezer').recipes?.length,'Freezer should explain operation, recipes belong to foods');
assert.equal(payload.entries.filter(e=>e.recipes?.some(r=>r.method==='Freezer')).length,3);
const extras=addon.recipes.filter(r=>r.output.item?.startsWith('kaleidoscope_tavern:'));
for(const r of extras){assert(byId.has(r.output.item));assert(!byId.has(r.id),'Extra core recipe left as duplicate page');}
const wire=cookery106WirePayload(payload);
assert(wire.entries.every(e=>e.mechanics.length<=8&&e.mechanics.every(row=>row.length<=512)));
for(const e of payload.entries)for(const lc of ['en_US','zh_CN','zh_TW']){const w=wire.entries.find(w=>w.id===e.id);assert(w.mechanicsByLocale[lc].length<=8);for(const line of e.mechanicsByLocale[lc])assert(w.mechanicsByLocale[lc].join('\n').includes(line),e.id+' lost '+lc+' instruction');}
assert.deepEqual(buildCookeryGuidePayload(registry),payload,'Wire conversion mutated the original locale map');
for(const e of payload.entries){const text=wire.entries.find(w=>w.id===e.id).mechanics.join('\n');for(const lc of ['zh_TW','en_US'])for(const line of e.mechanicsByLocale[lc])assert(text.includes(line),'Wire removed instructions: '+e.id);}
const messages=encodeCookeryGuideMessages(payload);
// Regress the actual reported product through both shared guide entrances.
for(const lc of GUIDE_LANGUAGES){
 const ice=byId.get('kaleidoscope_world_liquor:ice_tea_q1');
 const view=standaloneGuideView(payload,lc,{type:'recipe',id:ice.id,index:0});
 assert(view.body.includes('×4 (4000 mB)'),'Ice tea must explain the full barrel volume');
 assert.equal(view.body.split(payload.names[lc]['minecraft:water_bucket']).length-1,1,'Four repeated water IDs returned');
 assert(view.body.includes(payload.names[lc]['kaleidoscope_tavern:empty_bottle']),'Bottling instructions missing');
 assert(view.body.includes(lc==='en_US'?'2 min':lc==='zh_TW'?'2 分鐘':'2 分钟'),'Source aging time missing');
 assert(!/\b(?:minecraft|kaleidoscope_\w+):/.test(view.body),'Unresolved recipe labels');
 assert.equal(wire.entries.find(e=>e.id===ice.id).recipes[0].preparation.amount,4000,'Optional entrance must retain full recipe data');
}
assert.deepEqual(buildCookeryGuidePayload(registry),payload,'Guide projection mutates between reads');
const chunkText=messages.slice(1,-1).map(m=>m.message.split('\n').slice(4).join('\n')).join('');
assert.deepEqual(JSON.parse(chunkText),wire,'Guide packet round-trip lost text');
const wine=JSON.parse(fs.readFileSync(new URL('runtime/BP/items/wine_q1.json',hostRoot)));
assert(wine['minecraft:item'].components['minecraft:tags'].tags.includes('kaleidoscope_tavern:alcohol'),'Record diagram example not in actual alcohol tag');
const report={entries:payload.entries.length,addonProducts:addon.pages.length,categories:payload.categories.length,
 barrelRecipes:addon.recipes.filter(r=>r.kind==='barrel').length,shakerRecipes:addon.recipes.filter(r=>r.kind==='shaker').length,
 extraCoreRecipes:extras.length,preparationRecipes:addon.pages.reduce((n,p)=>n+(p.preparations?.length??p.recipeIds.length),0),
 guidePackets:messages.length,guidePacketLimit:514,rawIdsInInstructions:false,cookery106BilingualFallback:true,modernHostLocalized:true,hostStepLimitsChecked:true,playerSimulation:false};
const version=JSON.parse(fs.readFileSync(new URL('../runtime/BP/manifest.json',import.meta.url))).header.version;
assert(Array.isArray(version)&&version.length===3&&version.every(n=>Number.isSafeInteger(n)&&n>=0),'Invalid pack version');
fs.writeFileSync(new URL(`../docs/GUIDE-VALIDATION-${version.join('.')}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
fs.mkdirSync(new URL('../dist/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../dist/combined-guide-review.json',import.meta.url),JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify(report));

const {checkGuideContract}=await import(new URL('tools/guide_contract.mjs',hostRoot));
const navigation=checkGuideContract(payload);
fs.writeFileSync(new URL('../dist/guide-navigation-review.json',import.meta.url),JSON.stringify(navigation,null,2)+'\n');
console.log(JSON.stringify(navigation));
