// QA entrypoint: production startup owns acceptance, debit, storage and audio.
// After prepare this observer only reads. It never synthesizes a block event.
import './main.js';
import {world,system,ItemStack,ScriptEventSource} from '@minecraft/server';
import {recordStorageKey} from './record-storage.js';
import {freezerStorageKey} from './freezer-storage.js';
import {nativeItemKey,nativeItemRequiredKey,NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER} from './freezer-native-storage.js';

const ID='kaleidoscope_world_liquor:custom_record';
const PREFIX='RECORD_NETWORK_CLICK_QA';
const snapshot=item=>item?{
 type:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getRawLore(),
 properties:item.getDynamicPropertyIds().sort().map(key=>[key,item.getDynamicProperty(key)]),
 keepOnDeath:item.keepOnDeath,lockMode:item.lockMode,
 canDestroy:item.getCanDestroy(),canPlaceOn:item.getCanPlaceOn()
}:null;
const inventory=p=>p.getComponent('minecraft:inventory').container;
const contents=container=>Array.from({length:container.size},(_,i)=>snapshot(container.getItem(i)));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const point=v=>({x:v.x,y:v.y,z:v.z});
const report=(kind,value)=>console.warn(PREFIX+'_'+kind+' '+JSON.stringify(value));
let scenario;

function prepare(message){
 if(scenario)throw Error('ALREADY_PREPARED');
 const input=JSON.parse(message);
 if(typeof input.player!=='string'||!input.player)throw Error('Provide the already connected QA player name');
 const players=world.getAllPlayers();
 if(players.length!==1||players[0].name!==input.player)throw Error('Require exactly the named, already connected QA player');
 const player=players[0],inv=inventory(player);
 if(String(player.getGameMode()).toLowerCase()!=='survival'||player.isSneaking||!player.isOnGround)
  throw Error('Require standing, non-sneaking Survival player on the QA floor');
 if(player.dimension.id!=='minecraft:overworld'||player.selectedSlotIndex!==0||inv.getItem(0))
  throw Error('Require overworld, selected empty hotbar slot 0');
 if(player.getComponent('minecraft:equippable').getEquipment('Offhand'))throw Error('Require empty offhand');

 // Keep the real network actor where the server placed it. Root supplies the
 // ordinary look/block-use input; ScriptAPI never turns or clicks the player.
 const target={x:Math.floor(player.location.x),y:Math.floor(player.location.y),z:Math.floor(player.location.z)+2};
 const block=player.dimension.getBlock(target),floor=player.dimension.getBlock({...target,y:target.y-1});
 if(!block?.isAir||!floor?.isSolid)throw Error('Require empty target two blocks south on a solid QA floor');
 const recordKey=recordStorageKey(block),rowKey=freezerStorageKey(block);
 if([rowKey,nativeItemKey(recordKey),nativeItemRequiredKey(recordKey)].some(key=>world.getDynamicProperty(key)!==undefined))
  throw Error('Target has existing owned storage');
 const head=point(player.getHeadLocation()),hit={x:target.x+.5,y:target.y+.5,z:target.z};
 const delta={x:hit.x-head.x,y:hit.y-head.y,z:hit.z-head.z};
 const distance=Math.hypot(delta.x,delta.y,delta.z);
 if(distance>3)throw Error('North-face center must be within three blocks of the actual head');
 const desiredRotation={x:-Math.atan2(delta.y,Math.hypot(delta.x,delta.z))*180/Math.PI,
  y:-Math.atan2(delta.x,delta.z)*180/Math.PI};
 const item=new ItemStack(ID,1);
 item.nameTag='W201 network-click disc';
 item.setLore(['One real jukebox insertion']);
 item.setDynamicProperty('record_click_qa:serial','one-network-disc');
 block.setType('minecraft:jukebox');
 inv.setItem(0,item);
 const seeded=inv.getItem(0);
 if(!same(snapshot(seeded),snapshot(item)))throw Error('Seeded native inventory changed the sample');
 scenario={playerId:player.id,playerName:player.name,dimension:player.dimension.id,target,
  recordKey,rowKey,expected:snapshot(seeded),before:contents(inv),preparedTick:system.currentTick,
  firstEvents:0,repeatEvents:0};
 report('READY',{player:player.name,playerId:player.id,mode:String(player.getGameMode()),
  position:point(player.location),head,target,blockId:block.typeId,blockStates:block.permutation.getAllStates(),face:'north',
  hit,relativeHit:{x:.5,y:.5,z:0},distance,desiredRotation,selectedSlot:0,held:scenario.expected,
  next:'Root normal network look and block click, then record_click_qa:read after at least two server ticks'});
}

