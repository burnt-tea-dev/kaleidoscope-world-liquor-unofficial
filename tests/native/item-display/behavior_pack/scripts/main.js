// Diagnostic only. Never import this pack into a family candidate or LIVE world.
import {world, system, ItemStack, EquipmentSlot, EnchantmentTypes} from '@minecraft/server';

const prefix = '[S1_EQUIPMENT_CAPABILITY] ';
const out = (kind, row = {}) => console.log(prefix + JSON.stringify({kind, ...row}));
const pause = ticks => new Promise(resolve => system.runTimeout(resolve, ticks));
const errorData = error => ({name: error?.name ?? 'Error', message: String(error), stack: error?.stack ?? null});
const attempt = (action, fn) => {
  try { return {ok: true, value: fn()}; }
  catch (error) { return {ok: false, action, error: errorData(error)}; }
};
const publicOperation = result => result.ok ? {ok: true} : result;
const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
const same = (a, b) => a.ok && b.ok && JSON.stringify(a.fields) === JSON.stringify(b.fields);
let playerSessions = 0;
// Subscribe before worldLoad. A player who leaves before a snapshot still fails.
world.afterEvents.playerSpawn.subscribe(event => {
  playerSessions++;
  out('player_session', {playerSessions, initialSpawn: event.initialSpawn});
});
const requireNoPlayers = () => requireValue(playerSessions === 0 && world.getAllPlayers().length === 0, 'PLAYER_SESSION_OBSERVED');

function snapshot(item) {
  const fields = {}, errors = [];
  if (!item) return {ok: false, fields: null, errors: [{action: 'snapshot', error: {message: 'ITEM_MISSING'}}]};
  const read = (key, fn) => {
    const result = attempt(key, fn);
    if (result.ok) fields[key] = result.value;
    else errors.push(result);
  };
  read('typeId', () => item.typeId);
  read('amount', () => item.amount);
  read('nameTag', () => item.nameTag ?? null);
  read('lore', () => item.getLore());
  read('canPlaceOn', () => item.getCanPlaceOn().sort());
  read('canDestroy', () => item.getCanDestroy().sort());
  read('components', () => item.getComponents().map(component => component.typeId).sort());
  read('dynamicProperties', () => item.getDynamicPropertyIds().sort().map(id => [id, item.getDynamicProperty(id)]));
  read('durability', () => {
    const component = item.getComponent('minecraft:durability');
    return component ? {damage: component.damage, maxDurability: component.maxDurability} : null;
  });
  read('enchantments', () => {
    const component = item.getComponent('minecraft:enchantable');
    return component ? component.getEnchantments().map(entry => ({id: entry.type.id, level: entry.level})).sort((a, b) => a.id.localeCompare(b.id)) : null;
  });
  return {ok: errors.length === 0, fields, errors};
}

function sentinel(label) {
  const item = new ItemStack('minecraft:iron_sword', 1);
  const setup = [];
  const set = (action, fn) => setup.push(publicOperation(attempt(action, fn)));
  set('set.nameTag', () => { item.nameTag = label; });
  set('set.lore', () => item.setLore(['Native clone sentinel', 'Metadata must survive unchanged']));
  set('set.dynamic.string', () => item.setDynamicProperty('senluo_probe:marker', label));
  set('set.dynamic.number', () => item.setDynamicProperty('senluo_probe:number', 41));
  set('set.dynamic.boolean', () => item.setDynamicProperty('senluo_probe:boolean', true));
  set('set.canPlaceOn', () => item.setCanPlaceOn(['minecraft:dirt']));
  set('set.canDestroy', () => item.setCanDestroy(['minecraft:stone']));
  set('set.durability', () => {
    const component = item.getComponent('minecraft:durability');
    requireValue(component, 'DURABILITY_COMPONENT_MISSING');
    component.damage = 41;
  });
  set('set.enchantment', () => item.getComponent('minecraft:enchantable').addEnchantment({type: EnchantmentTypes.get('unbreaking'), level: 2}));
  const before = snapshot(item);
  return {item, before, setup, ok: setup.every(result => result.ok) && before.ok};
}

