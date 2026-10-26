import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freezerResultHeight,freezerIngredientPose,syncFreezerVisuals} from '../runtime/BP/scripts/freezer-visuals.js';
test('result height matches current renderer expressions independently executed by the JVM',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-freezer-height.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);assert.ok(rows.length>0);
 for(const row of rows)assert.equal(freezerResultHeight(row.count,row.max),Math.fround(row.expected),JSON.stringify(row));
});

function visualFixture(){
 const N='kaleidoscope_world_liquor',entities=[],operations={spawn:0,teleport:0,remove:0},states={[N+':open']:true,'kaleidoscope_tavern:facing':0};
 const dimension={id:'minecraft:overworld',getEntities:()=>entities.filter(e=>!e.removed),spawnEntity(typeId,position,{initialRotation}){
  operations.spawn++;const properties=new Map(),entity={typeId,location:Object.fromEntries(Object.entries(position).map(([k,v])=>[k,Math.fround(v)])),rotation:{x:0,y:initialRotation},getRotation(){return {...this.rotation};},getDynamicProperty:k=>properties.get(k),setDynamicProperty:(k,v)=>properties.set(k,v),remove(){operations.remove++;this.removed=true;},teleport(at,{rotation}){operations.teleport++;this.location=Object.fromEntries(Object.entries(at).map(([k,v])=>[k,Math.fround(v)]));this.rotation={...rotation};}};
  entities.push(entity);return entity;
 }};
 const block={location:{x:-17,y:64,z:1000000},dimension,typeId:N+':freezer',permutation:{getState:k=>states[k]}};
 return {N,block,states,entities,operations,sync(state,recipes=[]){syncFreezerVisuals(block,state,recipes);}};
}
test('100 unchanged open-freezer refreshes send no repeated teleports; moved/rotated and missing visuals still reconcile',()=>{
 const f=visualFixture(),state={fluid:'minecraft:water',input:['minecraft:snowball','minecraft:blue_dye']};f.sync(state);
 assert.equal(f.operations.spawn,3);
 for(let i=0;i<100;i++)f.sync(state);
 assert.deepEqual(f.operations,{spawn:3,teleport:0,remove:0});
 f.entities[0].location.x+=.25;f.sync(state);assert.equal(f.operations.teleport,1);
 f.states['kaleidoscope_tavern:facing']=1;f.sync(state);assert.equal(f.operations.teleport,4);
 f.entities[1].remove();f.sync(state);assert.equal(f.operations.spawn,4);
 f.states[f.N+':open']=false;f.sync(state);assert.equal(f.entities.filter(e=>!e.removed).length,0);
});
test('taking one output still changes the Java result height once; an unchanged result sends no movement',()=>{
 const f=visualFixture(),recipes=[{id:'result',texture:'block/ice',result:{count:3}}],state={recipe:'result',output:3};
 f.sync(state,recipes);const result=f.entities[0];assert.equal(result.location.y,Math.fround(64+freezerResultHeight(3,3)));
 f.sync({...state,output:2},recipes);assert.equal(result.location.y,Math.fround(64+freezerResultHeight(2,3)));assert.equal(f.operations.teleport,1);
 f.sync({...state,output:2},recipes);assert.equal(f.operations.teleport,1);
 f.sync({...state,output:0},recipes);assert.equal(result.removed,true);
});

const javaPlacement=JSON.parse(fs.readFileSync(new URL('./fixtures/java-freezer-placement.json',import.meta.url),'utf8'));
test('each original Java input slot keeps its seeded position and yaw across four facings',()=>{
 for(const row of javaPlacement.rows.filter(r=>!r.integer_overflow_only&&!r.block_item)){
  const f=visualFixture();f.block.location=Object.fromEntries(['x','y','z'].map((k,i)=>[k,row.position[i]]));
  f.states['kaleidoscope_tavern:facing']=['NORTH','EAST','SOUTH','WEST'].indexOf(row.facing);
  // Unsupported source items substitute only the existing flat sprite route.
  // This tests shared placement, never the missing item's model or metadata.
  const input=Array(row.slot+1).fill(null);input[row.slot]='minecraft:blue_dye';
  f.sync({input,fluid:row.fluid?'minecraft:water':undefined});
  const entity=f.entities.find(e=>e.getDynamicProperty(f.N+':visual_slot')==='input'+row.slot);assert.ok(entity);
  for(let i=0;i<3;i++){const key=['x','y','z'][i],expected=Math.fround(row.position[i]+row.worldCenter[i]);
   assert.ok(Math.abs(entity.location[key]-expected)<=Math.max(1e-6,Math.abs(expected)*1e-7),JSON.stringify({row,key,actual:entity.location[key],expected}));}
  const facing=[180,-90,0,90][f.states['kaleidoscope_tavern:facing']];
  const angle=((entity.rotation.y-(facing-row.yaw))%360+540)%360-180;
  assert.ok(Math.abs(angle)<.0001,JSON.stringify({row,rotation:entity.rotation}));
  entity.rotation.y=Math.fround(entity.rotation.y+360);
  f.sync({input,fluid:row.fluid?'minecraft:water':undefined});
  assert.equal(f.operations.teleport,0,'wrapped float32 rotation: '+JSON.stringify(row));
 }
});
test('sampled placement matches original Java float operations, including signed integer overflow',()=>{
 for(const row of javaPlacement.rows){
  const position=Object.fromEntries(['x','y','z'].map((k,i)=>[k,row.position[i]]));
  const pose=freezerIngredientPose(position,row.slot,row.fluid);
  assert.equal(pose.x,Math.fround(row.sample[0]),JSON.stringify(row));
  assert.equal(pose.z,Math.fround(row.sample[2]),JSON.stringify(row));
  assert.equal(pose.yaw,Math.fround(row.yaw),JSON.stringify(row));
  if(!row.block_item)assert.equal(pose.y,Math.fround(row.sample[1]),JSON.stringify(row));
 }
});
test('unsupported and empty inputs keep original slot numbers; reopening restores the same pose',()=>{
 const f=visualFixture(),state={input:['minecraft:sugar','minecraft:blue_dye',null,'minecraft:blue_dye']};
 f.sync(state);let inputs=f.entities.filter(e=>!e.removed);assert.deepEqual(inputs.map(e=>e.getDynamicProperty(f.N+':visual_slot')),['input1','input3']);
 const before=inputs.map(e=>({location:{...e.location},rotation:e.getRotation()}));
 f.sync({...state,fluid:'other_pack:fluid'});assert.equal(f.operations.spawn,2);
 assert.ok(inputs.every(e=>e.location.y===Math.fround(64+Math.fround(.65))));
 f.sync(state);assert.deepEqual(inputs.map(e=>({location:{...e.location},rotation:e.getRotation()})),before);
 const reconciled=f.operations.teleport;
 for(const e of inputs)e.rotation.y=Math.fround(e.rotation.y+360);
 for(let i=0;i<100;i++)f.sync(state);
 assert.equal(f.operations.teleport,reconciled,'equivalent float32 rotation must not cause repeated updates');
 f.states[f.N+':open']=false;f.sync(state);f.states[f.N+':open']=true;f.sync(state);
 inputs=f.entities.filter(e=>!e.removed);assert.deepEqual(inputs.map(e=>({location:{...e.location},rotation:e.getRotation()})),before);
});
