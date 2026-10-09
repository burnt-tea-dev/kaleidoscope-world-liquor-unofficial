/** Minecraft 1.21.1 LivingEntity counterparts using Native entity identifiers.
 * Class membership only: no alive, potion, damage or health-attribute policy.
 * Kept equal to the paired Tavern VANILLA_INSTANT_ENTITIES living projection
 * by kill-credit.test.mjs. Native type families are not Java class inheritance.
 */
const names=[
 'allay','armadillo','armor_stand','axolotl','bat','bee','blaze','bogged','breeze',
 'camel','cat','cave_spider','chicken','cod','cow','creeper','dolphin','donkey',
 'drowned','elder_guardian','ender_dragon','enderman','endermite','evocation_illager',
 'fox','frog','ghast','glow_squid','goat','guardian','hoglin','horse','husk',
 'iron_golem','llama','magma_cube','mooshroom','mule','ocelot','panda','parrot',
 'phantom','pig','piglin','piglin_brute','pillager','player','polar_bear','pufferfish',
 'rabbit','ravager','salmon','sheep','shulker','silverfish','skeleton','skeleton_horse',
 'slime','sniffer','snow_golem','spider','squid','stray','strider','tadpole',
 'trader_llama','tropicalfish','turtle','vex','villager','villager_v2','vindicator',
 'wandering_trader','warden','witch','wither','wither_skeleton','wolf','zoglin',
 'zombie','zombie_horse','zombie_pigman','zombie_villager','zombie_villager_v2'
];
export const VANILLA_LIVING_ENTITIES=Object.freeze(Object.fromEntries(names.map(name=>['minecraft:'+name,true])));
