import {syncFreezerVisuals} from '../runtime/BP/scripts/freezer-visuals.js';
const N='kaleidoscope_world_liquor',out=[];
for(const facing of [0,1,2,3])for(const wet of [false,true]){
 const entities=[];
 const block={location:{x:0,y:64,z:0},typeId:N+':freezer',permutation:{getState:k=>k===N+':open'?true:facing},dimension:{id:'minecraft:overworld',getEntities:()=>[],spawnEntity(typeId,location,{initialRotation}){const p={};const e={typeId,location,rotation:initialRotation,setDynamicProperty(k,v){p[k]=v;},properties:p};entities.push(e);return e;}}};
 syncFreezerVisuals(block,{fluid:wet?'minecraft:water':null,input:['minecraft:blue_dye','minecraft:snowball','minecraft:slime_ball','minecraft:blue_dye']},[]);out.push({facing,wet,entities});
}
console.log(JSON.stringify(out,null,2));
