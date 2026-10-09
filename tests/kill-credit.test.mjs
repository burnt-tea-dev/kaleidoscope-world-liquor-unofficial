import {AcceptedHurtFeedback} from '../runtime/BP/scripts/accepted-hurt-feedback.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import vm from 'node:vm';
import {JavaKillCredit,damageCreditMutation,isLivingCombatEntity} from '../runtime/BP/scripts/kill-credit.js';
import {VANILLA_LIVING_ENTITIES} from '../runtime/BP/scripts/vanilla-living-entities.js';
import * as rules from '../runtime/BP/scripts/combat-source.js';
const actor=(id,typeId='minecraft:zombie',tame)=>({id,typeId,getComponent:key=>key==='minecraft:health'?{currentValue:20}:key==='minecraft:type_family'?{hasTypeFamily:family=>family==='mob'}:key==='minecraft:tameable'?tame:undefined});
function fixture(){let now=0;const entities=new Map(),credit=new JavaKillCredit({now:()=>now,resolve:id=>entities.get(id)});return {credit,entities,time:value=>now=value,hit:(id,owner,cancel=false)=>{const row=credit.begin(id,{cancel,damage:4,damageSource:{cause:'entityAttack',damagingEntity:owner}},damageCreditMutation({damagingEntity:owner}));if(row)row.accepted=true;return row;}};}
test('fresh first hit has no credit; previous owner governs ownerless and switched-owner damage',()=>{
 const f=fixture(),a=actor('A'),b=actor('B');f.entities.set(a.id,a);f.entities.set(b.id,b);
 assert.equal(f.credit.previous('target'),undefined);const first=f.hit('target',a);assert.equal(f.credit.previous('target'),a);f.credit.complete(first);
 f.time(1);assert.equal(f.credit.previous('target'),a);const switched=f.hit('target',b);f.credit.complete(switched);assert.equal(f.credit.previous('target'),b);
});
test('same-tick provisional ownership respects a later addon cancel and completion reordering',()=>{
 const f=fixture(),a=actor('A'),b=actor('B');f.entities.set(a.id,a);f.entities.set(b.id,b);
 const first=f.hit('target',a);first.event.cancel=true;assert.equal(f.credit.previous('target'),undefined);
 const second=f.hit('target',b);assert.equal(f.credit.previous('target'),b);f.credit.complete(second);f.credit.complete(first);assert.equal(f.credit.previous('target'),b);assert.equal(f.credit.pending.size,0);
});
test('recent player credit wins over a newer mob; expires at source 101-tick boundary',()=>{
 const f=fixture(),p=actor('P','minecraft:player'),m=actor('M');f.entities.set(p.id,p);f.entities.set(m.id,m);
 f.credit.complete(f.hit('target',p));f.time(50);f.credit.complete(f.hit('target',m));f.time(100);assert.equal(f.credit.previous('target'),p);f.time(101);assert.equal(f.credit.previous('target'),m);f.time(151);assert.equal(f.credit.previous('target'),undefined);f.credit.prune();assert.equal(f.credit.states.size,0);
});
test('tamed mob owner replaces player credit; an ownerless tame clears it, wild mobs retain it',()=>{
 const f=fixture(),p=actor('P','minecraft:player'),pet=actor('pet','minecraft:wolf',{isTamed:true,tamedToPlayerId:'P'}),wild=actor('wild');for(const a of [p,pet,wild])f.entities.set(a.id,a);
 f.credit.complete(f.hit('target',pet));assert.equal(f.credit.previous('target'),p);f.credit.complete(f.hit('target',wild));assert.equal(f.credit.previous('target'),p);
 pet.getComponent=key=>key==='minecraft:health'?{currentValue:20}:key==='minecraft:type_family'?{hasTypeFamily:()=>true}:key==='minecraft:tameable'?{isTamed:true}:undefined;
 f.credit.complete(f.hit('target',pet));assert.equal(f.credit.previous('target'),pet);
});
test('dead mob, unload and missing player are handled without adopting a different owner',()=>{
 const f=fixture(),p=actor('P','minecraft:player'),m=actor('M');f.entities.set(p.id,p);f.entities.set(m.id,m);f.credit.complete(f.hit('target',m));m.getComponent=()=>({currentValue:0});assert.equal(f.credit.previous('target'),undefined);
 f.credit.complete(f.hit('target',p));f.entities.delete(p.id);assert.equal(f.credit.previous('target'),undefined);f.credit.forget('target');assert.equal(f.credit.states.size,0);
});
test('nonliving health-bearing vehicles and removed actor handles never update credit',()=>{
 const boat={id:'boat',typeId:'minecraft:boat',getComponent:key=>key==='minecraft:health'?{currentValue:20}:undefined};assert.equal(damageCreditMutation({damagingEntity:boat}),undefined);assert.equal(damageCreditMutation({damagingEntity:{getComponent(){throw Error('removed');}}}),undefined);
 assert.deepEqual(damageCreditMutation({damagingEntity:actor('stand','minecraft:armor_stand')}),{mob:'stand',playerChanged:false,player:undefined});
});
test('familyless vanilla LivingEntity classification is independent of remaining health',()=>{
 for(const typeId of ['cod','salmon','pufferfish','tropicalfish','tadpole','squid','glow_squid','axolotl']){
  for(const currentValue of [3,0]){
   const entity={typeId:'minecraft:'+typeId,isValid:true,getComponent:key=>key==='minecraft:health'?{currentValue}:key==='minecraft:type_family'?{hasTypeFamily:family=>family==='aquatic'}:undefined};
   assert.equal(isLivingCombatEntity(entity),true,typeId+' health='+currentValue);
  }
 }
});
test('the complete vanilla class facts match the paired Tavern LivingEntity authority',async()=>{
 const root=fileURLToPath(new URL('../',import.meta.url));
 const peer=path.resolve(process.env.TAVERN_SOURCE??process.env.TAVERN_ROOT??path.join(root,'../tavern-src'));
 const {VANILLA_INSTANT_ENTITIES}=await import(pathToFileURL(path.join(peer,'runtime/BP/scripts/data/vanilla-instant-entities.js')).href);
 const expected=Object.keys(VANILLA_INSTANT_ENTITIES).filter(id=>VANILLA_INSTANT_ENTITIES[id].living===true).sort();
 assert.equal(expected.length,84,'reviewed Minecraft 1.21.1 Native counterparts');
 assert.deepEqual(Object.keys(VANILLA_LIVING_ENTITIES).sort(),expected);
 assert.ok(Object.isFrozen(VANILLA_LIVING_ENTITIES));
 for(const typeId of expected){
  assert.equal(VANILLA_LIVING_ENTITIES[typeId],true,'class facts must not import potion or damage policy');
  const entity={typeId,isValid:true,getComponent:key=>key==='minecraft:health'?{currentValue:0}:undefined};
  assert.equal(isLivingCombatEntity(entity),true,typeId+' remains LivingEntity without mob family at zero health');
 }
});
test('the class gate retains explicit addon mob support and rejects health-only or invalid handles',()=>{
 const entity=(typeId,families=[],isValid=true,health=true)=>({typeId,isValid,getComponent:key=>key==='minecraft:health'&&health?{currentValue:3}:key==='minecraft:type_family'?{hasTypeFamily:family=>families.includes(family)}:undefined});
 assert.equal(isLivingCombatEntity(entity('addon:otter',['mob'])),true);
 for(const typeId of ['minecraft:boat','minecraft:xp_orb','kaleidoscope_tavern:effect_anchor','addon:health_only','toString','__proto__']){
  assert.equal(isLivingCombatEntity(entity(typeId)),false,typeId);
 }
 assert.equal(isLivingCombatEntity(entity('minecraft:cod',[],false)),false);
 assert.equal(isLivingCombatEntity(entity('minecraft:zombie',['mob'],false)),false);
 assert.equal(isLivingCombatEntity(entity('minecraft:cod',[],true,false)),false);
 assert.equal(isLivingCombatEntity({typeId:'minecraft:cod',getComponent(){throw Error('removed');}}),false);
});
test('a familyless fish can own accepted damage but a dead fish cannot supply later kill credit',()=>{
 const f=fixture(),health={currentValue:3},fish={id:'cod-credit',typeId:'minecraft:cod',isValid:true,getComponent:key=>key==='minecraft:health'?health:key==='minecraft:type_family'?{hasTypeFamily:family=>['aquatic','cod','fish'].includes(family)}:undefined};
 f.entities.set(fish.id,fish);
 const mutation=damageCreditMutation({damagingEntity:fish});
 assert.deepEqual(mutation,{mob:fish.id,playerChanged:false,player:undefined});
 const event={damage:1,damageSource:{cause:'entityAttack',damagingEntity:fish}},row=f.credit.begin('target',event,mutation);
 assert.equal(row.accepted,false);
 f.credit.applied({...event,hurtEntity:{id:'target'}});
 assert.equal(row.accepted,true);f.credit.complete(row);
 assert.equal(f.credit.previous('target'),fish);
 health.currentValue=0;
 assert.equal(isLivingCombatEntity(fish),true,'LivingEntity remains its class after damage');
 assert.equal(f.credit.previous('target'),undefined,'getKillCredit separately requires the mob to remain alive');
});
test('production hurt callback uses previous credit for environmental damage and does not proc on the first hit',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const a=actor('A'),b=actor('B'),target=actor('target'),entities=new Map([a,b,target].map(e=>[e.id,e])),states=new Map([[a,{double_damage:{amplifier:4}}]]),sounds=[],pending=[];
 for(const e of entities.values()){e.location={x:0,y:0,z:0};e.dimension={playSound:(...args)=>sounds.push(args)};}
 const system={currentTick:0,run:fn=>pending.push(fn)},ctx=vm.createContext({AcceptedHurtFeedback,CriticalFeedback:class{queue(){} applied(){}},MolangVariableMap:class{},...rules,JavaKillCredit,damageCreditMutation,isLivingCombatEntity,world:{getEntity:id=>entities.get(id)},system,readTavernEffects:e=>states.get(e)??{},EffectTypes:{},ItemStack:class{},Math:Object.assign(Object.create(Math),{random:()=>0})});vm.runInContext(source,ctx);
 const hit=(owner,cause='entityAttack',cancel=false)=>{const event={hurtEntity:target,damage:4,cancel,damageSource:{damagingEntity:owner,cause}};ctx.event=event;vm.runInContext('hurt(event);acceptedFeedback.applied(event)',ctx);return event;};
 assert.equal(hit(a).damage,4);assert.equal(hit(undefined,'fire').damage,8);assert.equal(hit(b).damage,8);assert.equal(hit(undefined,'fire').damage,4);vm.runInContext('for (const rows of killCredit.pending.values()) for (const row of rows) row.accepted=true;',ctx);pending.splice(0).forEach(fn=>fn());assert.equal(sounds.length,2);
 system.currentTick=101;assert.equal(hit(a).damage,4);vm.runInContext('for (const rows of killCredit.pending.values()) for (const row of rows) row.accepted=true;',ctx);pending.splice(0).forEach(fn=>fn());
 const canceled=hit(b);canceled.cancel=true;pending.splice(0).forEach(fn=>fn());assert.equal(hit(undefined,'fire').damage,8);
});

