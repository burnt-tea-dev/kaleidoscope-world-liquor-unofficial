/** Verify the bounded runtime helper facts against the actual owned/paired BP
 * definitions. This source check does not inspect a live world or certify Java
 * parity. Missing peers or changed collision declarations fail closed.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {NON_COLLIDABLE_HELPERS} from '../runtime/BP/scripts/respawn-helper-entities.js';

const root=fileURLToPath(new URL('../',import.meta.url));
export const peerSources=Object.freeze({
 tavern:path.resolve(process.env.TAVERN_SOURCE??process.env.TAVERN_ROOT??path.join(root,'../tavern-src')),
 worldLiquor:root,
 grilling:path.resolve(process.env.GRILLING_SOURCE??path.join(root,'../grilling-src'))
});
const entityRoots={tavern:'runtime/BP/entities',worldLiquor:'runtime/BP/entities',grilling:'projects/grilling/gameplay_core/behavior_pack/entities'};
function* jsonFiles(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory())yield* jsonFiles(file);
  else if(entry.isFile()&&entry.name.endsWith('.json'))yield file;
 }
}
export function checkRespawnHelperDefinitions(sources=peerSources){
 const seen=new Set(),counts={};
 for(const [pack,ids] of Object.entries(NON_COLLIDABLE_HELPERS)){
  assert.equal(typeof sources[pack],'string','Missing '+pack+' source root');
  const definitions=new Map();
  for(const file of jsonFiles(path.join(sources[pack],entityRoots[pack]))){
   const definition=JSON.parse(fs.readFileSync(file,'utf8'))['minecraft:entity'];
   assert.ok(definition?.description?.identifier,'Entity definition missing identifier: '+file);
   const id=definition.description.identifier;
   assert.ok(!definitions.has(id),'Duplicate source entity '+id);definitions.set(id,{definition,file});
  }
  for(const id of ids){
   assert.ok(!seen.has(id),'Duplicate helper fact '+id);seen.add(id);
   const row=definitions.get(id);assert.ok(row,'Missing paired helper '+id);
   const components=row.definition.components??{},box=components['minecraft:collision_box'];
   assert.equal(components['minecraft:physics']?.has_collision,false,id+' must disable collision');
   assert.deepEqual(box,{width:0,height:0},id+' must retain an empty collision box');
   for(const [name,group] of Object.entries(row.definition.component_groups??{})){
    assert.ok(!('minecraft:physics' in group),id+' group '+name+' overrides physics');
    assert.ok(!('minecraft:collision_box' in group),id+' group '+name+' overrides collision');
   }
  }
  counts[pack]=ids.length;
 }
 return counts;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify({sourceOnly:true,helpers:checkRespawnHelperDefinitions()}));
}
