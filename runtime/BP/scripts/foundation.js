import {createFoundationClient} from './sdk/tavern-foundation-client.js';
/** Data-only registration. Tavern owns cabinet and timed-effect lifecycles. */
const NS='kaleidoscope_world_liquor';
const WOODS=['oak','birch','spruce','dark_oak','cherry'];
const furniture=WOODS.flatMap(wood=>['bar_cabinet','cellar_cabinet'].map(kind=>({
 block:NS+':'+wood+'_'+kind,kind,facing:'kaleidoscope_tavern:facing',
 connection:NS+':position',legacyPrefix:NS+':storage/'
})));
const instant=new Set(['explosion','level_boost','respawn','crazy']);
let client,bridge;
export const isManagedCabinet=id=>furniture.some(row=>row.block===id);
export const foundationReady=()=>client?.registered===true;
export function setFoundationClient(value,system,world,payload){client=value;bridge=createFoundationClient(system,world,payload,foundationReady);}
export function withFoundation(payload){
 const names=new Set();
 for(const content of payload.content??[])for(const effect of content.effects.flat())if(effect.effect.startsWith(NS+':'))names.add(effect.effect);
 for(const input of payload.shakerInputs??[])for(const effect of input.effects)if(effect.effect.startsWith(NS+':'))names.add(effect.effect);
 return {...payload,requires:['furniture_storage','external_effect_lifecycle'],furniture,
  effects:[...names].sort().map(id=>({id,mode:instant.has(id.split(':')[1])?'instant':'timed'})),legacyEffectKey:NS+':effects'};
}
export function forwardFurnitureTick(system,block){
 bridge?.cabinet({type:block.typeId,dimension:block.dimension.id,position:block.location});
}

export const forwardNativeUse=e=>bridge?.nativeUse(e);