async function transfer(label, read, write) {
  const row = {label}, source = sentinel(label);
  row.setup = source.setup;
  row.source = source.before;
  row.status = 'setup_failed';
  if (!source.ok) return row;
  const cloned = attempt('clone', () => source.item.clone());
  row.clone = publicOperation(cloned);
  if (!cloned.ok) return row;
  row.cloned = snapshot(cloned.value);
  row.cloneExact = same(row.source, row.cloned);
  if (!row.cloneExact) { row.status = 'clone_failed'; return row; }
  try {
    const written = attempt('write', () => write(cloned.value));
    row.write = written;
    row.status = 'write_failed';
    if (written.ok) {
      const immediate = attempt('read.immediate', read);
      row.immediate = immediate.ok ? snapshot(immediate.value) : immediate;
      await pause(2);
      const delayed = attempt('read.after_2_ticks', read);
      row.afterTwoTicks = delayed.ok ? snapshot(delayed.value) : delayed;
      row.sourceAfter = snapshot(source.item);
      row.metadataEqual = same(row.source, row.immediate) && same(row.source, row.afterTwoTicks) && same(row.source, row.sourceAfter);
      row.status = written.value === false ? 'write_rejected' : row.metadataEqual ? 'observed_roundtrip' : 'readback_failed';
    }
  } finally {
    row.clear = attempt('clear', () => write(undefined));
    const empty = attempt('read.cleared', read);
    row.emptyAfterClear = empty.ok ? {ok: true, empty: empty.value === undefined} : empty;
    row.cleanupOk = row.clear.ok && row.clear.value !== false && row.emptyAfterClear.ok && row.emptyAfterClear.empty;
    if (!row.cleanupOk) row.status = 'cleanup_failed';
  }
  return row;
}

const variants = [
  {type: 'minecraft:armor_stand', role: 'vanilla_previous_negative_control'},
  {type: 'minecraft:zombie', role: 'vanilla_mob_control'},
  {type: 'minecraft:husk', role: 'vanilla_mob_no_sunlight_control'},
  {type: 'minecraft:piglin', role: 'vanilla_native_equipment_control'},
  {type: 'senluo_probe:equippable', role: 'nonempty_accepted_item_list'},
  {type: 'senluo_probe:equipment', role: 'nonempty_equipment_table'},
  {type: 'senluo_probe:zombie_runtime', role: 'mob_runtime_with_equipment_table'},
  {type: 'senluo_probe:inventory', role: 'private_inventory_metadata_control'},
  {type: 'minecraft:allay', role: 'vanilla_single_slot_inventory_control'},
  {type: 'senluo_probe:allay_runtime', role: 'native_allay_inventory_slot_mapping'},
];

