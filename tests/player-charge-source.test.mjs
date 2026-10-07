import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentAttackStrengthDelay,playerAttackStrengthScale,playerChargeTick,playerChargeAttack} from '../development/elbow/player-charge.js';
const rows=fs.readFileSync(new URL('./fixtures/java-player-charge.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
test('80 JVM-evaluated delay/float/clamp/strict sprint-threshold cases preserve actual source operator order',()=>{
 assert.equal(rows.length,80);
 for(const row of rows){assert.equal(currentAttackStrengthDelay(row.speed),row.delay==='Infinity'?Infinity:Math.fround(row.delay));assert.equal(playerAttackStrengthScale({attackTicker:row.ticker,attackSpeed:row.speed}),Math.fround(row.scale));assert.equal(playerChargeAttack({attackTicker:row.ticker,attackSpeed:row.speed,sprinting:true}).sprintBonus,row.sprintBonus);}
});
test('source tick increments then checks Item identity; component-only changes do not reset and int ticker wraps',()=>{
 assert.deepEqual(playerChargeTick({attackTicker:5,previousMainHandType:'minecraft:iron_sword',currentMainHandType:'minecraft:iron_sword'}),{attackTicker:6,previousMainHandType:'minecraft:iron_sword'});
 assert.equal(playerChargeTick({attackTicker:5,previousMainHandType:'minecraft:iron_sword',currentMainHandType:'minecraft:diamond_sword'}).attackTicker,0);
 assert.equal(playerChargeTick({attackTicker:2147483647,previousMainHandType:'minecraft:air',currentMainHandType:'minecraft:air'}).attackTicker,-2147483648);
});
test('accepted-source attack eligibility resets the ticker and does not invent unreadable attack speed or sprint state',()=>{
 assert.deepEqual(playerChargeAttack({attackTicker:4,attackSpeed:4,sprinting:true}),{attackStrengthScale:Math.fround(.9),sprintBonus:false,nextAttackTicker:0});
 assert.equal(playerChargeAttack({attackTicker:5,attackSpeed:4,sprinting:false}).sprintBonus,false);
 assert.throws(()=>currentAttackStrengthDelay(undefined),/SOURCE_ATTACK_SPEED_REQUIRED/);assert.throws(()=>playerChargeAttack({attackTicker:5,attackSpeed:4}),/SOURCE_SPRINT_STATE_REQUIRED/);
});
