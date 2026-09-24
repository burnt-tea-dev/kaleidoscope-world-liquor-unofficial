import {world,system,ItemStack} from '@minecraft/server';
import {payload} from './payload.js';
import {registerTavernExtension} from './sdk/tavern-extension-client.js';
import {registerFurniture,installFurniture,hand,NS} from './furniture.js';
import {installEffects} from './effects.js';
function returnItem(p,id){const inv=p.getComponent('minecraft:inventory').container,left=inv.addItem(new ItemStack(id));if(left)p.dimension.spawnItem(left,p.location);}
function consume(e){const p=e.source,h=hand(p);if(!p||h?.typeId!==e.itemStack?.typeId)return;const cola=h.typeId.endsWith(':cola');if(p.getGameMode()!=='Creative'){if(h.amount===1)p.getComponent('minecraft:inventory').container.setItem(p.selectedSlotIndex,new ItemStack('minecraft:glass_bottle'));else{h.amount--;p.getComponent('minecraft:inventory').container.setItem(p.selectedSlotIndex,h);returnItem(p,'minecraft:glass_bottle');}}
 for(const effect of cola?['haste','speed']:['regeneration'])p.addEffect(effect,300,{amplifier:0});
}
const foods={liangshan_ice_cone:['fire_resistance','speed'],kita_stuffed_crisp:['saturation'],pochi_pudding:['regeneration'],magic_crispy_corner:['haste']};
system.beforeEvents.startup.subscribe(e=>{
 registerFurniture(e);
 e.itemComponentRegistry.registerCustomComponent(NS+':consume',{onCompleteUse:consume});
 e.itemComponentRegistry.registerCustomComponent(NS+':food',{onCompleteUse:e=>{const short=e.itemStack.typeId.split(':')[1];for(const effect of foods[short]??[])e.source.addEffect(effect,9600,{amplifier:0});if(short==='pochi_pudding')returnItem(e.source,'minecraft:bowl');}});
});
world.afterEvents.worldLoad.subscribe(()=>{
 installFurniture();installEffects();registerTavernExtension(system,payload);
 console.warn('[World Liquor] 0.1.3 preview: '+payload.content.length+' drink descriptors, '+payload.recipes.length+' recipes. Client visuals require device review.');
});