async function run() {
  const rows = [], spawned = [];
  let dimension, areaCreated = false, failure;
  try {
    requireNoPlayers();
    dimension = world.getDimension('overworld');
    dimension.runCommand('tickingarea add 0 64 0 31 64 15 senluo_display_probe true');
    areaCreated = true;
    let loaded = false;
    for (let i = 0; i < 20 && !loaded; i++) {
      await pause(5);
      const result = attempt('load.getBlock', () => dimension.getBlock({x: 8, y: 64, z: 8}));
      loaded = result.ok && !!result.value;
      if (!result.ok) out('load_pending', result);
    }
    requireValue(loaded, 'PROBE_CHUNK_UNAVAILABLE');
    dimension.runCommand('gamerule doMobSpawning false');
    dimension.runCommand('time set midnight');
    dimension.runCommand('fill 1 63 7 22 63 9 minecraft:stone');
    for (const [index, variant] of variants.entries()) {
      requireNoPlayers();
      const row = {...variant, transfers: []};
      const created = attempt('spawn', () => dimension.spawnEntity(variant.type, {x: 1 + index * 2, y: 64, z: 8}));
      row.spawn = publicOperation(created);
      if (!created.ok) { rows.push(row); out('case', row); continue; }
      const entity = created.value;
      spawned.push(entity);
      await pause(2);
      row.components = attempt('getComponents', () => entity.getComponents().map(component => component.typeId).sort());
      row.beforeCommand = attempt('getComponent.equippable.beforeCommand', () => !!entity.getComponent('minecraft:equippable'));
      row.nativeMainhand = attempt('native.replaceitem.mainhand', () => entity.runCommand('replaceitem entity @s slot.weapon.mainhand 0 minecraft:diamond_sword 1 0').successCount);
      row.nativeOffhand = attempt('native.replaceitem.offhand', () => entity.runCommand('replaceitem entity @s slot.weapon.offhand 0 minecraft:totem_of_undying 1 0').successCount);
      await pause(2);
      row.componentsAfterCommand = attempt('getComponents.afterCommand', () => entity.getComponents().map(component => component.typeId).sort());
      const equipment = attempt('getComponent.equippable', () => entity.getComponent('minecraft:equippable'));
      row.equippable = equipment.ok ? {ok: true, available: !!equipment.value} : equipment;
      const inventory = attempt('getComponent.inventory', () => entity.getComponent('minecraft:inventory'));
      row.inventory = inventory.ok ? {ok: true, available: !!inventory.value} : inventory;
      row.jsonEquipment = attempt('getComponent.equipment', () => !!entity.getComponent('minecraft:equipment'));
      if (equipment.ok && equipment.value) {
        for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]) {
          row.transfers.push(await transfer(variant.type + ':' + slot, () => equipment.value.getEquipment(slot), item => equipment.value.setEquipment(slot, item)));
        }
      } else row.equipmentTransfer = 'not_attempted_without_component';
      if (inventory.ok && inventory.value) {
        const container = attempt('inventory.container', () => inventory.value.container);
        row.container = container.ok ? {ok: true, available: !!container.value} : container;
        if (container.ok && container.value) {
          row.inventorySize = attempt('inventory.size', () => container.value.size);
          row.mainhandQueryControl = attempt('native.hasitem.mainhand.control', () => entity.runCommand('testfor @s[hasitem={item=minecraft:diamond_sword,location=slot.weapon.mainhand}]').successCount);
          row.inventoryBefore = Array.from({length: container.value.size}, (_, slot) => ({slot, type: container.value.getItem(slot)?.typeId ?? null}));
          row.inventoryTransfer = await transfer(variant.type + ':inventory0', () => container.value.getItem(0), item => {
            container.value.setItem(0, item);
            if (item) row.mainhandAfterInventoryWrite = attempt('native.hasitem.mainhand.afterInventoryWrite', () => entity.runCommand('testfor @s[hasitem={item=minecraft:iron_sword,location=slot.weapon.mainhand}]').successCount);
          });
          row.mainhandAfterInventoryClear = attempt('native.hasitem.mainhand.afterInventoryClear', () => entity.runCommand('testfor @s[hasitem={item=minecraft:diamond_sword,location=slot.weapon.mainhand}]').successCount);
        }
      }
      row.remove = attempt('entity.remove', () => entity.remove());
      rows.push(row);
      out('case', row);
    }
    requireNoPlayers();
  } catch (error) {
    failure = errorData(error);
    out('failure', failure);
  } finally {
    const cleanup = [];
    for (const entity of spawned) cleanup.push(attempt('final.entity.remove', () => { if (entity.isValid) entity.remove(); }));
    if (areaCreated) cleanup.push(attempt('tickingarea.remove', () => dimension.runCommand('tickingarea remove senluo_display_probe')));
    if (playerSessions > 0 && !failure) {
      failure = {name: 'Error', message: 'PLAYER_SESSION_OBSERVED', playerSessions};
      out('failure', failure);
    }
    out('complete', {caseCount: rows.length, expectedCases: variants.length, players: world.getAllPlayers().length, playerSessions, failure: failure ?? null, cleanup, renderingObserved: false, equipmentSafetyObserved: false, enchantedCloneObserved: false, potionMetadataObserved: false});
  }
}

world.afterEvents.worldLoad.subscribe(() => system.runTimeout(() => { void run(); }, 10));