test('native rejection without cancel never overwrites committed kill credit',()=>{const f=fixture(),a=actor('A'),b=actor('B');f.entities.set(a.id,a);f.entities.set(b.id,b);f.credit.complete(f.hit('target',a));const rejected=f.hit('target',b);rejected.accepted=false;f.credit.complete(rejected);assert.equal(f.credit.previous('target'),a);});
test('credit priorities, expiry and pre-update selection match Java source-state evaluation',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-kill-credit.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);let f;
 for(const row of rows){
  if(row.op==='reset'){f=fixture();for(const owner of [actor('A'),actor('B'),actor('P','minecraft:player'),actor('pet','minecraft:wolf',{isTamed:true,tamedToPlayerId:'P'})])f.entities.set(owner.id,owner);}
  else if(row.op==='advance'){f.time(row.now);assert.equal(f.credit.previous('target')?.id??null,row.credit,JSON.stringify(row));}
  else{assert.equal(f.credit.previous('target')?.id??null,row.before,JSON.stringify(row));let owner=f.entities.get(row.owner);if(row.kind==='ownerless_tame')owner=actor('pet','minecraft:wolf',{isTamed:true});const claim=owner&&f.hit('target',owner);if(claim){claim.accepted=row.accepted;claim.event.cancel=!row.accepted;f.credit.complete(claim);}assert.equal(f.credit.previous('target')?.id??null,row.after,JSON.stringify(row));}
 }
});
test('accepted native hurt acknowledgement selects the matching owner and ignores canceled rows',()=>{
 const f=fixture(),a=actor('A'),b=actor('B');f.entities.set(a.id,a);f.entities.set(b.id,b);
 const event={cancel:false,damage:4,damageSource:{cause:'entityAttack',damagingEntity:a}},row=f.credit.begin('target',event,damageCreditMutation(event.damageSource));
 f.credit.applied({hurtEntity:{id:'target'},damage:4,damageSource:{cause:'entityAttack',damagingEntity:b}});assert.equal(row.accepted,false);
 f.credit.applied({hurtEntity:{id:'target'},damage:4,damageSource:event.damageSource});assert.equal(row.accepted,true);f.credit.complete(row);assert.equal(f.credit.previous('target'),a);
});

