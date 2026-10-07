// Deterministic callback fixture, not a Bedrock client or server.
class Signal{handlers=[];subscribe(f){this.handlers.push(f);}emit(e){for(const f of this.handlers)f(e);}}
const dynamic=new Map(),queue=[];
export const system={currentTick:0,run:f=>queue.push(f),runInterval(){},runTimeout(f){queue.push(f);},flush(){while(queue.length)queue.shift()();}};
export const world={beforeEvents:{playerBreakBlock:new Signal(),playerInteractWithBlock:new Signal()},afterEvents:{entityLoad:new Signal(),playerBreakBlock:new Signal()},gameRules:{doTileDrops:true},getDynamicProperty:k=>dynamic.get(k),setDynamicProperty(k,v){if(this.failSave){this.failSave=false;throw Error('injected save failure');}if(v===undefined)dynamic.delete(k);else dynamic.set(k,v);},getAllPlayers:()=>[]};
export class BlockPermutation{constructor(id,states={}){this.type={id};this.states={...states};}static resolve(id,s){return new this(id,s);}getState(k){return this.states[k];}withState(k,v){return new BlockPermutation(this.type.id,{...this.states,[k]:v});}}
export class ItemStack{constructor(id,amount=1){this.typeId=id;this.amount=amount;this.maxAmount=64;}clone(){return new ItemStack(this.typeId,this.amount);}isStackableWith(x){return x?.typeId===this.typeId;}getLore(){return [];}getDynamicPropertyIds(){return [];}getComponent(){}}
let handler,placeMode='none';
export function setup(h){handler=h;}
export function placements(mode){placeMode=mode;}
export class Dimension{
 id='minecraft:overworld';blocks=new Map();drops=[];sounds=[];failSpawn=false;failSet=false;
 getBlock(p){const k=JSON.stringify(p);if(!this.blocks.has(k))this.blocks.set(k,new Block(this,{...p}));return this.blocks.get(k);}
 getEntities(){return [];}playSound(s){this.sounds.push(s);}
 spawnItem(item,position){if(this.failSpawn)throw Error('injected drop failure');const e={item:item.clone(),position,removed:false,remove(){this.removed=true;}};this.drops.push(e);return e;}
}
class Block{
 constructor(d,p){this.dimension=d;this.location=p;this.permutation=BlockPermutation.resolve('minecraft:air');}
 get typeId(){return this.permutation.type.id;}get isAir(){return this.typeId==='minecraft:air';}get isSolid(){return !this.isAir;}
 setPermutation(p){if(this.dimension.failSet){this.dimension.failSet=false;throw Error('injected block failure');}const old=this.permutation;this.permutation=p;if(p.type.id==='kaleidoscope_world_liquor:wall_record'&&placeMode!=='none'){const f=()=>handler.onPlace({block:this,previousBlock:old});if(placeMode==='sync')f();else system.run(f);}}
 setType(id){this.setPermutation(BlockPermutation.resolve(id));}
}
let serial=0;
export function player(d,mode='survival'){
 const slots=Array(9),inv={size:slots.length,getItem:i=>slots[i]?.clone(),setItem(i,item){if(inv.failWrite){inv.failWrite=false;throw Error('injected inventory failure');}slots[i]=item?.clone();}};
 const equipment={getEquipment:()=>undefined,setEquipment:()=>true};
 return {id:'player'+(++serial),typeId:'minecraft:player',dimension:d,location:{x:0,y:0,z:0},selectedSlotIndex:0,isSneaking:true,getGameMode:()=>mode,getRotation:()=>({x:0,y:0}),getComponent:id=>id==='minecraft:equippable'?equipment:{container:inv},onScreenDisplay:{setActionBar(){}},inv};
}
export function reset(){dynamic.clear();queue.length=0;world.failSave=false;world.gameRules.doTileDrops=true;system.currentTick+=10;placeMode='none';}

export class MolangVariableMap{setFloat(){}setVector3(){}}
