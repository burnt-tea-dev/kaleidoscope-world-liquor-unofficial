import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bedStandUpOffsets,bedStandUpStages,anchorStandUpStages,selectStandUpPosition,respawnFloorHeight,findSafeDismount,forcedRespawnPosition,respawnLookAtYaw,sharedSpawnSearchPlan,sharedSpawnColumns,findSharedSpawn} from '../development/respawn/respawn-source.js';
const rows=fs.readFileSync(new URL('./fixtures/java-respawn.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('reviewed source numeric rules match executed Java expressions, including float yaw and radius edge cases',()=>{
 for(const row of rows){
  if(row.kind==='bed')assert.deepEqual(bedStandUpOffsets(row.facing,row.angle).map(p=>[p.x,p.z]),row.expected,JSON.stringify(row));
  else if(row.kind==='yaw')assert.equal(respawnLookAtYaw(row.position,{x:0,y:0,z:0}),row.expected,JSON.stringify(row));
  else if(row.kind==='columns'){
   const plan=sharedSpawnSearchPlan(row.radius,row.distance);assert.deepEqual(plan,row.expectedPlan);
   const values=[];for(const p of sharedSpawnColumns({x:0,z:0},plan,()=>row.start)){values.push([p.x,p.z]);if(values.length===row.expected.length)break;}assert.deepEqual(values,row.expected);
  }else assert.fail('Unknown Java oracle kind');
 }
 assert.equal(rows.length,60);
});
test('bed bunk and anchor run a complete strict pass before allowing dangerous candidates',()=>{
 const normal=bedStandUpStages('north',0);assert.deepEqual(normal.map(s=>[s.checkDanger,s.dy,s.offsets.length]),[[true,0,12],[false,0,12]]);
 const bunk=bedStandUpStages('north',0,true);assert.deepEqual(bunk.map(s=>[s.checkDanger,s.dy,s.offsets.length]),[[true,0,10],[true,-1,10],[true,0,2],[false,0,10],[false,-1,10],[false,0,2]]);
 const anchor=anchorStandUpStages();assert.equal(anchor[0].offsets.length,25);assert.deepEqual(anchor[0].offsets.slice(0,8).map(p=>[p.x,p.y,p.z]),[[0,0,-1],[-1,0,0],[0,0,1],[1,0,0],[-1,0,-1],[1,0,-1],[-1,0,1],[1,0,1]]);assert.deepEqual(anchor[0].offsets[24],{x:0,y:1,z:0});
 const visited=[];const selected=selectStandUpPosition({x:0,y:64,z:0},anchor,(p,strict)=>{visited.push([p,strict]);return !strict?p:null;});
 assert.equal(visited.length,26);assert.deepEqual(selected,{x:0,y:64,z:-1});assert.ok(visited.slice(0,25).every(p=>p[1]));
 const laterStrict=selectStandUpPosition({x:0,y:64,z:0},normal,(p,strict)=>p.x===-1&&strict?p:!strict?p:null);assert.deepEqual(laterStrict,{x:-1,y:64,z:2});
});
test('source floor height accepts partial shapes in the candidate cell and reads below only for empty cells',()=>{
 let calls=0;assert.equal(respawnFloorHeight(.5625,()=>{calls++;return 1;}),.5625);assert.equal(calls,0);
 assert.equal(respawnFloorHeight(null,1),0);assert.equal(respawnFloorHeight(null,1.5),.5);assert.equal(respawnFloorHeight(null,.5),-Infinity);assert.equal(respawnFloorHeight(null,null),-Infinity);
 assert.throws(()=>respawnFloorHeight(undefined,1));assert.throws(()=>respawnFloorHeight(null,undefined));
 const block={x:2,y:64,z:3},events=[];
 const environment={isDangerous:p=>(events.push(['danger',p.y]),false),floorHeight:()=>.5625,collides:p=>(events.push(['collision',p.y]),false),invalidSpawnInside:p=>(events.push(['invalid',p.y]),false),insideBorder:p=>(events.push(['border',p.y]),true)};
 assert.deepEqual(findSafeDismount(block,true,environment),{x:2.5,y:64.5625,z:3.5});assert.deepEqual(events.map(p=>p[0]),['danger','collision','invalid','invalid','border']);
 events.length=0;assert.equal(findSafeDismount(block,true,{...environment,floorHeight:()=>0,isDangerous:p=>(events.push(['danger',p.y]),p.y===63)}),null);assert.deepEqual(events,[['danger',64],['danger',63]]);
 assert.equal(findSafeDismount(block,false,{...environment,collides:()=>true}),null);assert.throws(()=>findSafeDismount(block,true,{...environment,isDangerous:()=>undefined}));
});
test('forced spawn uses source y+.1 without floor checks and requires known passability for both cells',()=>{
 const visited=[];assert.deepEqual(forcedRespawnPosition({x:-2,y:60,z:3},37.7,p=>(visited.push(p.y),true)),{position:{x:-1.5,y:60.1,z:3.5},yaw:Math.fround(37.7),pitch:0});assert.deepEqual(visited,[60,61]);
 assert.equal(forcedRespawnPosition({x:0,y:60,z:0},0,p=>p.y===60),null);assert.throws(()=>forcedRespawnPosition({x:0,y:60,z:0},undefined,()=>true));assert.throws(()=>forcedRespawnPosition({x:0,y:60,z:0},0,()=>undefined));
});
test('shared radius zero probes the one source column then adjusts the original Y with full callbacks',()=>{
 const calls=[];const common={spawn:{x:12,y:64,z:30},hasSkyLight:true,adventure:false,spawnRadius:0,borderDistance:100,nextInt:n=>(calls.push(['random',n]),0),findColumn:p=>(calls.push(['column',p]),null),canStand:p=>(calls.push(['stand',p.y]),p.y>=67),minY:-64,maxY:320};
 assert.deepEqual(findSharedSpawn(common),{x:12,y:67,z:30});assert.deepEqual(calls.slice(0,2),[['random',1],['column',{x:12,z:30}]]);assert.equal(calls.filter(p=>p[0]==='column').length,1);
 assert.deepEqual(findSharedSpawn({...common,findColumn:p=>({...p,y:81}),canStand:()=>true}),{x:12,y:81,z:30});
 let readSearch=false;assert.deepEqual(findSharedSpawn({...common,adventure:true,nextInt:()=>{readSearch=true;throw Error();},canStand:p=>p.y>=65}),{x:12,y:65,z:30});assert.equal(readSearch,false);
 assert.throws(()=>findSharedSpawn({...common,findColumn:()=>undefined}));assert.throws(()=>findSharedSpawn({...common,canStand:()=>undefined}));
});
