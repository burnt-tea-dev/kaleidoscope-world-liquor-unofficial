import {JAVA_BLOCK_CATALOG,JAVA_BLOCK_FLAGS} from './respawn-catalog.js';
/** A requested source fact is unresolved, rather than a proven rejected site. */
export class UnknownRespawnFact extends Error {
 constructor(fact,position){super('Unresolved Java respawn fact: '+fact);this.name='UnknownRespawnFact';this.fact=fact;this.position=position&&{...position};}
}
const sourceRows=new Map();
function rowsFor(id){
 if(sourceRows.has(id))return sourceRows.get(id);
 const meta=JAVA_BLOCK_CATALOG.blocks[id],names=Object.keys(meta.properties).sort();
 const rows=meta.rows.map(packed=>({
  properties:Object.fromEntries(names.map((name,index)=>[name,meta.properties[name][packed[index+3]]])),
  row:packed,dynamic:meta.dynamic_shape
 }));
 sourceRows.set(id,rows);return rows;
}
function nativeStates(block){try{return block.permutation.getAllStates();}catch{throw new UnknownRespawnFact('loaded block permutation',block?.location);}}
function booleanState(value){return typeof value==='boolean'?String(value):undefined;}
function stateProjection(block){
 const states=nativeStates(block),properties={};let id=block.typeId;
 const add=(name,value)=>{if(value!==undefined)properties[name]=String(value);};
 // These are declared source projections, not a Native collision-shape API.
 // Native legacy stone has one material discriminator; never call granite stone.
 if(id==='minecraft:stone'&&states.stone_type!==undefined){const types={stone:'stone',granite:'granite',granite_smooth:'polished_granite',diorite:'diorite',diorite_smooth:'polished_diorite',andesite:'andesite',andesite_smooth:'polished_andesite'};if(!types[states.stone_type])throw new UnknownRespawnFact('stone material',block.location);id='minecraft:'+types[states.stone_type];}
 if(id==='minecraft:bed'){
  id='minecraft:white_bed';add('facing',['south','west','north','east'][states.direction]);add('part',typeof states.head_piece_bit==='boolean'?(states.head_piece_bit?'head':'foot'):undefined);add('occupied',booleanState(states.occupied_bit));
 }
 const domains=JAVA_BLOCK_CATALOG.blocks[id]?.properties;if(!domains)throw new UnknownRespawnFact('source block identity '+id,block.location);
 if(domains.facing)add('facing',states['minecraft:cardinal_direction']);
 if(domains.axis)add('axis',states.pillar_axis);
 if(domains.charges)add('charges',Number.isInteger(states.respawn_anchor_charge)?states.respawn_anchor_charge:undefined);
 if(domains.waterlogged){const waterlogged=block.isWaterlogged;if(typeof waterlogged==='boolean')add('waterlogged',waterlogged);}
 if(domains.type&&id.endsWith('_slab')){add('type',states['minecraft:vertical_half']);if(states.top_slot_bit!==undefined){const half=states.top_slot_bit?'top':'bottom';if(properties.type!==undefined&&properties.type!==half)throw new UnknownRespawnFact('conflicting slab half',block.location);add('type',half);}}
 if(domains.half)add('half',states['minecraft:vertical_half']);
 if(domains.open)add('open',booleanState(states.open_bit));
 if(domains.in_wall)add('in_wall',booleanState(states.in_wall_bit));
 if(domains.half&&id.endsWith('_door'))add('half',typeof states.upper_block_bit==='boolean'?(states.upper_block_bit?'upper':'lower'):undefined);
 if(domains.half&&id.endsWith('_trapdoor'))add('half',typeof states.upside_down_bit==='boolean'?(states.upside_down_bit?'top':'bottom'):undefined);
 for(const side of ['north','east','south','west'])if(domains[side]){
  const connection=states['minecraft:connection_'+side];if(typeof connection==='boolean')add(side,String(connection));
  const wall=states['wall_connection_type_'+side];if(wall!==undefined)add(side,{none:'none',short:'low',tall:'tall'}[wall]);
 }
 if(domains.up)add('up',booleanState(states.wall_post_bit));
 for(const [name,value] of Object.entries(properties))if(!domains[name]?.includes(value))throw new UnknownRespawnFact('unsupported source property '+name+'='+value,block.location);
 return {id,properties};
}
/** Resolve only the requested fact when all source states compatible with the
 * observed Native permutation agree. Missing irrelevant properties do not
 * prohibit an otherwise exact query; differing answers remain unknown.
 */
