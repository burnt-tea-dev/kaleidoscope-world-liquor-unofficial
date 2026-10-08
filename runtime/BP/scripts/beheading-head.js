/** Current NeoForge 1.1.11 EventHandlers.getEntityHead registry resolution.
 * Resolve on death, so other addons' registered items need no local allowlist.
 * Player SkullOwner data and native death-drop deduplication are separate gaps.
 */
const vanillaHeads = Object.freeze({
 'minecraft:zombie':'minecraft:zombie_head',
 'minecraft:skeleton':'minecraft:skeleton_skull',
 'minecraft:creeper':'minecraft:creeper_head',
 'minecraft:wither_skeleton':'minecraft:wither_skeleton_skull',
 'minecraft:piglin':'minecraft:piglin_head',
 'minecraft:player':'minecraft:player_head',
});

export function beheadingHeadId(typeId,lookup){
 const vanilla=Object.hasOwn(vanillaHeads,typeId)?vanillaHeads[typeId]:undefined;
 if(vanilla)return vanilla;
 const colon=typeId.indexOf(':');
 if(colon<=0||colon===typeId.length-1)return undefined;
 const namespace=typeId.slice(0,colon),path=typeId.slice(colon+1);
 for(const name of [path+'_head',path+'_skull','skull_'+path,'head_'+path,'dead_'+path,path+'_item']){
  const id=namespace+':'+name,item=lookup(id);
  if(item&&item.id!=='minecraft:air')return id;
 }
 return undefined;
}
