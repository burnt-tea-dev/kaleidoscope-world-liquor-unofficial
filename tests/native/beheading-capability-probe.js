import {world,system,ItemTypes,ItemStack,BlockPermutation} from '@minecraft/server';
const out=(kind,row)=>console.log('[BEHEADING_QA] '+JSON.stringify({kind,...row}));
const tick=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const modes=new Map(),trace=[];let replacement;
world.beforeEvents.entityHurt.subscribe(event=>{
 const mode=modes.get(event.hurtEntity.id);if(!mode)return;
 trace.push({mode,event:'before',damage:event.damage,cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id});
 if(mode==='mutate-source'){event.damageSource.cause='entityAttack';event.damageSource.damagingEntity=replacement;}
 if(mode.startsWith('cancel-'))event.cancel=true;
 if(mode==='restricted-reentry'){
  event.cancel=true;
  try{event.hurtEntity.applyDamage(10000,{cause:'entityAttack',damagingEntity:replacement});trace.push({mode,event:'restricted-allowed'});}
  catch(error){trace.push({mode,event:'restricted-rejected',error:String(error)});}
 }
});
world.afterEvents.entityHurt.subscribe(event=>{const mode=modes.get(event.hurtEntity.id);if(mode)trace.push({mode,event:'after',damage:event.damage,cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id});});
world.afterEvents.entityDie.subscribe(event=>{
 const mode=modes.get(event.deadEntity.id);if(!mode)return;
 const at=event.deadEntity.location;
 trace.push({mode,event:'die',cause:event.damageSource.cause,owner:event.damageSource.damagingEntity?.id,items:event.deadEntity.dimension.getEntities({type:'minecraft:item',location:at,maxDistance:2}).map(entity=>entity.getComponent('minecraft:item')?.itemStack?.typeId)});
});
world.afterEvents.entitySpawn.subscribe(event=>{
 if(event.entity.typeId==='minecraft:item')trace.push({event:'item-spawn',item:event.entity.getComponent('minecraft:item')?.itemStack?.typeId});
});
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld');dimension.runCommand('tickingarea add circle 0 80 0 2 beheading_qa');
 system.runTimeout(async()=>{try{
  const attacker=dimension.spawnEntity('senluo_combat_qa:r0',{x:0,y:80,z:0});replacement=dimension.spawnEntity('senluo_combat_qa:r0',{x:0,y:80,z:8});
  const loot=world.getLootTableManager();
  for(const id of ['minecraft:wheat','minecraft:carrots','minecraft:potatoes','minecraft:beetroot','minecraft:nether_wart','minecraft:cocoa','minecraft:melon_stem','minecraft:pumpkin_stem','minecraft:diamond_ore','minecraft:deepslate_diamond_ore','minecraft:stone']){
   const permutation=BlockPermutation.resolve(id),stacks=loot.generateLootFromBlockPermutation(permutation,new ItemStack('minecraft:diamond_pickaxe'));
   out('block',{id,tags:permutation.getTags(),states:permutation.getAllStates(),loot:stacks?.map(stack=>({id:stack.typeId,amount:stack.amount}))});
  }
  for(const id of ['minecraft:zombie_head','minecraft:skeleton_skull','minecraft:creeper_head','minecraft:wither_skeleton_skull','minecraft:piglin_head','minecraft:player_head','minecraft:skull'])out('item',{id,registered:!!ItemTypes.get(id)});
  for(const mode of ['mutate-source','restricted-reentry','accepted-kill','cancel-set-zero','cancel-kill','cancel-retry-kill']){
   const entity=dimension.spawnEntity('senluo_combat_qa:r0',{x:8,y:80,z:0});modes.set(entity.id,mode);const start=trace.length;
   entity.applyDamage(mode==='accepted-kill'?10000:4,{cause:'fire',damagingEntity:attacker});trace.push({mode,event:'returned'});await tick(3);
   if(mode==='cancel-set-zero')entity.getComponent('minecraft:health').setCurrentValue(0);
   if(mode==='cancel-kill')entity.kill();
   if(mode==='cancel-retry-kill'){entity.getComponent('minecraft:health').setCurrentValue(1);entity.applyDamage(2,{cause:'entityAttack',damagingEntity:attacker});entity.kill();}
   await tick(3);out('case',{mode,trace:trace.slice(start),health:entity.isValid?entity.getComponent('minecraft:health')?.currentValue:undefined});
   if(entity.isValid)entity.remove();modes.delete(entity.id);
   for(const item of dimension.getEntities({type:'minecraft:item',location:{x:8,y:80,z:0},maxDistance:3}))item.remove();
  }
  attacker.remove();replacement.remove();out('done',{players:world.getAllPlayers().length});
 }catch(error){out('failure',{error:String(error),stack:error.stack});}},30);
});
