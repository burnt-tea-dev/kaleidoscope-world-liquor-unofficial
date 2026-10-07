import assert from 'node:assert/strict';
import test from 'node:test';
import {captureBedInteraction, confirmBedInteraction, declareRespawnMetadata, getRespawnMetadata, installRespawnMetadata} from '../runtime/BP/scripts/respawn-metadata.js';

function fixture() {
  const properties = new Map(), blocks = new Map(), callbacks = [], deferred = [], intervals = [];
  const dimension = {id: 'minecraft:overworld', getBlock: p => blocks.get(`${p.x},${p.y},${p.z}`)};
  const bed = (x, z, direction = 0, head = false) => {
    const block = {typeId: 'minecraft:bed', location: {x, y: 64, z}, dimension,
      permutation: {getState: name => name === 'direction' ? direction : name === 'head_piece_bit' ? head : undefined}};
    blocks.set(`${x},64,${z}`, block); return block;
  };
  const player = {id: 'p', isSleeping: false, yaw: 27.3, spawn: undefined,
    getRotation() {return {x: 0, y: this.yaw};}, getSpawnPoint() {return this.spawn;},
    getDynamicProperty: key => properties.get(key), setDynamicProperty: (key, value) => value === undefined ? properties.delete(key) : properties.set(key, value)};
  const world = {beforeEvents: {playerInteractWithBlock: {subscribe: f => {callbacks.push(f); return f;}}}, getAllPlayers: () => [player]};
  const system = {run: f => deferred.push(f), runInterval: f => {intervals.push(f); return intervals.length;}};
  const setSpawn = block => player.spawn = {...block.location, dimension};
  return {player, bed, setSpawn, properties, world, system, callbacks, deferred, intervals};
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
