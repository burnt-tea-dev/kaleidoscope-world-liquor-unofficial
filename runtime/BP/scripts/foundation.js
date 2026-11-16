import {BREAK_FEEDBACK} from './data/break-feedback.js';
import {RECORD_MODELS} from './wall-record-models.js';
import {createFoundationClient} from './sdk/tavern-foundation-client.js';
/** Data-only registration. Tavern owns cabinet and timed-effect lifecycles. */
const NS='kaleidoscope_world_liquor';
const WOODS=['oak','birch','spruce','dark_oak','cherry'];
const furniture=WOODS.flatMap(wood=>['bar_cabinet','cellar_cabinet'].map(kind=>({
 block:NS+':'+wood+'_'+kind,kind,facing:'kaleidoscope_tavern:facing',
 connection:NS+':position',legacyPrefix:NS+':storage/'
})));
// NeoForge1.21.1 author1.1.12 CF9217896 ModEffects and constructors.
// Register from Java's effect definitions, including entries unused by drinks.
// available=false: no behaviour consumer exists in this port yet.
const effectDefinitions=Object.freeze([
 ['tequila','beneficial','timed',true],
 ['captain_gift','beneficial','timed',true],
 ['treasure_guide','beneficial','timed',true],
 ['multi_jump','beneficial','timed',true],
 ['reverse_gravity','neutral','timed',true],
 ['crazy','harmful','instant',true],
 ['respawn','neutral','instant',true],
 ['double_damage','beneficial','timed',true],
 ['boating_master','beneficial','timed',true],
 ['hostile_detection','beneficial','timed',false],
 ['beheading','beneficial','timed',true],
 ['frost_walker','beneficial','timed',true],
 ['treasure_sense','beneficial','timed',false],
 ['ground_crit','beneficial','timed',true],
 ['explosion','harmful','instant',true],
 ['level_boost','harmful','instant',true],
 ['continuous_heal','beneficial','timed',true],
 ['luck','beneficial','timed',true],
 ['creative_flight','beneficial','timed',false]
].map(([name,category,mode,available])=>Object.freeze({id:NS+':'+name,category,mode,available})));
// Preserve the existing port alias and saved-data handoff. Java conditionally
// registers smc:elbow_strike; do not invent a category for this namespaced alias.
const elbowAlias=Object.freeze({id:NS+':elbow_strike',mode:'timed'});
let client,bridge;
export const isManagedCabinet=id=>furniture.some(row=>row.block===id);
export const foundationReady=()=>client?.registered===true;
export function setFoundationClient(value,system,world,payload){client=value;bridge=createFoundationClient(system,world,payload,foundationReady);}
export function withFoundation(payload){
 return {...payload,modNameKey:`item.${NS}.mod_name`,breakFeedback:Object.values(BREAK_FEEDBACK),pickBlocks:[{block:NS+':wall_record',variants:[
  ...Object.entries(RECORD_MODELS).map(([item,index])=>({item,states:{[NS+':model_group']:Math.floor(index/5),[NS+':model_variant']:index%5}})),
  ...Array.from({length:6},(_,i)=>({item:NS+':custom_record',states:{[NS+':model_group']:Math.floor((19+i)/5),[NS+':model_variant']:(19+i)%5}}))
 ]}],requires:[...new Set([...(payload.requires??[]),'furniture_storage','vertical_double_furniture','external_effect_lifecycle','destruction_feedback','drink_source_labels'])],furniture:[...furniture,...(payload.furniture??[])],
  effects:[...effectDefinitions,elbowAlias],legacyEffectKey:NS+':effects'};
}
export function forwardFurnitureTick(system,block){
 bridge?.cabinet({type:block.typeId,dimension:block.dimension.id,position:block.location});
}

export const forwardNativeUse=e=>bridge?.nativeUse(e);
