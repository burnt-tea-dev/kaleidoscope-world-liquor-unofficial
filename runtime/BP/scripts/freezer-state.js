/** Java FreezerBlock/FreezerBlockEntity rules, without world or inventory writes. */
export function startFreezerRecipe(state,recipes){
 if(state.remaining>0||state.output)return state;
 const input=state.input??[];
 const recipe=recipes.find(r=>r.fluid===state.fluid&&r.ingredients.length===input.length&&r.ingredients.every((options,i)=>options.includes(input[i])));
 return recipe?{...state,recipe:recipe.id,remaining:recipe.craft_time,fluid:null,input:[]}:state;
}
export function freezerPowerTransition(state,open,powered,blocked,recipes){
 // Neighbor callbacks may repeat and may be sent during chunk initialization.
 // Preserve manual overrides until the power really changes, including reloads.
 if(state.redstonePowered===powered)return {changed:false,state,open};
 const next={...state,redstonePowered:powered};
 if(powered===open)return {changed:true,state:next,open};
 if(powered){
  if(state.remaining>0||blocked)return {changed:true,state:next,open};
  return {changed:true,state:next,open:true};
 }
 return {changed:true,state:startFreezerRecipe(next,recipes),open:false};
}
