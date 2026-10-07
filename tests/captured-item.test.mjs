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