test('production LivingDamage adapter does not run critical effects or credit on a health-bearing boat',()=>{
 const source=fs.readFileSync(new URL('../runtime/BP/scripts/effects.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const','const').replaceAll('export function','function');
 const a=actor('A','minecraft:player'),boat={id:'boat',typeId:'minecraft:boat',getComponent:key=>key==='minecraft:health'?{currentValue:20}:undefined},queued=[];
 const ctx=vm.createContext({AcceptedHurtFeedback,...rules,JavaKillCredit,damageCreditMutation,isLivingCombatEntity,CriticalFeedback:class{queue(){queued.push(1);} applied(){}},MolangVariableMap:class{},world:{getEntity:()=>a},system:{currentTick:0,run(){}},readTavernEffects:()=>({ground_crit:{amplifier:4},double_damage:{amplifier:4}}),EffectTypes:{},ItemStack:class{},Math:Object.assign(Object.create(Math),{random:()=>0})});
 vm.runInContext(source,ctx);ctx.event={hurtEntity:boat,damage:4,damageSource:{cause:'entityAttack',damagingEntity:a}};vm.runInContext('hurt(event)',ctx);assert.equal(ctx.event.damage,4);assert.equal(queued.length,0);assert.equal(vm.runInContext('killCredit.pending.size',ctx),0);
});
