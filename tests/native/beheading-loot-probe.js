import {world,system,EntityDamageCause,ItemStack,ItemTypes} from '@minecraft/server';
import {installDeathDrops,treasureDropDiagnostics} from './treasure-drops.js';
import {BEHEADED_MARKER,beheadingDiagnostics} from './beheading.js';
const emit=row=>console.warn('[HEAD_LOOT] '+JSON.stringify(row));
const view=stack=>({id:stack.typeId,amount:stack.amount,name:stack.nameTag??null,lore:stack.getLore()});
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld'),cases=new Map(),actors=new Map(),restart=world.getDynamicProperty('head_probe:phase')===1;
 const manager=world.getLootTableManager(),observedWorld={afterEvents:world.afterEvents,getEntity:id=>world.getEntity(id),getLootTableManager:()=>({generateLootFromEntity(entity,tool){
  const stacks=manager.generateLootFromEntity(entity,tool),sample=[];
  for(let i=0;i<(stacks?.length??0);i++)sample.push(view(stacks[i]));
  cases.get(entity.id).rolls.push(sample);return stacks;
 }})};
 const drops=installDeathDrops(observedWorld,system,{read:actor=>actors.get(actor.id)??{},killCredit:{state:()=>({})},createStack:(id,count)=>new ItemStack(id,count),lookup:id=>ItemTypes.get(id),random:()=>0});
 world.afterEvents.entityDie.subscribe(event=>{
  const row=cases.get(event.deadEntity.id);if(!row)return;
  if(event.damageSource.damagingEntity?.id!==row.owner)throw Error('Death source owner changed');
  drops.death(event);row.markerCleared=event.deadEntity.getDynamicProperty(BEHEADED_MARKER)===undefined;
 });
 world.afterEvents.entityItemDrop.subscribe(event=>{
  const row=cases.get(event.entity.id);if(!row)return;
  row.events++;const items=event.items;
  for(let i=0;i<items.length;i++)row.original.push(view(items[i].getComponent('minecraft:item').itemStack));
 });
 dimension.runCommand('tickingarea add circle 24 80 24 3 head_loot_qa');
 system.runTimeout(()=>{try{
  dimension.runCommand('fill 0 79 0 42 79 44 stone');
  const kill=(mode,target,at)=>{
   const attacker=dimension.spawnEntity('minecraft:zombie',{x:0,y:80,z:0});
   actors.set(attacker.id,mode==='restart'?{}:{luck:{amplifier:4},...(mode==='both'||mode==='named'?{treasure_guide:{amplifier:0}}:{})});
   cases.set(target.id,{mode,at,owner:attacker.id,events:0,original:[],rolls:[],head:mode==='named'?'senluo_cap:named_mob_head':'senluo_cap:loot_mob_head'});
   target.applyDamage(100,{cause:EntityDamageCause.entityAttack,damagingEntity:attacker});
  };
  if(restart){
   const saved=dimension.getEntities({tags:['head_probe:persist']});
   if(saved.length!==1||saved[0].getDynamicProperty(BEHEADED_MARKER)!==true)throw Error('Persisted marker missing after normal restart');
   emit({kind:'restored',marker:true});kill('restart',saved[0],{...saved[0].location});
  }else{
   for(let i=0;i<18;i++){
    const mode=i<8?'luck':i<16?'both':'named',at={x:5+(i%5)*8,y:80,z:5+Math.floor(i/5)*8};
    const target=dimension.spawnEntity(mode==='named'?'senluo_cap:named_mob':'senluo_cap:loot_mob',at);
    target.setDynamicProperty(BEHEADED_MARKER,true);kill(mode,target,at);
   }
   const saved=dimension.spawnEntity('senluo_cap:loot_mob',{x:5,y:80,z:41});saved.addTag('head_probe:persist');saved.setDynamicProperty(BEHEADED_MARKER,true);
   world.setDynamicProperty('head_probe:phase',1);emit({kind:'saved',marker:saved.getDynamicProperty(BEHEADED_MARKER)});
  }
 }catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},50);
 system.runTimeout(()=>{try{
  const witnesses={luck:0,both:0};
  for(const row of cases.values()){
   if(row.events!==1||!row.markerCleared)throw Error(row.mode+': death cohort/marker was not settled once');
   const items=dimension.getEntities({type:'minecraft:item',location:row.at,maxDistance:2}).map(entity=>view(entity.getComponent('minecraft:item').itemStack));
   const heads=items.filter(item=>item.id===row.head),plain=heads.filter(item=>item.name===null&&item.lore.length===0).reduce((sum,item)=>sum+item.amount,0);
   if(row.mode==='named'){
    if(plain!==1||heads.filter(item=>item.name==='Native trophy'&&JSON.stringify(item.lore)===JSON.stringify(['owner metadata'])).reduce((sum,item)=>sum+item.amount,0)!==2)throw Error('Distinct native head metadata was suppressed or changed');
   }else{
    const originalHead=row.original.some(item=>item.id===row.head),luckHead=row.rolls.some(sample=>sample.some(item=>item.id===row.head));
    const expected=row.mode==='both'&&(originalHead||luckHead)?2:1;
    if(plain!==expected)throw Error(row.mode+': expected '+expected+' plain heads, got '+plain);
    if(!originalHead&&luckHead&&row.mode in witnesses)witnesses[row.mode]++;
   }
   emit({kind:'case',...row,items});
  }
  if(cases.size!==(restart?1:18)||!restart&&(!witnesses.luck||!witnesses.both))throw Error('Missing original-no-head/Luck-head witnesses');
  if(treasureDropDiagnostics.errors.length||beheadingDiagnostics.errors.length)throw Error('Production handler failure '+JSON.stringify({treasure:treasureDropDiagnostics.errors,beheading:beheadingDiagnostics.errors}));
  dimension.runCommand('tickingarea remove head_loot_qa');
  emit({kind:'done',phase:restart?'restart':'first',cases:cases.size,witnesses,players:world.getAllPlayers().length,beheading:beheadingDiagnostics,treasure:treasureDropDiagnostics});
 }catch(error){emit({kind:'failure',error:String(error),stack:error.stack});}},60);
});
