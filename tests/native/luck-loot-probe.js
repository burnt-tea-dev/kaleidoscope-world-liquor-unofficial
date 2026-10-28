import {world,system,EntityDamageCause,ItemStack} from '@minecraft/server';
import {installLuckLoot} from './luck-loot.js';
const emit=row=>console.warn('[LUCK_RUNTIME] '+JSON.stringify(row));
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld'),originals=new Map(),lucky=new Set(),before=new Set();let emitted=0;
 dimension.runCommand('tickingarea add circle 0 80 0 2 luck_runtime');
 const luck=installLuckLoot(world,system,actor=>lucky.has(actor.id)?{luck:{amplifier:4}}:{},{state:()=>({})},{random:()=>0});
 world.afterEvents.entityDie.subscribe(event=>luck.death(event));
 world.afterEvents.entityItemDrop.subscribe(event=>{
  if(event.entity.typeId!=='senluo_cap:loot_mob')return;
  const native=event.items,rows=[];
  for(let index=0;index<native.length;index++){const item=native[index].getComponent('minecraft:item')?.itemStack;rows.push({type:item.typeId,amount:item.amount,lore:item.getLore()});}
  originals.set(event.entity.id,rows);emit({kind:'original',source:event.entity.id,at:event.entity.location,items:rows});
 });
 system.runTimeout(()=>{try{
  for(const item of dimension.getEntities({type:'minecraft:item'}))before.add(item.id);
  const attacker=dimension.spawnEntity('minecraft:zombie',{x:0,y:80,z:0});lucky.add(attacker.id);
  dimension.spawnItem(new ItemStack('minecraft:nether_star',7),{x:1,y:80,z:0});
  for(let index=0;index<10;index++){
   const target=dimension.spawnEntity('senluo_cap:loot_mob',{x:5+index*4,y:80,z:0});
   target.applyDamage(100,{cause:EntityDamageCause.entityAttack,damagingEntity:attacker});
  }
 }catch(error){emit({kind:'failure',error:String(error)});}},50);
 system.runTimeout(()=>{try{
  const found=dimension.getEntities({type:'minecraft:item'}),items=[];
  for(const entity of found){if(before.has(entity.id))continue;const stack=entity.getComponent('minecraft:item')?.itemStack;if(stack)items.push({id:stack.typeId,amount:stack.amount,lore:stack.getLore(),at:entity.location});}
  if(originals.size!==10)throw Error('Missing native original drop events: '+originals.size);
  const stars=items.filter(item=>item.id==='minecraft:nether_star').reduce((n,item)=>n+item.amount,0);
  if(stars!==7)throw Error('Unrelated nearby item changed: '+stars);
  const rare=items.filter(item=>['minecraft:diamond','minecraft:emerald'].includes(item.id));
  if(rare.length<=10||rare.some(item=>item.amount!==1))throw Error('Expected original and deduplicated extra types: '+rare.length);
  for(const item of rare)if(JSON.stringify(item.lore)!==JSON.stringify(['native metadata marker']))throw Error('Native metadata lost');
  emit({kind:'done',players:world.getAllPlayers().length,originalEvents:originals.size,rareStacks:rare.length,unrelatedStackAmount:stars,completeMetadataRetained:true});
  dimension.runCommand('tickingarea remove luck_runtime');
 }catch(error){emit({kind:'failure',error:String(error)});}},90);
});
