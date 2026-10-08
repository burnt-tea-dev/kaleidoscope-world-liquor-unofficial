/** Import-stripped effect VM snapshots have no stored frost pages.
 * Supply the real scheduler with that explicit empty-property fixture.
 * Native block/queue acceptance is provided by the independent BDS probe.
 */
import {FrostAgingScheduler,setFrostAgingScheduler} from '../runtime/BP/scripts/frost-aging.js';
export const frostEffectFixture={
 FrostAgingScheduler:class extends FrostAgingScheduler {
  constructor(world){super({getDynamicProperty:()=>undefined,getDynamicPropertyIds:()=>[],...world});}
 },
 setFrostAgingScheduler
};
