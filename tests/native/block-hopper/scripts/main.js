import {world, system, ItemStack, BlockPermutation} from '@minecraft/server';

const PREFIX = 'BLOCK_HOPPER_QA_RESULT ';
const CUSTOM = 'hopper_capability:container';
const wait = ticks => new Promise(resolve => system.runTimeout(resolve, ticks));
let running = false;

function stackView(item) {
  if (!item) return null;
  return {
    typeId: item.typeId, amount: item.amount, maxAmount: item.maxAmount,
    nameTag: item.nameTag ?? null, lore: item.getLore(),
    keepOnDeath: item.keepOnDeath, canDestroy: item.getCanDestroy(),
    canPlaceOn: item.getCanPlaceOn(),
    dynamicProperties: item.getDynamicPropertyIds().map(id => [id, item.getDynamicProperty(id)])
  };
}
function containerAt(dimension, position) {
  return dimension.getBlock(position).getComponent('minecraft:inventory')?.container;
}
function inventoryView(container) {
  return container ? Array.from({length: container.size}, (_, i) => stackView(container.getItem(i))) : null;
}
function snapshot(dimension, row) {
  return {source: inventoryView(containerAt(dimension, row.source)), destination: inventoryView(containerAt(dimension, row.destination))};
}
function bottle() {
  const item = new ItemStack('minecraft:glass_bottle', 3);
  item.nameTag = 'Native hopper named bottle';
  item.setLore(['Capability observation', 'Keep these exact lines']);
  item.keepOnDeath = true;
  item.setCanDestroy(['minecraft:stone']);
  return item;
}
function transferred(row) {
  const final = row.samples.at(-1).inventory;
  if (!final.source || !final.destination) return null;
  const remaining = final.source.filter(Boolean).reduce((sum, item) => sum + item.amount, 0);
  const received = final.destination.filter(Boolean);
  const total = received.reduce((sum, item) => sum + item.amount, 0);
  // Amount can split across slots. Compare the metadata actually supported by this stack.
  const metadata = item => { const {amount, ...rest} = item; return rest; };
  return remaining === 0 && total === row.seed.amount && received.every(item => JSON.stringify(metadata(item)) === JSON.stringify(metadata(row.seed)));
}

async function run() {
  if (running) return;
  running = true;
  const dimension = world.getDimension('overworld');
  const rows = [];
  for (const [name, custom, pull, z, stackable] of [
    ['chest_push', false, false, 6, false], ['custom_push', true, false, 10, false],
    ['chest_pull', false, true, 14, false], ['custom_pull', true, true, 18, false],
    ['chest_stack', false, false, 22, true], ['custom_stack', true, false, 26, true]
  ]) {
    const hopper = {x: 6, y: 81, z}, target = {x: pull ? 6 : 7, y: pull ? 82 : 81, z};
    const power = {x: 5, y: 81, z};
    dimension.getBlock(power).setType('minecraft:redstone_block');
    dimension.getBlock(hopper).setPermutation(BlockPermutation.resolve('minecraft:hopper', {facing_direction: pull ? 0 : 5}));
    dimension.getBlock(target).setType(custom ? CUSTOM : 'minecraft:chest');
    rows.push({name, custom, pull, stackable, hopper, target, power, source: pull ? target : hopper, destination: pull ? hopper : target, samples: []});
  }
  await wait(4);
  const targetBlock = dimension.getBlock(rows.find(row => row.custom).target);
  const capabilities = {typeId: targetBlock.typeId, components: targetBlock.getComponents().map(component => component.typeId)};
  for (const row of rows) {
    const source = containerAt(dimension, row.source), destination = containerAt(dimension, row.destination);
    row.available = !!source && !!destination;
    const item = row.stackable ? new ItemStack('minecraft:cobblestone', 3) : bottle();
    row.seed = stackView(item);
    if (row.available) {
      source.clearAll(); destination.clearAll(); source.setItem(0, item);
    }
    row.samples.push({ticks: 0, inventory: snapshot(dimension, row)});
  }
  // All inventory writes end here. Only the native engine transfers after unlocking.
  for (const row of rows) dimension.getBlock(row.power).setType('minecraft:air');
  let previous = 0;
  for (const ticks of [8, 32, 80, 160]) {
    await wait(ticks - previous); previous = ticks;
    for (const row of rows) row.samples.push({ticks, inventory: snapshot(dimension, row)});
  }
  for (const row of rows) row.transferredWithMetadata = transferred(row);
  const stack = rows.find(row => row.name === 'custom_stack');
  const amounts = stack.samples.at(-1).inventory.destination?.filter(Boolean).map(item => item.amount) ?? [];
  console.warn(PREFIX + JSON.stringify({
    completed: true, players: world.getAllPlayers().length, capabilities,
    controlsPassed: rows.filter(row => !row.custom).every(row => row.transferredWithMetadata === true),
    customPush: rows.find(row => row.name === 'custom_push').transferredWithMetadata,
    customPull: rows.find(row => row.name === 'custom_pull').transferredWithMetadata,
    customStackAmounts: amounts, exceedsOnePerSlot: amounts.some(amount => amount > 1),
    inventoryWrites: 'Initial seed only; no inventory writes after hopper unlock',
    rows
  }));
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'block_hopper_qa:run') return;
  run().catch(error => console.warn(PREFIX + JSON.stringify({completed: false, error: String(error), stack: error.stack, players: world.getAllPlayers().length})));
});
console.warn('BLOCK_HOPPER_QA_READY');
