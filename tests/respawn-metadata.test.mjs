import assert from 'node:assert/strict';
import test from 'node:test';
import * as respawnMetadata from '../runtime/BP/scripts/respawn-metadata.js';
const {captureBedInteraction, confirmBedInteraction, declareRespawnMetadata, getRespawnMetadata, installRespawnMetadata} = respawnMetadata;

function fixture(dimensionId = 'minecraft:overworld') {
  const properties = new Map(), blocks = new Map(), callbacks = [], deferred = [], intervals = [];
  const dimension = {id: dimensionId, getBlock: p => blocks.get(`${p.x},${p.y},${p.z}`)};
  const bed = (x, z, direction = 0, head = false) => {
    const block = {typeId: 'minecraft:bed', location: {x, y: 64, z}, dimension,
      permutation: {getState: name => name === 'direction' ? direction : name === 'head_piece_bit' ? head : undefined}};
    blocks.set(`${x},64,${z}`, block); return block;
  };
  const player = {id: 'p', isSleeping: false, yaw: 27.3, spawn: undefined,
    getRotation() {return {x: 0, y: this.yaw};}, getSpawnPoint() {return this.spawn;},
    getDynamicProperty: key => properties.get(key), setDynamicProperty: (key, value) => value === undefined ? properties.delete(key) : properties.set(key, value)};
  const lifecycle = {playerSpawn: [], playerLeave: []};
  const world = {beforeEvents: {playerInteractWithBlock: {subscribe: f => {callbacks.push(f); return f;}}},
    afterEvents: Object.fromEntries(Object.entries(lifecycle).map(([name, rows]) => [name, {subscribe: f => {rows.push(f); return f;}}])), getAllPlayers: () => [player]};
  const system = {run: f => deferred.push(f), runInterval: f => {intervals.push(f); return intervals.length;}};
  const setSpawn = block => player.spawn = {...block.location, dimension};
  const anchor = (x, z, charges = 2) => {
    const block = {typeId: 'minecraft:respawn_anchor', location: {x, y: 64, z}, dimension, charges,
      permutation: {getState: name => name === 'respawn_anchor_charge' ? block.charges : undefined}};
    blocks.set(`${x},64,${z}`, block); return block;
  };
  return {player, bed, anchor, setSpawn, properties, world, system, callbacks, deferred, intervals, lifecycle};
}

