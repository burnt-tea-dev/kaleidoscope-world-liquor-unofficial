import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freezerResultHeight,syncFreezerVisuals} from '../runtime/BP/scripts/freezer-visuals.js';
test('result height matches current renderer expressions independently executed by the JVM',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-freezer-height.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.length,20);
 for(const row of rows)assert.equal(freezerResultHeight(row.count,row.max),row.expected,JSON.stringify(row));
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
