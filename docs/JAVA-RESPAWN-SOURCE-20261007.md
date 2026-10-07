# Respawn source selection core

Authority: current World Liquor **NeoForge 1.21.1 1.1.11 / CurseForge file
9066406**, `RespawnEffect.performEffect`, and official Mojang Minecraft 1.21.1
`ServerPlayer`, `RespawnPosAngle`, `BedBlock`, `RespawnAnchorBlock`,
`DismountHelper`, `BlockGetter`, `PlayerRespawnLogic` and `DimensionTransition`.
The reviewed local author decompilation is under
`full-java-parity-20261006/neoforge-111`; the official game archive and mappings
are in that evidence directory. Source provenance is already recorded in
`data/java-parity/neoforge-1.1.11/reference.json` and the acquisition metadata.
The Java branch check from 2026-10-07 04:23 UTC still identifies that NeoForge
release as current. Forge 1.20.1 1.1.12 uses a different fallback and must not
be substituted for this branch.

The author effect requires ServerPlayer. It plays the source chorus-fruit sound
at volume/pitch 1, reads source-level keepInventory, obtains the native respawn
transition, teleports and sets its yaw/pitch, clears fallDistance, plays the
destination chorus-fruit sound, then adds Hunger 300 ticks at amplifier 0.
It does not kill the player, restore health, clear inventory or show addon text.

The pure `respawn-source.js` implements source candidate ordering, strict then
non-strict passes, floor-height selection, forced coordinates, look-at yaw,
and default-spawn traversal. Bed and anchor callbacks require actual adapter
facts. `null` means a known rejected destination; unknown adapter results throw
instead of being silently classified as unusable. The core has no substitute
search radius or six-block upward cap.

- Beds examine 12 candidates. Bunk beds first examine surrounding positions at
  the original level, then the lower bed level, then above-bed positions. Every
  strict-danger stage runs before any non-strict stage.
- Anchors examine 25 candidates in source order: N/W/S/E/NW/NE/SW/SE at the
  original level, that sequence below, that sequence above, then directly above.
- Dismount uses collision-shape floor heights and standing player block
  collision, INVALID_SPAWN_INSIDE tags and the full AABB world border. It is
  not a two-air-block / solid-floor check. Non-climbable shape handling,
  dangerous-block classification and arbitrary addon shapes remain adapter work.
- Forced spawn uses `(x + .5, y + .1, z + .5)`, saved yaw and pitch zero if both
  native block predicates permit respawning. It has no additional floor test.
- Default spawn uses the source spawnRadius/world-border rule, injected random
  initial index and the original fixed traversal step. Radius zero normally
  examines one column; distance to the world border at or below one forces
  radius one. Failed columns fall back to the original shared spawn position
  with uncapped source vertical collision adjustment. NeoForge's default
  transition yaw/pitch are zero, unlike the author's Forge fallback.

The adapter still owns synchronous source chunk availability, personal spawn
forced status and saved angle, bed/anchor dimension validity, anchor charge
consumption, native heightmaps and collision shapes, tags, entity collisions,
world border and actual player lifecycle. The stable Bedrock
[Player API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)
exposes only DimensionLocation through getSpawnPoint; it does not expose the
Java forced flag or saved respawn angle. These facts must not be fabricated.

Although the source transition's speed field is ZERO, ServerPlayer's reviewed
changeDimension implementation does not apply that field to server velocity.
Same-dimension teleportTo also preserves server deltaMovement. The original
client absolute-position packet clears velocity components; client/server
phase fidelity needs separate evidence. Do not equate transition speed ZERO
with proof that a Bedrock clearVelocity call exactly reproduces the effect.

`JavaRespawnOracle.java` executes the reviewed numeric expressions independently
in Java, including float trigonometry, atan approximation, integer overflow and
radius-zero/border cases. Its 60 recorded rows and selection regressions test
the pure rules. They do not run a Minecraft player or verify real collision,
drink entry, client visuals/audio, or complete Respawn parity.

This is preparatory source logic under development/respawn, not wired into the production effect. The existing safeRespawn still requires the complete shape/metadata/chunk adapter. Do not describe this foundation or the Crazy fix as a working Respawn repair.
