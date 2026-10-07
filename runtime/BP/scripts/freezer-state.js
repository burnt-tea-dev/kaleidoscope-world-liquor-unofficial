/** Java FreezerBlock/FreezerBlockEntity rules, without world or inventory writes. */
export function startFreezerRecipe(state,recipes){
 if(state.remaining>0||state.output)return state;
 const input=state.input??[];
 const recipe=recipes.find(r=>r.fluid===state.fluid&&r.ingredients.length===input.length&&r.ingredients.every((options,i)=>options.includes(input[i])));
 return recipe?{...state,recipe:recipe.id,remaining:recipe.craft_time,fluid:null,input:[]}:state;
}
/** One loaded server tick, matching FreezerBlockEntity.tick's ++progress.
 * A deleted recipe is restored as idle rather than fabricating one output.
 */
export function advanceFreezerTick(state,recipes){
 if(!(state.remaining>0))return {state,changed:false,refresh:false};
 const recipe=recipes.find(r=>r.id===state.recipe);
 if(!recipe)return {state:{...state,remaining:0,output:0,recipe:null},changed:true,refresh:true};
 const remaining=Math.max(0,state.remaining-1);
 const next={...state,remaining,...(remaining===0?{output:recipe.result.count}:{})};
 return {state:next,changed:true,refresh:remaining===0||(recipe.craft_time-remaining)%20===0};
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
