import {world,system,EntityDamageCause,ItemStack} from '@minecraft/server';
import {installDeathDrops,treasureDropDiagnostics} from './treasure-drops.js';
const emit=row=>console.warn('[DEATH_DROPS] '+JSON.stringify(row));
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld'),actors=new Map(),cases=new Map();
 const manager=world.getLootTableManager();
 // Observe actual native queries without replacing their tables, RNG or stacks.
 const observedWorld={afterEvents:world.afterEvents,getEntity:id=>world.getEntity(id),getLootTableManager:()=>({
  generateLootFromEntity(entity,tool){
   const stacks=manager.generateLootFromEntity(entity,tool),sample=[];
   for(let i=0;i<(stacks?.length??0);i++)sample.push({id:stacks[i].typeId,amount:stacks[i].amount,lore:stacks[i].getLore()});
   cases.get(entity.id).rolls.push(sample);return stacks;
  }
 })};
 const drops=installDeathDrops(observedWorld,system,{read:actor=>actors.get(actor.id)??{},killCredit:{state:()=>({})},random:()=>0});
 world.afterEvents.entityDie.subscribe(event=>drops.death(event));
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const row=cases.get(event.entity.id);if(!row)return;
  row.events++;const items=event.items;row.original=[];
  for(let i=0;i<items.length;i++){
   const stack=items[i].getComponent('minecraft:item').itemStack;
   row.original.push({id:stack.typeId,amount:stack.amount,lore:stack.getLore()});
  }
 });
 dimension.runCommand('tickingarea add circle 32 80 0 3 death_drops_qa');
 system.runTimeout(()=>{try{
  dimension.runCommand('fill 2 79 -2 74 79 2 stone');
  dimension.spawnItem(new ItemStack('minecraft:nether_star',7),{x:5,y:80,z:1});
  let n=0;
  for(const mode of ['none','luck','treasure','both']){
   const attacker=dimension.spawnEntity('minecraft:zombie',{x:0,y:80,z:8+n});
   actors.set(attacker.id,{...(['luck','both'].includes(mode)?{luck:{amplifier:4}}:{}),...(['treasure','both'].includes(mode)?{treasure_guide:{amplifier:0}}:{})});
   for(let i=0;i<3;i++){
    const at={x:5+n++*6,y:80,z:0},target=dimension.spawnEntity('senluo_cap:loot_mob',at);
    cases.set(target.id,{mode,at,original:[],rolls:[],events:0});
    target.applyDamage(100,{cause:EntityDamageCause.entityAttack,damagingEntity:attacker});
   }
  }
 }catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},50);
 system.runTimeout(()=>{try{
  let combinedNewTypes=0;
  for(const row of cases.values()){
   if(row.events!==1||row.original.length!==1)throw Error(row.mode+': expected one original native drop event');
   const lucky=['luck','both'].includes(row.mode),treasure=['treasure','both'].includes(row.mode);
   if(row.rolls.length!==(lucky?5:0))throw Error(row.mode+': wrong number of native Luck queries');
   const expected=new Map(row.original.map(item=>[item.id,item.amount]));
   for(const sample of row.rolls)for(const item of sample)if(!expected.has(item.id)){
    expected.set(item.id,item.amount);if(row.mode==='both')combinedNewTypes++;
   }
   if(treasure)for(const [id,amount] of expected)expected.set(id,amount*2);
   const actual=new Map();
   for(const entity of dimension.getEntities({type:'minecraft:item',location:row.at,maxDistance:2})){
    const stack=entity.getComponent('minecraft:item').itemStack;
    if(stack.typeId==='minecraft:nether_star')continue;
    if(JSON.stringify(stack.getLore())!==JSON.stringify(['native metadata marker']))throw Error(row.mode+': metadata lost');
    actual.set(stack.typeId,(actual.get(stack.typeId)??0)+stack.amount);
   }
   if(JSON.stringify([...actual].sort())!==JSON.stringify([...expected].sort()))throw Error(row.mode+': wrong output '+JSON.stringify({actual:[...actual],expected:[...expected]}));
   emit({kind:'case',mode:row.mode,original:row.original,rolls:row.rolls,actual:[...actual],expected:[...expected],events:row.events});
  }
  if(cases.size!==12||combinedNewTypes===0)throw Error('Missing combined native new-type evidence');
  const stars=dimension.getEntities({type:'minecraft:item'}).reduce((sum,entity)=>{const stack=entity.getComponent('minecraft:item').itemStack;return sum+(stack.typeId==='minecraft:nether_star'?stack.amount:0);},0);
  if(stars!==7||treasureDropDiagnostics.errors.length)throw Error('Unrelated items changed or production drop failure');
  emit({kind:'done',cases:cases.size,combinedNewTypes,unrelated:stars,players:world.getAllPlayers().length,errors:treasureDropDiagnostics.errors});
  dimension.runCommand('tickingarea remove death_drops_qa');
 }catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},60);
});
