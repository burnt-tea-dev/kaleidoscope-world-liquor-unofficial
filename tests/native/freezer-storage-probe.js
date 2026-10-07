import {world,system,ItemStack,BlockPermutation,EnchantmentTypes} from '@minecraft/server';
import {planFreezerStorage,readFreezerItems,freezerStorageKey,freezerNativeItems} from './freezer-storage.js';
import {nativeItemKey,NATIVE_STORAGE_OWNER} from './freezer-native-storage.js';
import {sameCapturedItem} from './captured-item.js';
const N='kaleidoscope_world_liquor',phaseKey=N+':qa/native_inputs_phase';
const check=(v,code)=>{if(!v)throw Error(code);};
const emit=row=>console.warn('[FREEZER_STORAGE_QA] '+JSON.stringify(row));
const snapshot=item=>item&&({id:item.typeId,count:item.amount,max:item.maxAmount,name:item.nameTag,lore:item.getRawLore(),properties:item.getDynamicPropertyIds().sort().map(k=>[k,item.getDynamicProperty(k)]),damage:item.getComponent('minecraft:durability')?.damage,enchants:(item.getComponent('minecraft:enchantable')?.getEnchantments()??[]).map(e=>[e.type.id,e.level]).sort(),keepOnDeath:item.keepOnDeath,lock:item.lockMode,canDestroy:item.getCanDestroy(),canPlaceOn:item.getCanPlaceOn()});
const read=b=>JSON.parse(world.getDynamicProperty(freezerStorageKey(b)));
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
function insert(b,item){const s=read(b),next={...s,input:[...s.input,item.typeId]},p=planFreezerStorage(b,next,{incoming:item});p.apply();p.finish();}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{
 try{
  check(world.getAllPlayers().length===0,'PLAYERS_PRESENT');const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 64 0 2 freezer_inputs_qa');
  let b;for(let i=0;i<100;i++){try{b=d.getBlock({x:0,y:64,z:0});}catch{}if(b)break;await wait(1);}check(b,'UNLOADED_BLOCK');
  const phase=world.getDynamicProperty(phaseKey);
  if(!phase){
   b.setPermutation(BlockPermutation.resolve(N+':freezer'));
   world.setDynamicProperty(freezerStorageKey(b),JSON.stringify({type:N+':freezer',input:['minecraft:apple'],fluid:null,remaining:0,output:0}));
   const named=new ItemStack('minecraft:sugar',3);named.nameTag='original sugar';named.setLore([{text:'foreign style lore'}]);check(sameCapturedItem(named,named.clone()),'NAMED_STACK_GUARD');
   const sword=new ItemStack('minecraft:diamond_sword');sword.nameTag='original sword';sword.setLore(['persistent metadata']);sword.setDynamicProperty('qa:string','kept');sword.setDynamicProperty('qa:number',17);sword.setDynamicProperty('qa:vector',{x:1,y:2,z:3});sword.getComponent('minecraft:durability').damage=23;sword.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('unbreaking'),level:2});sword.keepOnDeath=true;sword.setCanDestroy(['minecraft:stone']);
   check(sword.isStackableWith(sword.clone())===false,'INTRINSIC_STACK_COMPATIBILITY');check(sameCapturedItem(sword,sword.clone()),'INTRINSIC_GUARD');const milk=new ItemStack('minecraft:milk_bucket');check(milk.maxAmount===1&&!milk.isStackableWith(milk.clone())&&sameCapturedItem(milk,milk.clone()),'MILK_GUARD');
   insert(b,named);insert(b,sword);const state=read(b),items=readFreezerItems(b,state).map(snapshot);check(items[0].id==='minecraft:apple'&&items[1].name==='original sugar'&&items[2].name==='original sword','NATIVE_INSERT');
   const record=JSON.parse(world.getDynamicProperty(nativeItemKey(freezerStorageKey(b))));check(world.getEntity(record.entity).getComponent('minecraft:inventory').container.size===4,'CAPACITY');
   world.setDynamicProperty(N+':qa/native_expected',JSON.stringify(items));world.setDynamicProperty(N+':qa/native_entity',record.entity);world.setDynamicProperty(phaseKey,1);emit({kind:'done',phase:'first',players:0,cases:['legacy adoption','named stack','intrinsic guard','milk guard','native four slots','sword metadata'],items,entity:record.entity});
  }else{
   check(phase===1,'UNEXPECTED_RESTART');const loadedId=world.getDynamicProperty(N+':qa/native_entity');for(let i=0;i<100&&!world.getEntity(loadedId)?.isValid;i++)await wait(1);
   const state=read(b),items=readFreezerItems(b,state).map(snapshot),expected=JSON.parse(world.getDynamicProperty(N+':qa/native_expected'));check(JSON.stringify(items)===JSON.stringify(expected),'RESTART_METADATA_CHANGED');
   const record=JSON.parse(world.getDynamicProperty(nativeItemKey(freezerStorageKey(b))));check(record.entity===world.getDynamicProperty(N+':qa/native_entity'),'ENTITY_RECREATED');const e=world.getEntity(record.entity);check(e.getDynamicProperty(NATIVE_STORAGE_OWNER)===freezerStorageKey(b),'OWNER_CHANGED');
   const remove=planFreezerStorage(b,{...state,input:state.input.slice(0,-1)});check(JSON.stringify(snapshot(remove.removed[0].stack))===JSON.stringify(expected[2]),'EXTRACTION_CHANGED');remove.apply();remove.rollback();check(JSON.stringify(readFreezerItems(b,read(b)).map(snapshot))===JSON.stringify(expected),'ROLLBACK_CHANGED');
   // Recovery moves only the carrier. Its original container and DP survive.
   e.teleport({x:2.5,y:64.5,z:.5});let rejected=false;try{readFreezerItems(b,read(b));}catch(error){rejected=String(error).includes('NATIVE_STORAGE_MOVED');}check(rejected,'MOVED_NOT_REJECTED');
   system.runTimeout(()=>{try{
    check(JSON.stringify(readFreezerItems(b,read(b)).map(snapshot))===JSON.stringify(expected),'REANCHOR_CHANGED');const consume=planFreezerStorage(b,{...read(b),input:[],remaining:1200});consume.apply();consume.finish();check(!e.isValid&&read(b).input.length===0,'CRAFT_NOT_RETIRED');check(world.getDynamicProperty(nativeItemKey(freezerStorageKey(b)))===undefined,'STALE_NATIVE_ROW');
    emit({kind:'done',phase:'restart',players:0,cases:['same entity after restart','full metadata preserved','exact extraction','rollback','moved carrier recovery','craft retirement'],items});
   }catch(error){emit({kind:'failure',phase:'restart',error:String(error)});}},5);
  }
 }catch(error){emit({kind:'failure',error:String(error)});}
},20));
