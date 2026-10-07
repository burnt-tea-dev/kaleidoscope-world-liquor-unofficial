/** Current NeoForge 1.1.11 CrazyEffect defaults to Minecraft registry entries
 * only. Order comes from official Minecraft 1.21.1 MobEffects registration.
 * Native EffectType exposes getName(), not Effect.id.
 */
export const CRAZY_ENABLE_MODDED_EFFECTS=false;
export const CRAZY_JAVA_EFFECTS=Object.freeze([
 'speed','slowness','haste','mining_fatigue','strength','instant_health',
 'instant_damage','jump_boost','nausea','regeneration','resistance',
 'fire_resistance','water_breathing','invisibility','blindness','night_vision',
 'hunger','weakness','poison','wither','health_boost','absorption','saturation',
 'glowing','levitation','luck','unluck','slow_falling','conduit_power',
 'dolphins_grace','bad_omen','hero_of_the_village','darkness','trial_omen',
 'raid_omen','wind_charged','weaving','oozing','infested'
]);
// Java and Bedrock use different identifiers for this vanilla effect.
const counterpart=name=>name==='hero_of_the_village'?'village_hero':name;
function vanillaName(identifier){
 if(typeof identifier!=='string')return undefined;
 if(identifier.startsWith('minecraft:'))return identifier.slice(10);
 if(identifier.includes(':'))return undefined;
 return identifier;
}
/** Report absent source entries rather than replacing them with guessed
 * native/addon effects. Original native objects are delivered unchanged.
 */
export function selectCrazyEffects(nativeTypes){
 const available=new Map();
 for(const type of nativeTypes){
  let identifier;try{identifier=type?.getName();}catch{continue;}
  const name=vanillaName(identifier);
  if(name!==undefined&&!available.has(name))available.set(name,{identifier,type});
 }
 const effects=[],missingJavaEffects=[];
 for(const name of CRAZY_JAVA_EFFECTS){
  const found=available.get(counterpart(name));
  if(found)effects.push({javaId:'minecraft:'+name,bedrockId:found.identifier,type:found.type});
  else missingJavaEffects.push('minecraft:'+name);
 }
 return {effects,missingJavaEffects,enableModdedEffects:CRAZY_ENABLE_MODDED_EFFECTS};
}
