import {world,system,ItemStack,BlockPermutation,EnchantmentTypes} from '@minecraft/server';
import {addTreasureBlockDrops,isTreasureBlock} from './treasure-block.js';
const out=(kind,row)=>console.log('[TREASURE_BLOCK_QA] '+JSON.stringify({kind,...row}));
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld');dimension.runCommand('tickingarea add circle 0 80 0 2 treasure_block_qa');
 system.runTimeout(()=>{try{
  const loot=world.getLootTableManager(),tool=new ItemStack('minecraft:diamond_pickaxe'),at={x:4,y:80,z:0};
  dimension.getBlock(at).setType('minecraft:air');
  const foreign=dimension.spawnItem(new ItemStack('minecraft:emerald',7),{x:4.5,y:80.5,z:.5});
  let emitted=0;
  for(const [mode,id,roll,expected] of [['ore-below-threshold','minecraft:diamond_ore',.149,1],['ore-between-old-and-source-threshold','minecraft:diamond_ore',.17,0],['immature-crop','minecraft:wheat',0,1],['source-noncrop','minecraft:nether_wart',0,0],['netherite-source-tag','minecraft:ancient_debris',0,1]]){
   const event={brokenBlockPermutation:BlockPermutation.resolve(id),itemStackBeforeBreak:tool,block:dimension.getBlock(at),dimension};
   const count=addTreasureBlockDrops(event,0,loot,()=>roll);
   if(count!==expected)throw Error(mode+': '+count+' / '+expected);
   emitted+=count;out('case',{mode,count,expected,id,eligible:isTreasureBlock(event.brokenBlockPermutation)});
  }
  for(const [mode,id,expected] of [['external-tagged-ore','treasure_fixture:plain',1],['external-crop-class','treasure_fixture:plant',1]]){
   const state=BlockPermutation.resolve(id),count=addTreasureBlockDrops({brokenBlockPermutation:state,itemStackBeforeBreak:tool,block:dimension.getBlock(at),dimension},0,loot,()=>0);
   if(count!==expected)throw Error(mode+': '+count+' / '+expected);emitted+=count;out('case',{mode,count,expected,id,tags:state.getTags()});
  }
  const silk=tool.clone();silk.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('silk_touch'),level:1});
  const beforeOre=dimension.getEntities({type:'minecraft:item',location:{x:4.5,y:80.5,z:.5},maxDistance:2}).filter(entity=>entity.getComponent('minecraft:item')?.itemStack?.typeId==='minecraft:diamond_ore').length;
  const count=addTreasureBlockDrops({brokenBlockPermutation:BlockPermutation.resolve('minecraft:diamond_ore'),itemStackBeforeBreak:silk,block:dimension.getBlock(at),dimension},0,loot,()=>0);
  if(count!==1||dimension.getEntities({type:'minecraft:item',location:{x:4.5,y:80.5,z:.5},maxDistance:2}).filter(entity=>entity.getComponent('minecraft:item')?.itemStack?.typeId==='minecraft:diamond_ore').length!==beforeOre+1)throw Error('Original silk-touch tool not respected');
  emitted+=count;out('case',{mode:'silk-touch-original-tool',count,expected:1,id:'minecraft:diamond_ore'});
  const items=dimension.getEntities({type:'minecraft:item',location:{x:4.5,y:80.5,z:.5},maxDistance:2}).map(entity=>({id:entity.getComponent('minecraft:item')?.itemStack?.typeId,amount:entity.getComponent('minecraft:item')?.itemStack?.amount,at:entity.location}));
  if(items.filter(row=>row.id==='minecraft:emerald').reduce((n,row)=>n+row.amount,0)!==7)throw Error('Unrelated foreign stack duplicated');
  if(items.filter(row=>row.id!=='minecraft:emerald').length!==emitted)throw Error('Unexpected native item emission');
  out('items',{items});foreign.remove();out('done',{players:world.getAllPlayers().length});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}},30);
});
