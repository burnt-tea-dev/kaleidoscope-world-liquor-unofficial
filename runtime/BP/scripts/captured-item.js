/** isStackableWith is compatibility, never identity: intrinsic unstackable
 * items always return false. This read-only guard compares stable observable
 * metadata in that case; hidden engine/foreign-pack components remain native.
 */
const sorted=values=>[...(values??[])].sort();
const properties=item=>sorted(item.getDynamicPropertyIds?.()).map(key=>[key,item.getDynamicProperty(key)]);
const enchants=item=>(item.getComponent?.('minecraft:enchantable')?.getEnchantments()??[]).map(e=>[e.type.id,e.level]).sort((a,b)=>a[0].localeCompare(b[0]));
function observable(item){
 return [item.nameTag,item.keepOnDeath,item.lockMode,item.getRawLore?.()??item.getLore?.()??[],sorted(item.getCanDestroy?.()),sorted(item.getCanPlaceOn?.()),sorted(item.getTags?.()),properties(item),item.getComponent?.('minecraft:durability')?.damage,enchants(item)];
}
export function sameCapturedItem(actual,expected){
 if(!actual||!expected||actual.typeId!==expected.typeId||actual.amount!==expected.amount||actual.maxAmount!==expected.maxAmount)return false;
 if(actual.isStackableWith(expected))return true;
 if(actual.maxAmount!==1)return false;
 return JSON.stringify(observable(actual))===JSON.stringify(observable(expected));
}
