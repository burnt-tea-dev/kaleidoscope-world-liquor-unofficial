import test from 'node:test';
import assert from 'node:assert/strict';
import {sameCapturedItem} from '../runtime/BP/scripts/captured-item.js';
function stack(extra={}){return {typeId:'minecraft:diamond_sword',amount:1,maxAmount:1,nameTag:'kept',isStackableWith:()=>false,getRawLore:()=>[{text:'lore'}],getDynamicPropertyIds:()=>['test:value'],getDynamicProperty:()=>7,getComponent:id=>id==='minecraft:durability'?{damage:12}:id==='minecraft:enchantable'?{getEnchantments:()=>[{type:{id:'sharpness'},level:3}]}:undefined,...extra};}
test('intrinsically unstackable native-compatible copies match without stack compatibility',()=>{assert.equal(sameCapturedItem(stack(),stack()),true);});
test('observable nonstackable metadata/count changes and missing origins are rejected',()=>{
 for(const extra of [{typeId:'minecraft:diamond'},{amount:2},{nameTag:'foreign'},{getRawLore:()=>[{text:'changed'}]},{getDynamicProperty:()=>8},{getComponent:id=>id==='minecraft:durability'?{damage:13}:undefined}])assert.equal(sameCapturedItem(stack(extra),stack()),false);
 assert.equal(sameCapturedItem(undefined,stack()),false);
});
test('engine-rejected stackable metadata never falls back to the intrinsic-one-item guard',()=>{assert.equal(sameCapturedItem(stack({maxAmount:64}),stack({maxAmount:64})),false);});
const potion=(component,typeId='minecraft:potion')=>stack({typeId,getComponent:id=>id==='minecraft:potion'?component:undefined});
const healing=()=>({potionEffectType:{id:'Healing'},potionDeliveryType:{id:'Consume'}});
test('captured potion identity includes its native effect and delivery type',()=>{
 for(const typeId of ['minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion']){
  const original=potion(healing(),typeId);assert.equal(sameCapturedItem(potion(healing(),typeId),original),true);
  assert.equal(sameCapturedItem(potion({...healing(),potionEffectType:{id:'Poison'}},typeId),original),false);
  assert.equal(sameCapturedItem(potion({...healing(),potionDeliveryType:{id:'Splash'}},typeId),original),false);
 }
});
test('unavailable potion identity cannot authorize a captured-item mutation',()=>{
 for(const typeId of ['minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion']){
  for(const component of [undefined,{}, {...healing(),potionEffectType:{id:''}}, {...healing(),potionDeliveryType:{}}]){
   assert.throws(()=>sameCapturedItem(potion(component,typeId),potion(component,typeId)),/POTION_IDENTITY_UNAVAILABLE/);
  }
 }
 const unreadable=stack({typeId:'minecraft:potion',getComponent:id=>{if(id==='minecraft:potion')throw Error('COMPONENT_UNAVAILABLE');}});
 assert.throws(()=>sameCapturedItem(unreadable,potion(healing())),/COMPONENT_UNAVAILABLE/);
 const effectError={...healing(),get potionEffectType(){throw Error('EFFECT_UNAVAILABLE');}};
 assert.throws(()=>sameCapturedItem(potion(effectError),potion(healing())),/EFFECT_UNAVAILABLE/);
});
