import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {javaBlockView,sourceFullUpperFace} from '../runtime/BP/scripts/respawn-blocks.js';
import {anchorStandUpStages,selectStandUpPosition,respawnLookAtYaw} from '../runtime/BP/scripts/respawn-adapter.js';
const observation=JSON.parse(fs.readFileSync(new URL('../data/java-parity/minecraft-1.21.1/native-respawn-blocks.json',import.meta.url),'utf8'));
test('actual Native block/core observations retain their narrow scope and source projections',()=>{
 assert.equal(observation.engine,'Bedrock Dedicated Server 1.26.51.1');assert.equal(observation.normalExit,true);assert.deepEqual(observation.errors,[]);assert.equal(observation.cases.length,4);
 assert.equal(observation.sourceModulesUnchanged,true);
 for(const key of ['nativeProductionRespawn','realPlayerSpawnPoint','simulatedPlayers','client','liveMutated','productionReady'])assert.equal(observation.acceptance[key],false,key);
 for(const row of observation.cases){
  assert.equal(row.ok,true);const view=javaBlockView({typeId:row.nativeId,location:{x:0,y:64,z:0},isWaterlogged:false,permutation:{getAllStates:()=>row.nativeStates??{}}});
  if(row.sourceId)assert.equal(view.id,row.sourceId);
  if(row.boxes)assert.deepEqual(view.collisionBoxes(),row.boxes);
  if(row.upperFace!==undefined)assert.equal(sourceFullUpperFace(view.collisionBoxes()),row.upperFace);
  if(row.facing)assert.equal(view.property('facing'),row.facing);
  if(row.part)assert.equal(view.property('part'),row.part);
  if(row.name==='nether_anchor_source_selection'){
   assert.equal(Number(view.property('charges')),row.charges);
   const origin={x:10,y:64,z:10};
   const first=selectStandUpPosition(origin,anchorStandUpStages(),p=>({x:p.x+.5,y:p.y,z:p.z+.5}));
   assert.deepEqual(first,row.selected);assert.equal(respawnLookAtYaw(row.selected,origin),row.yaw);
  }
 }
 assert.match(observation.earlierHarnessAttempt,/not a successful test/);
});
