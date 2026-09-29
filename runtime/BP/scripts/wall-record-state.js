import {RECORD_MODELS} from './wall-record-models.js';
export const WALL_RECORD='kaleidoscope_world_liquor:wall_record';
const NS='kaleidoscope_world_liquor';
const byModel=new Map(Object.entries(RECORD_MODELS).map(([id,index])=>[index,id]));
// The six original custom-record designs are skins of ONE inventory item.
for(let index=19;index<25;index++)byModel.set(index,NS+':custom_record');
/** Resolve from the placed/broken permutation, never a now-air Block or stale DP.
 * This also recovers existing decorations whose record DP was erased by onPlace.
 * Unknown states fail closed: never guess a disc or silently delete a decoration.
 */
export function wallRecordItem(permutation){
 if(permutation?.type?.id!==WALL_RECORD)throw Error('Not a wall record permutation');
 const group=permutation.getState(NS+':model_group'),variant=permutation.getState(NS+':model_variant');
 if(!Number.isInteger(group)||!Number.isInteger(variant)||group<0||group>4||variant<0||variant>4)throw Error('Invalid wall record model state');
 const item=byModel.get(group*5+variant);
 if(!item)throw Error('Unknown wall record model');
 return item;
}
