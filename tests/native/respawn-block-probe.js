import {world,system,BlockPermutation} from '@minecraft/server';
import {javaBlockView,sourceFullUpperFace} from './respawn-blocks.js';
import {anchorStandUpStages,selectStandUpPosition,findSafeDismount,respawnFloorHeight,respawnLookAtYaw,sourceBlockCollision,sourceBorderContains,JAVA_RESPAWN_DEFAULT_CONTEXT} from './respawn-adapter.js';
const PREFIX='[RESPAWN_BLOCK_QA] ';const emit=x=>console.warn(PREFIX+JSON.stringify(x));
function set(d,p,id,states={}){d.getBlock(p).setPermutation(BlockPermutation.resolve(id,states));}
function bounds(p){const half=Math.fround(.6)/2;return {minX:p.x-half,minY:p.y,minZ:p.z-half,maxX:p.x+half,maxY:p.y+Math.fround(1.8),maxZ:p.z+half};}
let tries=0;
function run(){
 try{
  const d=world.getDimension('overworld'),n=world.getDimension('nether');
  if(!d.getBlock({x:0,y:64,z:0})||!n.getBlock({x:10,y:64,z:10}))throw Error('Chunk not ready');
  set(d,{x:0,y:64,z:0},'minecraft:stone');let b=d.getBlock({x:0,y:64,z:0}),view=javaBlockView(b);emit({kind:'case',name:'stone',nativeId:b.typeId,nativeStates:b.permutation.getAllStates(),sourceId:view.id,boxes:view.collisionBoxes(),upperFace:sourceFullUpperFace(view.collisionBoxes()),ok:sourceFullUpperFace(view.collisionBoxes())});
  set(d,{x:1,y:64,z:0},'minecraft:soul_sand');b=d.getBlock({x:1,y:64,z:0});view=javaBlockView(b);emit({kind:'case',name:'soul_sand',nativeId:b.typeId,sourceId:view.id,boxes:view.collisionBoxes(),upperFace:sourceFullUpperFace(view.collisionBoxes()),ok:!sourceFullUpperFace(view.collisionBoxes())});
  for(let x=7;x<=13;x++)for(let z=7;z<=13;z++){set(n,{x,y:63,z},'minecraft:stone');for(let y=64;y<=66;y++)set(n,{x,y,z},'minecraft:air');}
  const origin={x:10,y:64,z:10};set(n,origin,'minecraft:respawn_anchor',{respawn_anchor_charge:2});
  b=n.getBlock(origin);view=javaBlockView(b);const read=p=>javaBlockView(n.getBlock(p));
  const selected=selectStandUpPosition(origin,anchorStandUpStages(),(p,strict)=>findSafeDismount(p,strict,{
   isDangerous:p=>read(p).flag('player_block_dangerous'),
   floorHeight:p=>{const s=read(p).floorBoxes();return respawnFloorHeight(s.length?Math.max(...s.map(b=>b[4])):null,()=>{const s=read({...p,y:p.y-1}).floorBoxes();return s.length?Math.max(...s.map(b=>b[4])):null;});},
   collides:p=>sourceBlockCollision(bounds(p),read),invalidSpawnInside:p=>read(p).flag('invalid_spawn_inside'),insideBorder:p=>sourceBorderContains(JAVA_RESPAWN_DEFAULT_CONTEXT.border,bounds(p))
  }));
  emit({kind:'case',name:'nether_anchor_source_selection',nativeId:b.typeId,nativeStates:b.permutation.getAllStates(),charges:Number(view.property('charges')),selected,yaw:respawnLookAtYaw(selected,origin),ok:Number(view.property('charges'))===2&&selected.x===10.5&&selected.y===64&&selected.z===9.5});
  const foot={x:30,y:64,z:30},head={x:30,y:64,z:31};for(const p of [foot,head])set(d,{...p,y:63},'minecraft:stone');set(d,foot,'minecraft:bed',{direction:0,head_piece_bit:false});set(d,head,'minecraft:bed',{direction:0,head_piece_bit:true});
  b=d.getBlock(head);view=javaBlockView(b);emit({kind:'case',name:'native_bed_source_properties',nativeId:b.typeId,nativeStates:b.permutation.getAllStates(),sourceId:view.id,facing:view.property('facing'),part:view.property('part'),boxes:view.collisionBoxes(),ok:view.property('facing')==='south'&&view.property('part')==='head'});
  emit({kind:'done',cases:4,players:world.getAllPlayers().length});
 }catch(error){if(++tries<12&&String(error).includes('Chunk')){system.runTimeout(run,10);return;}emit({kind:'failure',error:String(error)});}
}
system.runTimeout(run,140);