world.beforeEvents.playerInteractWithBlock.subscribe(event=>{
 const s=scenario;
 if(!s||event.player.id!==s.playerId||event.block.dimension.id!==s.dimension||
  !['x','y','z'].every(axis=>event.block.location[axis]===s.target[axis]))return;
 if(event.isFirstEvent===false){s.repeatEvents++;return;}
 s.firstEvents++;
 if(s.acceptedEvent)return;
 try{
  s.acceptedEvent={tick:system.currentTick,block:event.block.typeId,face:String(event.blockFace),
   faceLocation:point(event.faceLocation),first:event.isFirstEvent,selectedSlot:event.player.selectedSlotIndex,
   sneaking:event.player.isSneaking,held:snapshot(event.itemStack),
   position:point(event.player.location),head:point(event.player.getHeadLocation()),
   view:point(event.player.getViewDirection())};
  report('EVENT',s.acceptedEvent);
 }catch(error){s.observerError=String(error);}
 // Production furniture.js alone may cancel and defer the accepted use.
});

function read(){
 const s=scenario;
 if(!s)throw Error('NOT_PREPARED');
 const player=world.getAllPlayers().find(p=>p.id===s.playerId);
 if(!player)throw Error('QA_PLAYER_DISCONNECTED');
 if(s.acceptedEvent&&system.currentTick<s.acceptedEvent.tick+2){
  report('PENDING',{tick:system.currentTick,readAfterTick:s.acceptedEvent.tick+2});return;
 }
 const dimension=world.getDimension(s.dimension),block=dimension.getBlock(s.target);
 const raw=world.getDynamicProperty(s.rowKey),nativeRaw=world.getDynamicProperty(nativeItemKey(s.recordKey));
 const row=raw===undefined?null:JSON.parse(raw),index=nativeRaw===undefined?null:JSON.parse(nativeRaw);
 const carrier=index?.entity&&world.getEntity(index.entity),container=carrier?.getComponent('minecraft:inventory')?.container;
 // Read the actual native container, never reconstruct an item from row.record.
 const stored=container&&contents(container),after=contents(inventory(player)),event=s.acceptedEvent;
 const checks={
  one_real_before_event:s.firstEvents===1&&!s.observerError&&!!event,
  accepted_original_hand:!!event&&event.first!==false&&event.selectedSlot===0&&!event.sneaking&&same(event.held,s.expected),
  vanilla_jukebox_route:event?.block==='minecraft:jukebox'&&block?.typeId==='minecraft:jukebox',
  north_face:event?.face.toLowerCase()==='north',
  selected_disc_paid:after[0]===null,
  other_inventory_unchanged:same(after.slice(1),s.before.slice(1)),
  production_row:row?.record===ID&&row?.type==='minecraft:jukebox',
  production_carrier:carrier?.typeId===NATIVE_ITEM_ENTITY&&carrier.getDynamicProperty(NATIVE_STORAGE_OWNER)===s.recordKey,
  adopted_index:index?.key===s.recordKey&&index?.ids?.[0]===ID&&world.getDynamicProperty(nativeItemRequiredKey(s.recordKey))===1,
  complete_native_stack:container?.size===4&&same(stored?.[0],s.expected)&&stored.slice(1).every(item=>item===null)
 };
 report('RESULT',{passed:Object.values(checks).every(Boolean),checks,preparedTick:s.preparedTick,
  observedTick:system.currentTick,firstEvents:s.firstEvents,repeatEvents:s.repeatEvents,
  observerError:s.observerError,acceptedEvent:event??null,inventoryBefore:s.before,inventoryAfter:after,
  row,index,carrierId:carrier?.id,stored:stored??null,
  scope:'Native event/debit/storage observations only; attach root network initialization and block-use trace to establish the network Player origin'});
}

system.afterEvents.scriptEventReceive.subscribe(event=>{
 if(event.sourceType!==ScriptEventSource.Server)return;
 if(event.id!=='record_click_qa:prepare'&&event.id!=='record_click_qa:read')return;
 try{if(event.id==='record_click_qa:prepare')prepare(event.message);else read();}
 catch(error){report('ERROR',{command:event.id,error:String(error),prepared:!!scenario});}
});