test('before capture yaw survives later rotation and a changed bed spawn', () => {
  const f = fixture(), block = f.bed(2, 3), capture = captureBedInteraction(f.player, block);
  f.player.yaw = -90; f.setSpawn(block);
  assert.equal(confirmBedInteraction(f.player, capture), true);
  assert.deepEqual(getRespawnMetadata(f.player, f.player.spawn), {
    schema: 1, point: {x: 2, y: 64, z: 3, dimensionId: 'minecraft:overworld'}, yaw: Math.fround(27.3), forced: false, basis: 'observed_bed_interaction'});
});
test('a same-point rejected interaction neither invents nor updates yaw', () => {
  const f = fixture(), block = f.bed(2, 3); f.setSpawn(block);
  const capture = captureBedInteraction(f.player, block);
  assert.equal(confirmBedInteraction(f.player, capture), false);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
  assert.equal(declareRespawnMetadata(f.player, {point: {...block.location, dimensionId: 'minecraft:overworld'}, yaw: 90, forced: true}), true);
  assert.equal(confirmBedInteraction(f.player, capture), false);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
});
test('an ambiguous same-point retry invalidates different source facts but retains identical facts or an already-sleeping early return', () => {
  const f = fixture(), block = f.bed(2, 3); f.setSpawn(block);
  const put = (yaw, forced) => declareRespawnMetadata(f.player, {point: {...block.location, dimensionId: 'minecraft:overworld'}, yaw, forced});
  put(90, false); const different = captureBedInteraction(f.player, block);
  assert.equal(confirmBedInteraction(f.player, different), false); assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
  put(f.player.yaw, false); const identical = captureBedInteraction(f.player, block);
  assert.equal(confirmBedInteraction(f.player, identical), false); assert.equal(getRespawnMetadata(f.player, f.player.spawn).yaw, Math.fround(f.player.yaw));
  put(90, true); f.player.isSleeping = true; const sleeping = captureBedInteraction(f.player, block);
  assert.equal(confirmBedInteraction(f.player, sleeping), false); assert.equal(getRespawnMetadata(f.player, f.player.spawn).forced, true);
});
test('a same-point real sleep transition confirms the captured yaw', () => {
  const f = fixture(), block = f.bed(2, 3); f.setSpawn(block);
  const capture = captureBedInteraction(f.player, block); f.player.isSleeping = true;
  assert.equal(confirmBedInteraction(f.player, capture), true);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn).forced, false);
});
test('linked head/foot relation uses actual bed states instead of radius matching', () => {
  const f = fixture(), foot = f.bed(2, 3), head = f.bed(2, 4, 0, true);
  const capture = captureBedInteraction(f.player, foot); f.setSpawn(head);
  assert.equal(confirmBedInteraction(f.player, capture), true);
  const other = f.bed(3, 3, 0, true), next = captureBedInteraction(f.player, foot); f.setSpawn(other);
  assert.equal(confirmBedInteraction(f.player, next), false);
});
test('unavailable/invalid Native metadata, unrelated points and non-beds stay unknown', () => {
  const f = fixture(), block = f.bed(2, 3);
  f.player.getSpawnPoint = () => {throw new Error('unavailable');};
  assert.equal(captureBedInteraction(f.player, block), undefined);
  f.player.getSpawnPoint = () => f.player.spawn;
  f.player.spawn = {x: 2.5, y: 64, z: 3, dimension: block.dimension};
  assert.equal(captureBedInteraction(f.player, block), undefined);
  f.player.spawn = undefined;
  const capture = captureBedInteraction(f.player, block); f.player.spawn = {x: 2, y: 64, z: 3, dimension: {id: 'minecraft:nether'}};
  assert.equal(confirmBedInteraction(f.player, capture), false);
  assert.equal(captureBedInteraction(f.player, {...block, typeId: 'addon:bed'}), undefined);
});
test('declarations validate fields and cannot supply another point', () => {
  const f = fixture(), block = f.bed(2, 3); f.setSpawn(block);
  const valid = {point: {...block.location, dimensionId: 'minecraft:overworld'}, yaw: -12.5, forced: true};
  for (const bad of [{...valid, yaw: NaN}, {...valid, yaw: 1e300}, {...valid, forced: 1}, {...valid, point: {...valid.point, x: 2147483648}}, {...valid, point: {...valid.point, y: -2147483649}}, {...valid, point: {...valid.point, dimensionId: 'overworld'}}]) {
    assert.equal(declareRespawnMetadata(f.player, bad), false);
  }
  assert.equal(declareRespawnMetadata(f.player, valid), true);
  assert.equal(getRespawnMetadata(f.player, {...f.player.spawn, x: 3}), undefined);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn).forced, true);
  f.properties.set('kaleidoscope_world_liquor:respawn_metadata_v1', '{malformed');
  assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
});
test('installer defers writes, respects later cancellation, and installs once', () => {
  const f = fixture(), block = f.bed(2, 3);
  assert.equal(installRespawnMetadata(f.world, f.system), installRespawnMetadata(f.world, f.system));
  assert.equal(f.callbacks.length, 1);
  const event = {player: f.player, block, isFirstEvent: true, cancel: false};
  f.callbacks[0](event); assert.equal(f.properties.size, 0); f.setSpawn(block); event.cancel = true; f.deferred.shift()();
  assert.equal(f.properties.size, 0);
  f.player.spawn = undefined; const next = {...event, cancel: false};
  f.callbacks[0](next); f.setSpawn(block); f.deferred.shift()();
  assert.equal(getRespawnMetadata(f.player, f.player.spawn).yaw, Math.fround(27.3));
});
test('an observed move away invalidates metadata before returning to that point', () => {
  const f = fixture(), block = f.bed(2, 3); f.setSpawn(block);
  declareRespawnMetadata(f.player, {point: {...block.location, dimensionId: 'minecraft:overworld'}, yaw: 45, forced: true});
  installRespawnMetadata(f.world, f.system); f.player.spawn = undefined; f.intervals[0]();
  f.setSpawn(block); assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
});

