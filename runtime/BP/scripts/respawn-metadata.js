// Java stores the player's yaw for a bed and zero yaw for a newly set anchor;
// Native exposes only the point. Persist only a confirmed observed interaction
// or an explicit declaration. An existing point alone is not historical proof.
const KEY = 'kaleidoscope_world_liquor:respawn_metadata_v1';
const installed = new WeakMap();
const horizontal = [[0, 1], [-1, 0], [0, -1], [1, 0]];

function point(value) {
  if (!value || typeof value !== 'object') return undefined;
  const dimensionId = value.dimensionId ?? value.dimension?.id;
  if (typeof dimensionId !== 'string' || !/^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(dimensionId)) return undefined;
  if (value.dimensionId !== undefined && value.dimension?.id !== undefined && value.dimensionId !== value.dimension.id) return undefined;
  const {x, y, z} = value;
  // Vec3i/BlockPos components are Java ints. Its optional packed-long format
  // does not limit every constructor or saved respawn coordinate to 26/12 bits.
  if (![x, y, z].every(value => Number.isInteger(value) && value >= -2147483648 && value <= 2147483647)) return undefined;
  return {x, y, z, dimensionId};
}
function equal(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z && a.dimensionId === b.dimensionId;
}
function nativePoint(player) {
  try {
    const raw = player.getSpawnPoint();
    if (raw === undefined) return {known: true, value: undefined};
    const value = point(raw);
    return value ? {known: true, value} : {known: false};
  }
  catch { return {known: false}; }
}
function record(value) {
  if (!value || value.schema !== 1 || typeof value.forced !== 'boolean' || !Number.isFinite(value.yaw)) return undefined;
  const p = point(value.point), yaw = Math.fround(value.yaw);
  if (!p || !Number.isFinite(yaw) || !['declared', 'observed_bed_interaction', 'observed_anchor_interaction'].includes(value.basis)) return undefined;
  return {schema: 1, point: p, yaw, forced: value.forced, basis: value.basis};
}
function stored(player) {
  try {
    const raw = player.getDynamicProperty(KEY);
    return typeof raw === 'string' ? record(JSON.parse(raw)) : undefined;
  } catch { return undefined; }
}
function write(player, value) {
  try { player.setDynamicProperty(KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}

/** Explicit integration contract; the caller declares source respawn metadata. */
export function declareRespawnMetadata(player, value) {
  const metadata = record({...value, schema: 1, basis: 'declared'});
  return !!metadata && write(player, metadata);
}

/** No yaw/forced fallback: stale, malformed or unmatched data stays unknown. */
export function getRespawnMetadata(player, spawn) {
  const expected = point(spawn), metadata = stored(player);
  return equal(expected, metadata?.point) ? metadata : undefined;
}

function bed(block) {
  try {
    if (block.typeId !== 'minecraft:bed') return undefined;
    const p = point({...block.location, dimensionId: block.dimension.id});
    if (!p) return undefined;
    const direction = block.permutation.getState('direction');
    const head = block.permutation.getState('head_piece_bit');
    return {point: p, direction, head};
  } catch { return undefined; }
}
function sameBed(clicked, current) {
  if (equal(clicked.point, current.point)) return true;
  if (clicked.point.dimensionId !== current.point.dimensionId || clicked.point.y !== current.point.y ||
      !Number.isInteger(clicked.direction) || clicked.direction < 0 || clicked.direction > 3 ||
      clicked.direction !== current.direction || typeof clicked.head !== 'boolean' || typeof current.head !== 'boolean' || clicked.head === current.head) return false;
  const [x, z] = horizontal[clicked.direction], sign = clicked.head ? -1 : 1;
  return current.point.x === clicked.point.x + sign * x && current.point.z === clicked.point.z + sign * z;
}

/** Capture before Native changes sleep/point. This function writes nothing. */
export function captureBedInteraction(player, block) {
  const clicked = bed(block);
  if (!clicked) return undefined;
  try {
    const yaw = Math.fround(player.getRotation().y), previous = nativePoint(player);
    const sleeping = player.isSleeping;
    if (!Number.isFinite(yaw) || typeof sleeping !== 'boolean' || !previous.known) return undefined;
    return {player, clicked, dimension: block.dimension, yaw, previous: previous.value, sleeping};
  } catch { return undefined; }
}

/** Confirm a changed bed point or actual sleep start, never a rejected retry. */
export function confirmBedInteraction(player, capture) {
  if (!capture || capture.player !== player || capture.sleeping !== false) return false;
  try {
    const current = nativePoint(player);
    if (!current.known || !current.value || current.value.dimensionId !== capture.clicked.point.dimensionId) return false;
    const currentBed = bed(capture.dimension.getBlock(current.value));
    if (!currentBed || !sameBed(capture.clicked, currentBed)) return false;
    const changed = !equal(capture.previous, current.value);
    const startedSleeping = capture.sleeping === false && player.isSleeping === true;
    if (!changed && !startedSleeping) {
      // Java sets the bed yaw/forced flag before its daytime/monster checks.
      // Native's unchanged point does not tell us whether that stage ran.
      const previous = stored(player);
      if (equal(previous?.point, current.value) && (previous.yaw !== capture.yaw || previous.forced)) {
        try { player.setDynamicProperty(KEY, undefined); } catch {}
      }
      return false;
    }
    return write(player, {schema: 1, point: current.value, yaw: capture.yaw, forced: false, basis: 'observed_bed_interaction'});
  } catch { return false; }
}

function anchor(block) {
  try {
    // This observation covers the Native Nether. Custom dimension contracts
    // still provide explicit source metadata through the existing declaration.
    if (block.typeId !== 'minecraft:respawn_anchor' || block.dimension.id !== 'minecraft:nether') return undefined;
    const p = point({...block.location, dimensionId: block.dimension.id});
    const charges = block.permutation.getState('respawn_anchor_charge');
    if (!p || !Number.isInteger(charges) || charges < 1 || charges > 4) return undefined;
    return {point: p, charges};
  } catch { return undefined; }
}

/** Source RespawnAnchorBlock.useWithoutItem sets (yaw=0, forced=false) only
 * for a changed point/dimension. It does not copy the player's current yaw.
 */
export function captureAnchorInteraction(player, block) {
  const clicked = anchor(block);
  if (!clicked) return undefined;
  const previous = nativePoint(player);
  if (!previous.known) return undefined;
  try { return {player, clicked, dimension: block.dimension, previous: previous.value}; }
  catch { return undefined; }
}

/** Native must confirm the exact changed point and unchanged positive charge.
 * Fuel charging, same-point use, replacement and unavailable state prove no
 * source metadata. The observer never writes a Native point or anchor charge.
 */
export function confirmAnchorInteraction(player, capture) {
  if (!capture || capture.player !== player) return false;
  try {
    const current = nativePoint(player);
    if (!current.known || !equal(current.value, capture.clicked.point) || equal(current.value, capture.previous)) return false;
    const currentAnchor = anchor(capture.dimension.getBlock(current.value));
    if (!currentAnchor || !equal(currentAnchor.point, capture.clicked.point) || currentAnchor.charges !== capture.clicked.charges) return false;
    return write(player, {schema: 1, point: current.value, yaw: 0, forced: false, basis: 'observed_anchor_interaction'});
  } catch { return false; }
}

/** Install once. All writes run outside the restricted before-event callback. */
export function installRespawnMetadata(world, system) {
  if (installed.has(world)) return installed.get(world);
  const pending = new Map();
  const before = world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const id = event.player.id, previous = pending.get(id);
    if (event.cancel) { pending.delete(id); return; }
    // Preserve the existing first-press bed capture through same-bed held
    // callbacks. Every retained event still participates in cancellation.
    const repeatedBed = previous?.confirm === confirmBedInteraction && event.isFirstEvent === false && previous.capture.player === event.player ? bed(event.block) : undefined;
    if (repeatedBed && sameBed(previous.capture.clicked, repeatedBed)) {
      previous.events.push(event); return;
    }
    let capture = event.isFirstEvent === false ? undefined : captureBedInteraction(event.player, event.block);
    const confirm = capture ? confirmBedInteraction : confirmAnchorInteraction;
    if (!capture) capture = captureAnchorInteraction(event.player, event.block);
    if (!capture) { pending.delete(id); return; }
    // Native can set the point between before callbacks in the same tick.
    // A same-point repeat must not replace the first changed-point witness;
    // a new target/charge instead retires that earlier observation.
    if (previous?.confirm === confirmAnchorInteraction && confirm === confirmAnchorInteraction && previous.capture.player === event.player &&
        equal(previous.capture.clicked.point, capture.clicked.point) && previous.capture.clicked.charges === capture.clicked.charges &&
        !equal(previous.capture.previous, capture.clicked.point) && equal(capture.previous, capture.clicked.point)) {
      previous.events.push(event); return;
    }
    // The event guards live only until this deferred turn, including guards
    // appended by a repeat whose later subscriber may still cancel that event.
    const observation = {capture, confirm, events: [event]};
    pending.set(id, observation);
    system.run(() => {
      if (pending.get(id) !== observation) return;
      pending.delete(id);
      try { if (!observation.events.some(row => row.cancel)) confirm(event.player, capture); } catch {}
    });
  });
  // A queued observation belongs to this player lifecycle. Confirmed metadata
  // remains persistent while its point matches, as Java retains respawn data.
  const spawn = world.afterEvents?.playerSpawn?.subscribe(event => pending.delete(event.player.id));
  const leave = world.afterEvents?.playerLeave?.subscribe(event => pending.delete(event.playerId));
  // Invalidate an observed transition away from an owned point, so coming back
  // later cannot resurrect its yaw. Unobservable same-point external writes
  // require the explicit declaration contract above.
  const interval = system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const metadata = stored(player), current = nativePoint(player);
      if (metadata && current.known && !equal(metadata.point, current.value)) {
        try { player.setDynamicProperty(KEY, undefined); } catch {}
      }
    }
  }, 1);
  const handle = {before, interval, spawn, leave};
  installed.set(world, handle);
  return handle;
}
