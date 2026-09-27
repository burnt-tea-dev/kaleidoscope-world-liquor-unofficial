const N='kaleidoscope_world_liquor';
const fluidKinds={'minecraft:water':'water','minecraft:lava':'lava',[N+':milk_still']:'milk_still','kaleidoscope_tavern:grape_juice':'grape','kaleidoscope_tavern:sweet_berries_juice':'sweet_berries'};
const items={'minecraft:snowball':'snowball','minecraft:blue_dye':'blue_dye','minecraft:slime_ball':'slime_ball'};
export function syncFreezerVisuals(block,state,recipes){
 const p=block.location,anchor=N+':storage/'+block.dimension.id.split(':')[1]+'/'+p.x+'_'+p.y+'_'+p.z;
 const facing=block.permutation.getState('kaleidoscope_tavern:facing')??0,yaw=[180,-90,0,90][facing],rows=[];
 if(block.permutation.getState(N+':open')){
  const fluid=fluidKinds[state.fluid];if(fluid)rows.push({slot:'fluid',kind:fluid,x:0,z:0,y:.625});
  (state.input??[]).forEach((id,i)=>{if(items[id])rows.push({slot:'input'+i,kind:items[id],x:(i%2?1:-1)*.20,z:-.0625+(i<2?-1:1)*.16,y:fluid ? .65 : .3});});
  if(state.output>0){const recipe=recipes.find(r=>r.id===state.recipe),kind=recipe?.texture?.split('/').at(-1);if(['ice','snow','magma'].includes(kind))rows.push({slot:'result',kind,x:0,z:0,y:.75-(5-state.output)*.08});}
 }
 const existing=block.dimension.getEntities({families:['kwl_visual'],location:{x:p.x+.5,y:p.y+.5,z:p.z+.5},maxDistance:2}).filter(e=>e.getDynamicProperty(N+':anchor')===anchor&&e.typeId.startsWith(N+':freezer_'));
 const chosen=new Map();for(const e of existing){const slot=e.getDynamicProperty(N+':visual_slot'),row=rows.find(r=>r.slot===slot&&e.typeId===N+':freezer_'+r.kind+'_visual');if(!row||chosen.has(slot))e.remove();else chosen.set(slot,e);}
 for(const row of rows){const angle=yaw*Math.PI/180,x=row.x*Math.cos(angle)-row.z*Math.sin(angle),z=row.x*Math.sin(angle)+row.z*Math.cos(angle),at={x:p.x+.5+x,y:p.y+row.y,z:p.z+.5+z};let e=chosen.get(row.slot);
  if(!e){e=block.dimension.spawnEntity(N+':freezer_'+row.kind+'_visual',at,{initialRotation:yaw});e.setDynamicProperty(N+':anchor',anchor);e.setDynamicProperty(N+':position',JSON.stringify(p));e.setDynamicProperty(N+':block',block.typeId);e.setDynamicProperty(N+':visual_slot',row.slot);}else e.teleport(at,{rotation:{x:0,y:yaw}});
 }
}