test('a confirmed changed charged Nether anchor records source zero yaw and nonforced status, surviving a new player handle', () => {
  const f = fixture('minecraft:nether'), block = f.anchor(2, 3);
  f.player.getRotation = () => {throw Error('anchor does not use the player yaw');};
  const capture = respawnMetadata.captureAnchorInteraction(f.player, block);
  f.setSpawn(block);
  assert.equal(respawnMetadata.confirmAnchorInteraction(f.player, capture), true);
  const expected = {schema: 1, point: {x: 2, y: 64, z: 3, dimensionId: 'minecraft:nether'}, yaw: 0, forced: false, basis: 'observed_anchor_interaction'};
  assert.deepEqual(getRespawnMetadata(f.player, f.player.spawn), expected);
  const reconnected = {...f.player};
  assert.deepEqual(getRespawnMetadata(reconnected, reconnected.spawn), expected);
});

test('an unchanged anchor point does not invent metadata or replace declared forced/yaw facts', () => {
  const f = fixture('minecraft:nether'), block = f.anchor(2, 3); f.setSpawn(block);
  const capture = respawnMetadata.captureAnchorInteraction(f.player, block);
  assert.equal(respawnMetadata.confirmAnchorInteraction(f.player, capture), false);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined);
  declareRespawnMetadata(f.player, {point: {...block.location, dimensionId: 'minecraft:nether'}, yaw: 45, forced: true});
  const original = getRespawnMetadata(f.player, f.player.spawn);
  assert.equal(respawnMetadata.confirmAnchorInteraction(f.player, respawnMetadata.captureAnchorInteraction(f.player, block)), false);
  assert.deepEqual(getRespawnMetadata(f.player, f.player.spawn), original);
});

test('charging, wrong dimension, changed block and unrelated point cannot confirm a source anchor set', () => {
  for (const id of ['minecraft:overworld', 'minecraft:the_end', 'addon:dimension']) {
    const f = fixture(id);
    assert.equal(respawnMetadata.captureAnchorInteraction(f.player, f.anchor(2, 3)), undefined);
  }
  for (const charges of [0, -1, 5, 1.5, undefined]) {
    const f = fixture('minecraft:nether'), block = f.anchor(2, 3); block.charges = charges;
    assert.equal(respawnMetadata.captureAnchorInteraction(f.player, block), undefined);
  }
  for (const mutate of [
    (f, block) => {block.charges = 3;},
    (f, block) => {block.typeId = 'minecraft:stone';},
    f => {f.player.spawn.x++;},
    f => {f.player.spawn.dimension = {id: 'minecraft:overworld'};},
    f => {f.player.getSpawnPoint = () => {throw Error('unavailable');};}
  ]) {
    const f = fixture('minecraft:nether'), block = f.anchor(2, 3), capture = respawnMetadata.captureAnchorInteraction(f.player, block);
    f.setSpawn(block); mutate(f, block);
    assert.equal(respawnMetadata.confirmAnchorInteraction(f.player, capture), false);
    assert.equal(f.properties.size, 0);
  }
});

