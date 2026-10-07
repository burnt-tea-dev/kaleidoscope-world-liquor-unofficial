import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {CRAZY_ENABLE_MODDED_EFFECTS,CRAZY_JAVA_EFFECTS,selectCrazyEffects} from '../runtime/BP/scripts/crazy-source.js';
import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
const reference=JSON.parse(fs.readFileSync(new URL('../data/java-parity/neoforge-1.1.11/crazy-effects.json',import.meta.url),'utf8'));
const native=name=>({getName:()=>name});
function moduleFixture(types,typeId='minecraft:zombie'){
 const calls=[];
 const actor={id:'living API fixture',typeId,location:{x:1,y:64,z:2},addEffect:(type,duration,options)=>calls.push({kind:'effect',type,duration,options:{...options}}),dimension:{playSound:(id,at,options)=>calls.push({kind:'sound',id,at:{...at},options:{...options}})}};
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const context=vm.createContext({selectCrazyEffects,AcceptedHurtFeedback,JavaKillCredit,damageCreditMutation,isLivingCombatEntity,CriticalFeedback:class{},MolangVariableMap:class{},readTavernEffects:()=>({}),EffectTypes:{getAll:()=>types},world:{},system:{},ItemStack:class{},actor});
 vm.runInContext(source,context);
 return {actor,calls,apply:(amplifier=0)=>vm.runInContext(`applyEffect(actor,'kaleidoscope_world_liquor:crazy',1,${amplifier})`,context)};
}
test('Minecraft source registration order and the author modded-effects default are explicit',()=>{
 assert.equal(CRAZY_ENABLE_MODDED_EFFECTS,false);assert.equal(reference.enableModdedEffects,false);
 assert.deepEqual(CRAZY_JAVA_EFFECTS.map(name=>'minecraft:'+name),reference.javaRegistryOrder);assert.equal(CRAZY_JAVA_EFFECTS.length,39);
 const selection=selectCrazyEffects([native('minecraft:village_hero'),native('minecraft:speed'),native('minecraft:poison')]);
 assert.deepEqual(selection.effects.map(row=>[row.javaId,row.bedrockId]),[['minecraft:speed','minecraft:speed'],['minecraft:poison','minecraft:poison'],['minecraft:hero_of_the_village','minecraft:village_hero']]);
 assert.equal(selection.missingJavaEffects.length,36);
});
test('fatal poison, later native effects, foreign namespaces and malformed EffectType entries are excluded',()=>{
 const speed=native('speed'),poison=native('minecraft:poison');
 const rejected=['fatal_poison','minecraft:fatal_poison','minecraft:breath_of_the_nautilus','another:speed','kaleidoscope_world_liquor:crazy','minecraft:future_effect'].map(native);
 const selection=selectCrazyEffects([...rejected,{id:'minecraft:strength'},null,{getName:()=>{throw Error('invalid native type');}},poison,speed]);
 assert.deepEqual(selection.effects.map(row=>row.type),[speed,poison]);assert.ok(selection.missingJavaEffects.includes('minecraft:strength'));
 assert.equal(selection.enableModdedEffects,false);
});
test('the observed 38-entry native registry yields 35 source counterparts in Java order and identifies all four missing effects',()=>{
 const types=reference.nativeObservation.names.map(native),selection=selectCrazyEffects(types);
 assert.equal(types.length,38);assert.equal(selection.effects.length,35);
 assert.deepEqual(selection.missingJavaEffects,['minecraft:glowing','minecraft:luck','minecraft:unluck','minecraft:dolphins_grace']);
 assert.deepEqual(selection.effects.map(row=>row.javaId),reference.javaRegistryOrder.filter(id=>!selection.missingJavaEffects.includes(id)));
 for(const excluded of ['minecraft:fatal_poison','minecraft:empty','minecraft:breath_of_the_nautilus'])assert.ok(!selection.effects.some(row=>row.bedrockId===excluded));
 const f=moduleFixture(types);f.apply();assert.equal(f.calls.filter(call=>call.kind==='effect').length,35);assert.equal(f.calls.at(-1).kind,'sound');
});
test('the actual production Crazy branch delivers source duration/amplifier/particle flags to living mobs, then sounds once',()=>{
 const types=[native('minecraft:fatal_poison'),native('minecraft:village_hero'),native('minecraft:instant_damage'),native('minecraft:speed'),native('addon:strength')],f=moduleFixture(types);
 f.apply(2);
 assert.deepEqual(f.calls.map(call=>call.kind),['effect','effect','effect','sound']);
 assert.deepEqual(f.calls.filter(call=>call.kind==='effect').map(call=>call.type.getName()),['minecraft:speed','minecraft:instant_damage','minecraft:village_hero']);
 for(const call of f.calls.filter(call=>call.kind==='effect')){assert.ok(types.includes(call.type));assert.equal(call.duration,200);assert.deepEqual(call.options,{amplifier:2,showParticles:false});}
 assert.deepEqual(f.calls.at(-1),{kind:'sound',id:'kaleidoscope_world_liquor.java.crazy',at:{x:1,y:64,z:2},options:{volume:1,pitch:1.5}});
});
test('a native rejection does not prevent later registry entries or the final source sound',()=>{
 const types=[native('minecraft:speed'),native('minecraft:poison'),native('minecraft:strength')],f=moduleFixture(types,'minecraft:player');
 f.actor.addEffect=(type,duration,options)=>{f.calls.push({kind:'effect',type,duration,options:{...options}});if(type.getName()==='minecraft:strength')throw Error('native immunity or actor state');};
 f.apply();assert.deepEqual(f.calls.map(call=>call.kind),['effect','effect','effect','sound']);assert.equal(f.calls[0].options.amplifier,0);
 const missing=moduleFixture([native('minecraft:fatal_poison')]);missing.apply();assert.deepEqual(missing.calls.map(call=>call.kind),['sound']);
});
