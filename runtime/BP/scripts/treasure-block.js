/** Current NeoForge1.1.11 EventHandlers.onBlockBreak.
 * Source crops/ores reroll their original state with the pre-break main hand.
 * Native permutation loot lacks Java player/block-entity/global-modifier context;
 * those explicit parity gaps are not replaced with nearby-item guessing.
 */
const CROPS=new Set(['minecraft:beetroot','minecraft:carrots','minecraft:potatoes','minecraft:wheat','minecraft:melon_stem','minecraft:pumpkin_stem','minecraft:torchflower_crop','minecraft:pitcher_crop']);
const ORES=new Set(['minecraft:coal_ore','minecraft:deepslate_coal_ore','minecraft:copper_ore','minecraft:deepslate_copper_ore','minecraft:diamond_ore','minecraft:deepslate_diamond_ore','minecraft:emerald_ore','minecraft:deepslate_emerald_ore','minecraft:gold_ore','minecraft:deepslate_gold_ore','minecraft:nether_gold_ore','minecraft:iron_ore','minecraft:deepslate_iron_ore','minecraft:lapis_ore','minecraft:deepslate_lapis_ore','minecraft:redstone_ore','minecraft:lit_redstone_ore','minecraft:deepslate_redstone_ore','minecraft:lit_deepslate_redstone_ore','minecraft:nether_quartz_ore','minecraft:ancient_debris']);
// These are source tags or an explicit native declaration of Java CropBlock.
// Tag names alone are never inferred from an item/block identifier suffix.
const CROP_TAGS=['minecraft:crops','kaleidoscope_world_liquor:crop_block'];
const ORE_TAGS=['c:ores','forge:ores',...['coal','copper','diamond','emerald','gold','iron','lapis','netherite_scrap','redstone','quartz'].map(name=>'c:ores/'+name)];
export function isTreasureBlock(permutation){
 const id=permutation.type.id;
 return CROPS.has(id)||ORES.has(id)||CROP_TAGS.some(tag=>permutation.hasTag(tag))||ORE_TAGS.some(tag=>permutation.hasTag(tag));
}
export function treasureBlockChance(amplifier){return Math.min(.15+amplifier*.05,1);}
export function addTreasureBlockDrops(event,amplifier,lootManager,random=Math.random){
 if(!isTreasureBlock(event.brokenBlockPermutation)||random()>=treasureBlockChance(amplifier))return 0;
 const stacks=lootManager.generateLootFromBlockPermutation(event.brokenBlockPermutation,event.itemStackBeforeBreak);
 const at={x:event.block.location.x+.5,y:event.block.location.y+.5,z:event.block.location.z+.5};
 let spawned=0;
 for(const stack of stacks??[]){if(!stack||stack.amount<=0||stack.typeId==='minecraft:air')continue;event.dimension.spawnItem(stack.clone(),at);spawned++;}
 return spawned;
}
