import {world, system, GameMode, ScriptEventSource} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';

const PREFIX = 'OWNER_MAYFLY_QA_RESULT ';
const wait = ticks => new Promise(resolve => system.runTimeout(resolve, ticks));
let running = false;

function helperView(helper) {
  const tameable = helper.getComponent('minecraft:tameable');
  return {id: helper.id, location: helper.location, isTamed: tameable.isTamed,
    ownerId: tameable.tamedToPlayerId, resolvedOwnerId: tameable.tamedToPlayer?.id,
    ownerSeen: helper.getProperty('ability_reader:owner_seen'), mayfly: helper.getProperty('ability_reader:mayfly')};
}
const playerView = player => ({id: player.id, name: player.name, location: player.location, gameMode: player.getGameMode()});
const inRange = (player, helper) => Math.hypot(player.location.x - helper.location.x, player.location.z - helper.location.z) < 4 && Math.abs(player.location.y - helper.location.y) < 4;

async function observe() {
  const players = [], helpers = [], bindings = [], commands = [], phases = [];
  let completed = false, error;
  const dimension = world.getDimension('overworld');
  function setMayfly(player, value, label) {
    const text = `ability "${player.name}" mayfly ${value}`;
    try {
      const result = dimension.runCommand(text);
      commands.push({label, command: text, successCount: result.successCount});
      if (result.successCount !== 1) throw Error('Setter did not target exactly one QA Player');
    } catch (failure) { commands.push({label, command: text, error: String(failure)}); throw failure; }
  }
  async function samplePhase(name, expected) {
    const samples = []; let elapsed = 0;
    for (const ticks of [5, 10, 20, 30]) {
      await wait(ticks - elapsed); elapsed = ticks;
      samples.push({ticks, players: players.map(playerView), helpers: helpers.map(helperView),
        allPlayersInsideBothSensors: players.every(player => helpers.every(helper => inRange(player, helper)))});
    }
    phases.push({name, expected, samples,
      ownerBindingsRetained: samples.every(sample => sample.helpers.every((helper, i) => helper.ownerId === players[i].id && helper.resolvedOwnerId === players[i].id)),
      ownerEventsSeen: samples.slice(-2).every(sample => sample.helpers.every(helper => helper.ownerSeen === true)),
      matched: samples.slice(-2).every(sample => sample.helpers.every((helper, i) => helper.mayfly === Number(expected[i])))});
  }
  try {
    if (world.getAllPlayers().length !== 0) throw Error('Expected an empty isolated QA world');
    for (const [name, x] of [['AbilityOwnerA', 6], ['AbilityOwnerB', 6.5]]) players.push(gt.spawnSimulatedPlayer({dimension, x, y: 81, z: 8}, name, GameMode.Survival));
    await wait(2);
    if (players.some(player => player.getGameMode() !== GameMode.Survival)) throw Error('Both QA Players must be Survival');
    setMayfly(players[0], false, 'phase_1_A_false'); setMayfly(players[1], true, 'phase_1_B_true');
    for (const owner of players) {
      const helper = dimension.spawnEntity('ability_reader:probe', {x: 6.25, y: 81, z: 8.25}); helpers.push(helper);
      const tameable = helper.getComponent('minecraft:tameable');
      const tamed = tameable.tame(owner); bindings.push({helperId: helper.id, expectedOwnerId: owner.id, tameReturned: tamed});
      if (!tamed) throw Error('Native tame(owner) did not succeed');
    }
    await wait(2);
    bindings.forEach((binding, i) => Object.assign(binding, helperView(helpers[i])));
    if (bindings.some(binding => !binding.isTamed || binding.ownerId !== binding.expectedOwnerId || binding.resolvedOwnerId !== binding.expectedOwnerId)) throw Error('Native ownership binding did not resolve to its exact Player');
    await samplePhase('A_false_B_true', [false, true]);
    // Reuse the same helpers and owners. Opposite expected values require fresh native events.
    setMayfly(players[0], true, 'phase_2_A_true'); setMayfly(players[1], false, 'phase_2_B_false');
    await samplePhase('A_true_B_false', [true, false]);
    completed = true;
  } catch (failure) { error = {message: String(failure), stack: failure.stack}; }
  finally {
    for (const player of players) try { setMayfly(player, false, 'cleanup_false'); } catch {}
    for (const helper of helpers) try { helper.remove(); } catch {}
    for (const player of players) try { player.disconnect(); } catch {}
    for (let tick = 0; tick < 10 && world.getAllPlayers().length; tick++) await wait(1);
  }
  const controlsPassed = completed && phases.every(phase => phase.ownerBindingsRetained && phase.ownerEventsSeen && phase.samples.every(sample => sample.allPlayersInsideBothSensors && sample.players.every(player => player.gameMode === GameMode.Survival)));
  console.warn(PREFIX + JSON.stringify({completed, controlsPassed, getterProven: controlsPassed && phases.every(phase => phase.matched),
    error, bindings, commands, phases, playersAfter: world.getAllPlayers().length,
    helpersAfter: dimension.getEntities({type: 'ability_reader:probe'}).length,
    outputWrites: 'Native entity events only; Script never writes or triggers the mayfly output property',
    scope: 'Two owner-bound readers and two nearby Survival Players; native mayfly predicate only, no flight input or production adapter'}));
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'owner_mayfly_qa:run' || event.sourceType !== ScriptEventSource.Server || running) return;
  running = true;
  observe().catch(error => console.warn(PREFIX + JSON.stringify({completed: false, error: String(error), playersAfter: world.getAllPlayers().length})));
});
console.warn('OWNER_MAYFLY_QA_READY');