test('a held-use callback can confirm the full anchor after charging, while cancellation still prevents capture', () => {
  const f = fixture('minecraft:nether'), block = f.anchor(2, 3, 3);
  installRespawnMetadata(f.world, f.system);
  const event = {player: f.player, block, isFirstEvent: true, cancel: false};
  f.callbacks[0](event); block.charges = 4; f.deferred.shift()();
  assert.equal(f.properties.size, 0);
  const cancelled = {...event, isFirstEvent: false};
  f.callbacks[0](cancelled); f.setSpawn(block); cancelled.cancel = true; f.deferred.shift()();
  assert.equal(f.properties.size, 0);
  f.player.spawn = undefined;
  f.callbacks[0]({...event, isFirstEvent: false}); f.setSpawn(block); f.deferred.shift()();
  assert.equal(getRespawnMetadata(f.player, f.player.spawn).forced, false);
  assert.equal(getRespawnMetadata(f.player, f.player.spawn).yaw, 0);
});

test('a same-tick anchor repeat retains the first changed-point observation', () => {
  const f = fixture('minecraft:nether'), block = f.anchor(2, 3);
  installRespawnMetadata(f.world, f.system);
  f.callbacks[0]({player: f.player, block, isFirstEvent: true, cancel: false}); f.setSpawn(block);
  f.callbacks[0]({player: f.player, block, isFirstEvent: false, cancel: false});
  while (f.deferred.length) f.deferred.shift()();
  assert.equal(getRespawnMetadata(f.player, f.player.spawn)?.basis, 'observed_anchor_interaction');
});

test('later cancellation or a different target cannot commit the earlier anchor observation', () => {
  for (const change of ['cancel_before', 'cancel_after', 'cancel_first_after', 'other_anchor', 'other_block', 'charge_change']) {
    const f = fixture('minecraft:nether'), block = f.anchor(2, 3);
    installRespawnMetadata(f.world, f.system);
    const first = {player: f.player, block, isFirstEvent: true, cancel: false};
    f.callbacks[0](first); f.setSpawn(block);
    const repeat = {...first, isFirstEvent: false};
    if (change === 'cancel_before') repeat.cancel = true;
    if (change === 'other_anchor') repeat.block = f.anchor(4, 3);
    if (change === 'other_block') repeat.block = {...block, typeId: 'minecraft:stone'};
    if (change === 'charge_change') block.charges++;
    f.callbacks[0](repeat);
    if (change === 'cancel_after') repeat.cancel = true;
    if (change === 'cancel_first_after') first.cancel = true;
    while (f.deferred.length) f.deferred.shift()();
    assert.equal(getRespawnMetadata(f.player, f.player.spawn), undefined, change);
  }
});

test('the existing first bed observation also survives an uncancelled same-bed held callback', () => {
  const f = fixture(), block = f.bed(2, 3);
  installRespawnMetadata(f.world, f.system);
  f.callbacks[0]({player: f.player, block, isFirstEvent: true, cancel: false}); f.setSpawn(block);
  f.callbacks[0]({player: f.player, block, isFirstEvent: false, cancel: false});
  while (f.deferred.length) f.deferred.shift()();
  assert.equal(getRespawnMetadata(f.player, f.player.spawn)?.basis, 'observed_bed_interaction');
});

test('respawn and leave discard an unconfirmed gesture while retaining confirmed point metadata', () => {
  for (const name of ['playerSpawn', 'playerLeave']) {
    const f = fixture('minecraft:nether'), block = f.anchor(2, 3);
    installRespawnMetadata(f.world, f.system);
    assert.equal(f.lifecycle[name].length, 1);
    f.callbacks[0]({player: f.player, block, isFirstEvent: true, cancel: false}); f.setSpawn(block);
    f.lifecycle[name][0]({player: f.player, playerId: f.player.id, initialSpawn: false}); f.deferred.shift()();
    assert.equal(f.properties.size, 0);
    declareRespawnMetadata(f.player, {point: {...block.location, dimensionId: 'minecraft:nether'}, yaw: 45, forced: true});
    const original = getRespawnMetadata(f.player, f.player.spawn);
    f.lifecycle[name][0]({player: f.player, playerId: f.player.id, initialSpawn: false});
    assert.deepEqual(getRespawnMetadata(f.player, f.player.spawn), original);
  }
});
