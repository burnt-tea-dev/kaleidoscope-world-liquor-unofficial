/** Import-stripped effect VM snapshots have no stored frost pages.
 * Supply the real scheduler with that explicit empty-property fixture.
 * Native block/queue acceptance is provided by the independent BDS probe.
 */
import {FrostAgingScheduler,setFrostAgingScheduler} from '../runtime/BP/scripts/frost-aging.js';
import {installLuckLoot} from '../runtime/BP/scripts/luck-loot.js';
export const frostEffectFixture={
 installLuckLoot(world,...args){
  // Older effect fixtures exercise other signals; provide this native event too.
  return installLuckLoot({...world,afterEvents:{entityItemDrop:{subscribe(){}},...world.afterEvents}},...args);
 },
 FrostAgingScheduler:class extends FrostAgingScheduler {
  constructor(world){super({getDynamicProperty:()=>undefined,getDynamicPropertyIds:()=>[],...world});}
 },
 setFrostAgingScheduler
};
