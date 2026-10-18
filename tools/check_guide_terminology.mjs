/** Exact owned display inventory and semantic conservation. No game simulation. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const C=JSON.parse(fs.readFileSync(path.join(root,'data/guide-terminology-config.json'))),LC=['zh_CN','zh_TW','en_US'];
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const clone=x=>structuredClone(x),own=(o,k)=>Object.hasOwn(o,k);
function walk(d){return fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]):[];}
function lang(raw){return Object.fromEntries(raw.split(/\r?\n/).filter(x=>x&&!x.startsWith('#')&&x.includes('=')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)];}));}
function stripDisplay(value){if(Array.isArray(value))return value.map(stripDisplay);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['names','text','mechanics','mechanicsByLocale','fallback','version'].includes(k)).map(([k,v])=>[k,stripDisplay(v)]));return value;}
function references(value,out=new Set()){if(typeof value==='string'&&/^[a-z0-9_]+:[a-z0-9_/:.-]+$/.test(value))out.add(value);else if(Array.isArray(value))value.forEach(x=>references(x,out));else if(value&&typeof value==='object')Object.values(value).forEach(x=>references(x,out));return out;}
async function payload(){
 if(C.name==='grilling')return (await import(pathToFileURL(path.join(root,C.bp,'scripts/guide/payload.js')).href)).GUIDE_PAYLOAD;
 const host=C.name==='tavern'?root:path.resolve(process.env.TAVERN_ROOT||path.join(root,'../tavern'));
 const load=p=>import(pathToFileURL(path.join(host,'runtime/BP/scripts',p)).href);
 const [{ExtensionRegistry},{BUILTIN_RECIPES},{SHAKER_RECIPES},{FLUIDS},{buildCookeryGuidePayload}]=await Promise.all(['core/registry.js','data/recipes.js','data/mixology.js','data/fluids.js','data/cookery-guide-payload.js'].map(load));
 const r=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS});if(C.name!=='tavern')r.install((await import(pathToFileURL(path.join(root,'runtime/BP/scripts/payload.js')).href)).payload);return buildCookeryGuidePayload(r);
}
export async function currentTerminologyInputs(){
 const p=await payload();const entries=p.entries.filter(e=>C.name!=='world-liquor'||e.id.startsWith(C.prefix));
 const ids=references(entries);for(const id of Object.keys(p.names.zh_CN))if(id.startsWith(C.prefix)||C.name==='grilling')ids.add(id);for(const [id,a]of Object.entries(C.aliases)){ids.add(id);ids.add(a.parentId);}
 const names=Object.fromEntries(LC.map(l=>[l,Object.fromEntries([...ids].sort().filter(id=>p.names[l]?.[id]).map(id=>[id,p.names[l][id]]))]));
 const native=Object.fromEntries(LC.map(l=>[l,Object.fromEntries(Object.entries(lang(read(C.rp+'/texts/'+l+'.lang'))).filter(([k])=>!k.includes('kt_assets_')))]));
 const live=walk(path.join(root,C.bp,'blocks')).filter(p=>/\/(?:bottle|cup)_[^/]+\.json$/.test(p)).map(p=>JSON.parse(fs.readFileSync(p))['minecraft:block'].description.identifier).sort();
 const shared=[];if(C.name==='world-liquor'){const host=path.resolve(process.env.TAVERN_ROOT||path.join(root,'../tavern'));for(const l of LC){const other=lang(fs.readFileSync(path.join(host,'runtime/RP/texts',l+'.lang'),'utf8'));for(const [k,v]of Object.entries(native[l]))if(own(other,k)&&!['pack.name','pack.description'].includes(k))shared.push({locale:l,key:k,own:v,peer:other[k]});}}
 return {guide:{entries:clone(entries),names,text:clone(p.text),categories:clone(p.categories)},native,live,shared,runtime:Object.fromEntries(C.runtime.map(p=>[p,read(p)]))};
}
function allStrings(value,out=[]){if(typeof value==='string')out.push(value);else if(Array.isArray(value))value.forEach(x=>allStrings(x,out));else if(value&&typeof value==='object')Object.values(value).forEach(x=>allStrings(x,out));return out;}
const forbidden=['酒嘴','压榨桶','壓榨桶','单瓶架','單瓶架','圆形酒架','圓形酒架','酒窖柜','酒窖櫃','森罗菜刀','森羅菜刀','磨粉机','磨粉機','秘制辣椒油','秘製辣椒油','高级辣椒油','高級辣椒油','酒館空瓶'];
function bodyNumbers(guide){return Object.fromEntries(guide.entries.map(e=>[e.id,Object.fromEntries(LC.map(l=>[l,(e.mechanicsByLocale?.[l]||[]).join('\n').replace(/\b\d+\.\d+\.\d+\b/g,'<VERSION>').match(/\d+(?:\.\d+)?|[一二三四五六七八九十百千万億兩两]+/g)||[]]))]));}
export function validateTerminology(inputs,ledger){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg);};
 check(ledger.schema===1&&ledger.repository===C.name,'wrong glossary identity');
 for(const e of inputs.guide.entries)for(const l of LC){check(typeof inputs.guide.names[l]?.[e.id]==='string'&&inputs.guide.names[l][e.id].trim(),'missing canonical entry name '+e.id+'/'+l);check(Array.isArray(e.mechanicsByLocale?.[l])&&e.mechanicsByLocale[l].length>0&&e.mechanicsByLocale[l].every(x=>typeof x==='string'&&x.trim()),'blank required body '+e.id+'/'+l);}
 const visible=allStrings({guide:inputs.guide,native:inputs.native}).join('\n');for(const term of forbidden)check(!visible.includes(term),'retired visible alias '+term);
 check(!/(?:套用|套用過|apply|install).{0,45}(?:磨盘兼容修补|磨盤相容修補|millstone compatibility patch)/i.test(visible),'obsolete host patch installation instruction');
 check(sha(inputs.guide)===ledger.guide_sha256,'visible guide field inventory changed');
 check(sha(stripDisplay(inputs.guide))===ledger.semantic_sha256,'non-display guide semantics changed');
 check(sha(bodyNumbers(inputs.guide))===ledger.quantity_sha256,'visible quantities changed');
 check(sha(inputs.native)===ledger.native_sha256,'native locale field inventory changed');
 for(const [file,expected]of Object.entries(ledger.runtime_sha256))check(sha(inputs.runtime[file]??'')===expected,'runtime display source changed '+file);
 check(JSON.stringify(inputs.live)===JSON.stringify(Object.keys(C.aliases).sort()),'live placed-state alias coverage differs');
 for(const [id,a]of Object.entries(C.aliases))for(const l of LC){const parent=inputs.guide.names[l][a.parentId]??inputs.native[l]['item.'+a.parentId+'.name'];check(typeof parent==='string','missing live parent '+a.parentId+'/'+l);check(inputs.native[l]['tile.'+id+'.name']===parent+a.suffix[l],'live parent label differs '+id+'/'+l);}
 for(const row of inputs.shared||[])check(row.own===row.peer,'shared locale key conflicts '+row.locale+'/'+row.key);
 for(const row of ledger.native_bindings)check(inputs.native[row.locale]?.[row.key]===(row.exception??inputs.guide.names[row.locale]?.[row.id]),'native concept binding differs '+row.key+'/'+row.locale);
 for(const [id,row]of Object.entries(ledger.concepts))for(const l of LC)check(inputs.guide.names[l]?.[id]===row[l],'canonical concept differs '+id+'/'+l);
 return errors;
}
export async function verifyTerminology(options={}){const ledger=options.ledger??JSON.parse(read('data/guide-terminology.json'));const inputs=options.inputs??await currentTerminologyInputs();const proof=JSON.parse(read('data/guide-terminology-semantic.json'));assert.equal(sha(stripDisplay(inputs.guide)),proof.semantic_sha256,'baseline semantic conservation');assert.deepEqual(proof.quantity_differences,[]);assert.equal(sha(bodyNumbers(inputs.guide)),proof.quantity_before_sha256,'baseline quantity conservation');const errors=validateTerminology(inputs,ledger);assert.deepEqual(errors,[],errors.join('\n'));return ledger.coverage;}
async function selfTest(inputs,ledger){
 const results=[];const negative=(name,mutate)=>{const p=clone(inputs);mutate(p);assert(validateTerminology(p,ledger).length>0,'mutation escaped: '+name);results.push(name);};
 negative('wrong entry name',p=>p.guide.names.zh_CN[p.guide.entries[0].id]='砂轮');
 negative('blank required paragraph',p=>p.guide.entries[0].mechanicsByLocale.zh_CN=['']);
 negative('retired alias on unrelated entry',p=>p.guide.entries.at(-1).mechanicsByLocale.zh_CN.push('酒嘴'));
 negative('arbitrary concept substitution inside prose',p=>p.guide.entries[0].mechanicsByLocale.zh_CN[0]+='砂轮');
 negative('changed recipe identity',p=>{const e=p.guide.entries.find(e=>e.recipes?.length);e.recipes[0].id='probe:wrong';});
 negative('changed recipe quantity',p=>{const e=p.guide.entries.find(e=>e.recipes?.length);e.recipes[0].count=999;});
 negative('changed visible quantity',p=>p.guide.entries[0].mechanicsByLocale.zh_CN[0]+=' 999');
 negative('wrong native label',p=>p.native.zh_CN[Object.keys(p.native.zh_CN)[0]]='wrong');
 negative('shortened mod identity',p=>p.guide.entries.at(-1).mechanicsByLocale.zh_CN.push('森罗菜刀'));
 negative('obsolete patched installation claim',p=>p.guide.entries.at(-1).mechanicsByLocale.zh_CN.push('使用前提：请安装 Cookery 1.6.1 磨盘兼容修补'));
 if(Object.keys(C.aliases).length){const id=Object.keys(C.aliases)[0],a=C.aliases[id];negative('missing placed-state alias',p=>p.live.pop());negative('wrong placed-state native name',p=>p.native.zh_CN['tile.'+id+'.name']='wrong');negative('wrong placed-state parent',p=>p.guide.names.zh_CN[a.parentId]='wrong');}
 if(C.runtime.length){const file=C.name==='tavern'?'runtime/BP/scripts/bedrock/machines.js':'projects/grilling/gameplay_core/behavior_pack/scripts/a2737_offhand_oil_fill_runtime.js',term=C.name==='tavern'?'酒館的空瓶子':'油罐';assert(inputs.runtime[file].includes(term));negative('runtime-visible prompt drift',p=>p.runtime[file]=p.runtime[file].replace(term,'砂轮'));}
 const pressing=inputs.guide.entries.find(e=>e.id.endsWith(':pressing_tub'));if(pressing)negative('pressing tub exact former escape',p=>{const e=p.guide.entries.find(e=>e.id===pressing.id);e.mechanicsByLocale.zh_CN[0]=e.mechanicsByLocale.zh_CN[0].replace('果盆','砂轮');});
 if(C.name==='grilling'){const id='kaleidoscope_grilling:skewer_plate';assert.equal(inputs.guide.names.zh_CN[id],'烤串盘');assert.equal(inputs.native.zh_CN['item.'+id+'.name'],'有烤串的盘子');}
 assert.deepEqual(validateTerminology(inputs,ledger),[],'unmodified positive control including intentional held/placed plate distinction');
 return {negative:results.length,positive:1,probes:results};
}
async function main(){const inputs=await currentTerminologyInputs();if(process.argv.includes('--write-reviewed-candidate')){
 const concepts=Object.fromEntries(Object.keys(inputs.guide.names.zh_CN).map(id=>[id,Object.fromEntries(LC.map(l=>[l,inputs.guide.names[l][id]]))]));
 const native_bindings=[];for(const l of LC)for(const [id,name]of Object.entries(inputs.guide.names[l]))for(const key of ['item.'+id+'.name','tile.'+id+'.name',id,id+'.name'])if(own(inputs.native[l],key)){const value=inputs.native[l][key];const exception=C.name==='grilling'&&id==='kaleidoscope_grilling:skewer_plate'&&key.startsWith('item.');assert(value===name||exception,'unreviewed native/guide name conflict '+l+'/'+key+': '+value+' != '+name);native_bindings.push({locale:l,id,key,...(exception?{exception:value,rationale:'Intentional held plate of skewers versus placed skewer plate state'}:{})});}
 const ledger={schema:1,repository:C.name,source_base:C.base,native_bindings,review_status:'candidate_pending_independent_review',concepts,guide_sha256:sha(inputs.guide),semantic_sha256:sha(stripDisplay(inputs.guide)),quantity_sha256:sha(bodyNumbers(inputs.guide)),native_sha256:sha(inputs.native),runtime_sha256:Object.fromEntries(Object.entries(inputs.runtime).map(([k,v])=>[k,sha(v)])),coverage:{entries:inputs.guide.entries.length,recipes:inputs.guide.entries.reduce((n,e)=>n+(e.recipes?.length||0),0),concepts:Object.keys(concepts).length,guide_strings:allStrings(inputs.guide).length,native_bindings:native_bindings.length,shared_keys:inputs.shared.length,native_fields:LC.reduce((n,l)=>n+Object.keys(inputs.native[l]).length,0),live_aliases:inputs.live.length,runtime_files:C.runtime.length},boundary:'Exact owned source projections, every non-preview locale field, selected actual runtime message-source files. Excludes third-party author originals, debug-log terminology claims, and native/client acceptance.'};
 fs.writeFileSync(path.join(root,'data/guide-terminology.json'),JSON.stringify(ledger,null,2)+'\n');}
 const ledger=JSON.parse(read('data/guide-terminology.json'));await verifyTerminology({inputs,ledger});const result={...ledger.coverage,...(process.argv.includes('--self-test')?await selfTest(inputs,ledger):{})};console.log(JSON.stringify(result,null,2));}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
