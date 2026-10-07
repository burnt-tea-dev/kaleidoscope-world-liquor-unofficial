import {buildRegistrationPayload} from './optional-cookery.js';
import {withFoundation,setFoundationClient} from './foundation.js';
import {world,system,ItemStack,ItemTypes,ScriptEventSource} from '@minecraft/server';
import {payload} from './payload.js';
import {registerTavernExtension} from './sdk/tavern-extension-client.js';
import {registerFurniture,installFurniture,NS} from './furniture.js';
import {completeBottledDrink} from './bottled-drink.js';
import {installEffects} from './effects.js';
import {installDrinkAudio} from './drink-audio.js';
import {traceFoodPhase,installFoodPhaseTrace} from './food-phase-trace.js';
function returnItem(p,id){const inv=p.getComponent('minecraft:inventory').container,left=inv.addItem(new ItemStack(id));if(left)p.dimension.spawnItem(left,p.location);}
function consume(e){return completeBottledDrink(e,{createStack:(id,amount)=>new ItemStack(id,amount)});}
const foods={liangshan_ice_cone:['fire_resistance','speed'],kita_stuffed_crisp:['saturation'],pochi_pudding:['regeneration'],magic_crispy_corner:['haste']};
system.beforeEvents.startup.subscribe(e=>{
 registerFurniture(e);
 e.itemComponentRegistry.registerCustomComponent(NS+':consume',{onCompleteUse:consume});
 e.itemComponentRegistry.registerCustomComponent(NS+':food',{onCompleteUse:e=>{traceFoodPhase('complete_before',e);try{const short=e.itemStack.typeId.split(':')[1];for(const effect of foods[short]??[])e.source.addEffect(effect,9600,{amplifier:0});if(short==='pochi_pudding')returnItem(e.source,'minecraft:bowl');}finally{traceFoodPhase('complete_after',e);}},onConsume:e=>traceFoodPhase('consume',e)});
});
world.afterEvents.worldLoad.subscribe(()=>{
 installFoodPhaseTrace(system,ScriptEventSource.Server);
 installFurniture();installEffects();installDrinkAudio(world,system,payload.content);const foundationPayload=withFoundation(buildRegistrationPayload(payload,id=>!!ItemTypes.get(id)));
setFoundationClient(registerTavernExtension(system,foundationPayload),system,world,foundationPayload);
 console.log('[World Liquor] '+payload.version+' preview: '+payload.content.length+' drink descriptors, '+foundationPayload.recipes.length+' active recipes ('+(payload.recipes.length-foundationPayload.recipes.length)+' optional Cookery recipes unavailable). Client visuals require device review.');
});