export function javaBlockView(block,sourceState){
 if(!block)throw new UnknownRespawnFact('loaded block');
 const projection=sourceState??stateProjection(block),meta=JAVA_BLOCK_CATALOG.blocks[projection.id];
 if(!meta)throw new UnknownRespawnFact('source block identity',block.location);
 const properties=projection.properties??{};
 for(const [name,value] of Object.entries(properties))if(!meta.properties[name]?.includes(String(value)))throw new UnknownRespawnFact('declared source property '+name,block.location);
 const rows=rowsFor(projection.id).filter(row=>Object.entries(properties).every(([name,value])=>row.properties[name]===String(value)));
 if(!rows.length)throw new UnknownRespawnFact('source state',block.location);
 function consensus(name,read){let answer,encoded;for(const row of rows){const value=read(row),key=JSON.stringify(value);if(value===undefined||encoded!==undefined&&encoded!==key)throw new UnknownRespawnFact(name,block.location);answer=value;encoded=key;}return answer;}
 function shape(row){
  if(!row.dynamic)return JAVA_BLOCK_CATALOG.shapes[row.row[0]];
  // Both source calls use CollisionContext.empty(), with no living entity.
  if(projection.id==='minecraft:powder_snow')return [];
  if(projection.id==='minecraft:scaffolding')return JAVA_BLOCK_CATALOG.shapes[row.row[0]];
  return undefined; // position offsets / live block entities require a provider.
 }
 return {
  id:projection.id,properties,dynamic:meta.dynamic_shape,
  property:name=>consensus('source property '+name,row=>row.properties[name]),
  flag:name=>consensus(name,row=>!!(row.row[1]&JAVA_BLOCK_FLAGS[name])),
  collisionBoxes:()=>consensus('empty-context collision shape',shape),
  intersects:(at,bounds)=>consensus('standing block shape intersection',row=>{const boxes=shape(row);return boxes===undefined?undefined:sourceBoxesIntersect(boxes,at,bounds);}),
  upperFaceFull:()=>consensus('full source UP voxel slice',row=>{const boxes=shape(row);return boxes===undefined?undefined:sourceFullUpperFace(boxes);}),
  floorBoxes:()=>consensus('non-climbable floor shape',row=>row.row[1]&JAVA_BLOCK_FLAGS.climbable||projection.id.endsWith('_trapdoor')&&row.properties.open==='true'?[]:shape(row)),
  floorMaximum:()=>consensus('non-climbable floor maximum Y',row=>{if(row.row[1]&JAVA_BLOCK_FLAGS.climbable||projection.id.endsWith('_trapdoor')&&row.properties.open==='true')return null;const boxes=shape(row);return boxes===undefined?undefined:boxes.length?Math.max(...boxes.map(box=>box[4])):null;}),
  nonemptyFluid:()=>consensus('source nonempty fluid',row=>!JAVA_BLOCK_CATALOG.fluids[row.row[2]].empty),
  possibleForced:()=>consensus('Block.isPossibleToRespawnInThis',row=>{
   if(projection.id.endsWith('_banner')||projection.id.endsWith('_wall_banner')||projection.id.endsWith('_pressure_plate')||projection.id.endsWith('_sign')||projection.id.endsWith('_wall_sign'))return true;
   return !(row.row[1]&JAVA_BLOCK_FLAGS.is_solid)&&projection.id!=='minecraft:water'&&projection.id!=='minecraft:lava';
  }),
  // A dynamic source state has no static cache: hasLargeCollisionShape is true.
  largeCollision:()=>consensus('hasLargeCollisionShape',row=>row.dynamic||JAVA_BLOCK_CATALOG.shapes[row.row[0]].some(box=>box[0]<0||box[1]<0||box[2]<0||box[3]>1||box[4]>1||box[5]>1))
 };
}
export function sourceBoxesIntersect(boxes,at,bounds){return boxes.some(box=>at.x+box[3]>bounds.minX&&at.x+box[0]<bounds.maxX&&at.y+box[4]>bounds.minY&&at.y+box[1]<bounds.maxY&&at.z+box[5]>bounds.minZ&&at.z+box[2]<bounds.maxZ);}
/** Block.isFaceFull(shape, UP): top plane coverage, rather than isSolid or the
 * distinct support-shape sturdy-UP query (soul sand demonstrates the difference).
 */
export function sourceFullUpperFace(boxes){
 // VoxelShape.getFaceShape(UP) selects the source voxel slice containing
 // 0.9999999. It does not require the complete shape's maximum Y to be 1.
 const plane=.9999999,top=boxes.filter(box=>box[1]<=plane&&box[4]>plane&&box[3]>box[0]&&box[5]>box[2]);
 // isShapeFullBlock compares against the unit shape; extra exterior coverage
 // also fails. It is not merely "does the shape cover the unit square".
 if(top.some(box=>box[0]<0||box[2]<0||box[3]>1||box[5]>1))return false;
 const xs=[0,1,...top.flatMap(box=>[Math.max(0,Math.min(1,box[0])),Math.max(0,Math.min(1,box[3]))])].sort((a,b)=>a-b);
 const zs=[0,1,...top.flatMap(box=>[Math.max(0,Math.min(1,box[2])),Math.max(0,Math.min(1,box[5]))])].sort((a,b)=>a-b);
 for(let x=1;x<xs.length;x++)for(let z=1;z<zs.length;z++){const mx=(xs[x-1]+xs[x])/2,mz=(zs[z-1]+zs[z])/2;if(xs[x]>xs[x-1]&&zs[z]>zs[z-1]&&!top.some(box=>box[0]<=mx&&box[3]>=mx&&box[2]<=mz&&box[5]>=mz))return false;}
 return top.length>0;
}
