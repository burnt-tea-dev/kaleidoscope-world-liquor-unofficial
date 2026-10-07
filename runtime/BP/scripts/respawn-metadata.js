// Java stores the player's yaw when setting a bed spawn; Native exposes only
// the point. Persist only an observed bed interaction or an explicit adapter
// declaration. An existing point alone cannot reconstruct historical metadata.
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
  if (!p || !Number.isFinite(yaw) || !['declared', 'observed_bed_interaction'].includes(value.basis)) return undefined;
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

/** Install once. All writes run outside the restricted before-event callback. */
export function installRespawnMetadata(world, system) {
  if (installed.has(world)) return installed.get(world);
  const pending = new Map();
  const before = world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    if (event.cancel || event.isFirstEvent === false) return;
    const capture = captureBedInteraction(event.player, event.block);
    if (!capture) return;
    pending.set(event.player.id, capture);
    system.run(() => {
      if (pending.get(event.player.id) !== capture) return;
      pending.delete(event.player.id);
      try { if (!event.cancel) confirmBedInteraction(event.player, capture); } catch {}
    });
  });
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
  const handle = {before, interval};
  installed.set(world, handle);
  return handle;
}
