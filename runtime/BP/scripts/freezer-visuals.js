const N='kaleidoscope_world_liquor';
const fluidKinds={'minecraft:water':'water','minecraft:lava':'lava',[N+':milk_still']:'milk_still','kaleidoscope_tavern:grape_juice':'grape','kaleidoscope_tavern:sweet_berries_juice':'sweet_berries'};
const items={'minecraft:snowball':'snowball','minecraft:blue_dye':'blue_dye','minecraft:slime_ball':'slime_ball'};
const f=Math.fround,angle=value=>f(((value+180)%360+360)%360-180);
export function freezerIngredientPose(position,slot,hasFluid){
 // Java creates a separate 48-bit Random for each original inventory slot.
 // The seed has no clock, entity identity or saved random state.
 const hash=(Math.imul((position.y+Math.imul(position.z,31))|0,31)+position.x)|0;
 let seed=(BigInt(hash)+BigInt(slot)*999n)^0x5deece66dn;
 const random=()=>{seed=(seed*0x5deece66dn+11n)&0xffffffffffffn;return Number(seed>>24n)/16777216;};
 const inset=f(.075),width=f(.34375-f(2*inset)),depth=f(.28125-f(2*inset));
 const x=f(f(f(.15625+f((slot%2)*.34375))+inset)+f(random()*width));
 const z=f(f(f(.1875+f(Math.floor(slot/2)*.28125))+inset)+f(random()*depth));
 return {x,y:f(hasFluid ? .65 : .28),z,yaw:f(random()*360)};
}
// FreezerRenderer.drawResultTexture uses Java float operations at each step.
export function freezerResultHeight(count,maxCount){
 const ratio=maxCount>0?Math.min(Math.fround(1),Math.fround(Math.fround(count)/Math.fround(maxCount))):Math.fround(1);
 return Math.fround(Math.fround(.3125)+Math.fround(Math.fround(.3125)*ratio));
}
export function syncFreezerVisuals(block,state,recipes){
 const p=block.location,anchor=N+':storage/'+block.dimension.id.split(':')[1]+'/'+p.x+'_'+p.y+'_'+p.z;
 const facing=block.permutation.getState('kaleidoscope_tavern:facing')??0,yaw=[180,-90,0,90][facing],rows=[];
 if(block.permutation.getState(N+':open')){
  const fluid=fluidKinds[state.fluid];if(fluid)rows.push({slot:'fluid',kind:fluid,x:0,z:0,y:.625});
  (state.input??[]).forEach((id,i)=>{if(items[id]){const pose=freezerIngredientPose(p,i,!!state.fluid);rows.push({slot:'input'+i,kind:items[id],x:pose.x-.5,z:pose.z-.5,y:pose.y,yaw:-pose.yaw});}});
  if(state.output>0){const recipe=recipes.find(r=>r.id===state.recipe),kind=recipe?.texture?.split('/').at(-1);if(['ice','snow','magma','obsidian'].includes(kind))rows.push({slot:'result',kind,x:0,z:0,y:freezerResultHeight(state.output,recipe.result.count)});}
 }
 const existing=block.dimension.getEntities({families:['kwl_visual'],location:{x:p.x+.5,y:p.y+.5,z:p.z+.5},maxDistance:2}).filter(e=>e.getDynamicProperty(N+':anchor')===anchor&&e.typeId.startsWith(N+':freezer_'));
 const chosen=new Map();for(const e of existing){const slot=e.getDynamicProperty(N+':visual_slot'),row=rows.find(r=>r.slot===slot&&e.typeId===N+':freezer_'+r.kind+'_visual');if(!row||chosen.has(slot))e.remove();else chosen.set(slot,e);}
 for(const row of rows){const radians=yaw*Math.PI/180,x=row.x*Math.cos(radians)-row.z*Math.sin(radians),z=row.x*Math.sin(radians)+row.z*Math.cos(radians),at={x:p.x+.5+x,y:p.y+row.y,z:p.z+.5+z},rotationYaw=angle(yaw+(row.yaw??0));let e=chosen.get(row.slot);
  if(!e){e=block.dimension.spawnEntity(N+':freezer_'+row.kind+'_visual',at,{initialRotation:rotationYaw});e.setDynamicProperty(N+':anchor',anchor);e.setDynamicProperty(N+':position',JSON.stringify(p));e.setDynamicProperty(N+':block',block.typeId);e.setDynamicProperty(N+':visual_slot',row.slot);}
  else{
   // Refresh still reconciles missing/moved entities, lid and result height.
   // Unchanged native transforms need no redundant movement replication.
   const location=e.location,rotation=e.getRotation();
   // Equivalent wrapped float32 yaw can differ by one ULP at 360 degrees.
   if(['x','y','z'].some(k=>Math.fround(location[k])!==Math.fround(at[k]))||angle(rotation.x)!==0||Math.abs(angle(rotation.y-rotationYaw))>1/32768)e.teleport(at,{rotation:{x:0,y:rotationYaw}});
  }
 }
}
