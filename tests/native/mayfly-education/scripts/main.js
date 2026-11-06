import {world, system, GameMode, ScriptEventSource} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';

const PREFIX = 'MAYFLY_EDUCATION_QA_RESULT ';
const NAME = 'MayflyCapabilityQA';
const wait = ticks => new Promise(resolve => system.runTimeout(resolve, ticks));
let running = false;

function resultView(result) {
  const ownKeys = Object.getOwnPropertyNames(result);
  const prototypeKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(result) ?? {});
  const fields = {};
  for (const key of new Set([...ownKeys, ...prototypeKeys, 'successCount'])) {
    if (key === 'constructor') continue;
    try {
      const value = result[key];
      if (value !== undefined && typeof value !== 'function') fields[key] = value;
    } catch (error) { fields[key] = {readError: String(error)}; }
  }
  return {ownKeys, prototypeKeys, fields};
}
function command(rows, context, source, label, text) {
  let row;
  try { row = {label, source, command: text, ok: true, result: resultView(context.runCommand(text))}; }
  catch (error) { row = {label, source, command: text, ok: false, error: {name: error.name, message: error.message, code: error.code, text: String(error)}}; }
  rows.push(row);
  console.warn('MAYFLY_EDUCATION_QA_COMMAND ' + JSON.stringify(row));
  return row;
}
const playerView = player => ({gameMode: player.getGameMode(), isFlying: player.isFlying, location: player.location});

async function observe() {
  const commands = [], input = [], observations = [];
  let player, completed = false, controlsPassed = false, playerControlsPassed = null;
  let abilityApiCandidate = false, skippedReason, error, cleanupRevokeNeeded = false;
  try {
    if (world.getAllPlayers().length !== 0) throw Error('Expected an empty isolated QA world');
    const dimension = world.getDimension('overworld');
    const control = command(commands, dimension, 'dimension', 'cheat_context_control', 'time add 1');
    controlsPassed = control.ok && control.result.fields.successCount > 0;
    if (!controlsPassed) throw Error('Legal cheat command failed; no ability capability conclusion');
    const help = command(commands, dimension, 'dimension', 'help_ability', 'help ability');
    const empty = command(commands, dimension, 'dimension', 'ability_no_player_query', 'ability @a mayfly');
    // A known command with an empty selector can throw without being unavailable.
    abilityApiCandidate = help.ok || empty.ok || /no targets|no player/i.test(empty.error?.message ?? '');
    if (!abilityApiCandidate) {
      skippedReason = 'No accessible ability API candidate in this command context; no player or fly helper created';
    } else {
      player = gt.spawnSimulatedPlayer({dimension, x: 6, y: 81, z: 8}, NAME, GameMode.Survival);
      await wait(2);
      const self = command(commands, player, 'player', 'player_self_control', 'testfor @s');
      playerControlsPassed = self.ok && self.result.fields.successCount === 1 && player.getGameMode() === GameMode.Survival;
      if (!playerControlsPassed) throw Error('Native Survival Player context control failed');
      const target = `ability "${NAME}" mayfly`;
      const run = (label, suffix = '') => command(commands, dimension, 'dimension', label, target + suffix);
      observations.push({phase: 'initial', ...playerView(player)});
      command(commands, player, 'player', 'initial_player_context_query', 'ability @s mayfly');
      run('initial_query');
      const baseline = run('set_false', ' false');
      run('repeat_false', ' false');
      run('query_false');
      if (!baseline.ok) {
        skippedReason = 'Cannot establish mayfly=false baseline; fly helper not used';
      } else {
        let falseInput;
        try { player.fly(); falseInput = {phase: 'mayfly_false', called: true}; }
        catch (failure) { falseInput = {phase: 'mayfly_false', called: false, error: String(failure)}; }
        await wait(3);
        Object.assign(falseInput, playerView(player)); input.push(falseInput);
        // Reset only the diagnostic input, before granting permission. This is not revocation evidence.
        player.stopFlying(); await wait(1);
        if (player.getGameMode() !== GameMode.Survival) throw Error('fly helper changed game mode; stop the capability scene');
        const grant = run('set_true', ' true'); cleanupRevokeNeeded = grant.ok;
        run('query_true'); run('repeat_true', ' true');
        observations.push({phase: 'after_true_commands', ...playerView(player)});
        if (grant.ok && !falseInput.isFlying) {
          let trueInput;
          try { player.fly(); trueInput = {phase: 'mayfly_true', called: true}; }
          catch (failure) { trueInput = {phase: 'mayfly_true', called: false, error: String(failure)}; }
          await wait(3); Object.assign(trueInput, playerView(player)); input.push(trueInput);
        } else if (falseInput.isFlying) {
          input.push({phase: 'mayfly_true', skipped: 'fly helper already flew in mayfly=false control; cannot prove permission'});
        }
        const revoke = run('set_false_after_true', ' false'); if (revoke.ok) cleanupRevokeNeeded = false;
        run('query_false_after_true');
        await wait(1); observations.push({phase: 'after_revoke_tick_1_before_cleanup', ...playerView(player)});
        await wait(3); observations.push({phase: 'after_revoke_tick_4_before_cleanup', ...playerView(player)});
      }
    }
    completed = true;
  } catch (failure) { error = {message: String(failure), stack: failure.stack}; }
  finally {
    if (player) {
      if (cleanupRevokeNeeded) command(commands, world.getDimension('overworld'), 'dimension', 'cleanup_revoke', `ability "${NAME}" mayfly false`);
      try { player.stopFlying(); } catch {}
      player.disconnect();
      for (let tick = 0; tick < 10 && world.getAllPlayers().length; tick++) await wait(1);
    }
  }
  console.warn(PREFIX + JSON.stringify({completed, controlsPassed, playerControlsPassed, abilityApiCandidate, skippedReason,
    error, commands, input, observations, playersAfter: world.getAllPlayers().length,
    originalPermissionReadbackEstablished: false,
    commandCountIsPermissionBoolean: false,
    scope: 'One retail BDS educationFeaturesEnabled=1/eduOffer=0 profile; no production adapter or saved-world restart'}));
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== 'mayfly_education_qa:run' || event.sourceType !== ScriptEventSource.Server || running) return;
  running = true;
  observe().catch(error => console.warn(PREFIX + JSON.stringify({completed: false, error: String(error), playersAfter: world.getAllPlayers().length})));
});
console.warn('MAYFLY_EDUCATION_QA_READY');
