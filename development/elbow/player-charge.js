/** Exact Minecraft1.21.1 Player source arithmetic and tick/item-type rules.
 * No Native ticker, attack-speed attribute or Player event phase is inferred.
 */
const f=Math.fround;
function ticker(value){if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw Error('SOURCE_ATTACK_TICKER_REQUIRED');return value;}
export function currentAttackStrengthDelay(attackSpeed){
 if(!Number.isFinite(attackSpeed)||attackSpeed<0||attackSpeed>1024)throw Error('SOURCE_ATTACK_SPEED_REQUIRED');
 // Source dconst1 / attribute, then dmul20, then d2f; not a float division.
 return f((1/attackSpeed)*20);
}
export function playerAttackStrengthScale({attackTicker,attackSpeed,partialTick=.5}){
 ticker(attackTicker);if(!Number.isFinite(f(partialTick)))throw Error('SOURCE_PARTIAL_TICK_REQUIRED');
 const value=f(f(f(attackTicker)+f(partialTick))/currentAttackStrengthDelay(attackSpeed));
 return Math.max(0,Math.min(1,value));
}
export function playerChargeTick({attackTicker,previousMainHandType,currentMainHandType}){
 ticker(attackTicker);if(typeof previousMainHandType!=='string'||typeof currentMainHandType!=='string')throw Error('SOURCE_MAIN_HAND_TYPE_REQUIRED');
 // Player.tick increments first; stack/component changes only update its copy.
 // A changed Item identity resets; count, lore and enchantment alone do not.
 return {attackTicker:previousMainHandType===currentMainHandType?(attackTicker+1)|0:0,previousMainHandType:currentMainHandType};
}
export function playerChargeAttack({attackTicker,attackSpeed,sprinting}){
 if(typeof sprinting!=='boolean')throw Error('SOURCE_SPRINT_STATE_REQUIRED');
 const scale=playerAttackStrengthScale({attackTicker,attackSpeed,partialTick:.5});
 return {attackStrengthScale:scale,sprintBonus:sprinting&&scale>f(.9),nextAttackTicker:0};
}
