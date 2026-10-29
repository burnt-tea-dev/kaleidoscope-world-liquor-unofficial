/** Import-stripped effect VM snapshots have no stored frost pages.
 * Supply the real scheduler with that explicit empty-property fixture.
 * Native block/queue acceptance is provided by the independent BDS probe.
 */
import {FrostAgingScheduler,setFrostAgingScheduler} from '../runtime/BP/scripts/frost-aging.js';
import {installLuckLoot} from '../runtime/BP/scripts/luck-loot.js';
import {installBeheading} from '../runtime/BP/scripts/beheading.js';
const withDropSignal=world=>({...world,afterEvents:{entityItemDrop:{subscribe(){}},...world.afterEvents}});
export const frostEffectFixture={
 installLuckLoot(world,...args){
  // Older effect fixtures exercise other signals; provide this native event too.
  return installLuckLoot(withDropSignal(world),...args);
 },
 installBeheading(world,...args){return installBeheading(withDropSignal(world),...args);},
 FrostAgingScheduler:class extends FrostAgingScheduler {
  constructor(world){super({getDynamicProperty:()=>undefined,getDynamicPropertyIds:()=>[],...world});}
 },
 setFrostAgingScheduler
};
