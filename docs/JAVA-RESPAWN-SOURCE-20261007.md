# Respawn source selection core

Authority reviewed 2026-11-06: maintained World Liquor **NeoForge 1.21.1
1.1.12 / CurseForge file 9217896** and **Forge 1.20.1 1.1.13 / file 9217901**,
each archive's `RespawnEffect.performEffect`, and the corresponding official
Mojang game bytecode and mappings. The selected resolver follows 1.21.1;
the Forge default-spawn fallback remains a separate source branch. Historical
1.1.11 numeric fixtures retain their original provenance and scope.

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

## Actual transport and client motion

Both maintained author branches use `ServerPlayer.teleportTo(x,y,z)` in the
same dimension, then set server yaw/pitch. Minecraft 1.20.1 and 1.21.1 forward
that call to the connection with `RelativeMovement.ROTATION`; X/Y/Z are absent.
Forge's cross-dimension `teleportTo(ServerLevel,...)` and NeoForge's
`changeDimension(DimensionTransition)` send an absolute-position packet without
relative X/Y/Z flags. Both clients' `ClientPacketListener.handleMovePlayer`
set each missing-axis velocity to zero before `setDeltaMovement`.

The reviewed server methods do retain their temporary deltaMovement, and the
1.21.1 transition speed field is ZERO without being applied by this server
method. That is not a requirement to keep the player's old client velocity.
The packet's verified client behavior is to clear XYZ motion. Exact network
arrival, server/client tick phases and camera feedback remain separate from
this bytecode fact; no real client run is claimed.

W198 therefore uses normal native Player teleport options, without the
unsupported `keepVelocity` field and without synthetic impulses. The native
Player motion/fall-reset probe supplies the selected-engine evidence. Both
author branches explicitly clear fallDistance after transport, play the
destination chorus-fruit sound and apply Hunger 300 ticks at amplifier zero.
On a native transport exception, the adapter restores a just-consumed anchor
permutation and rethrows; destination sound/Hunger are only after success.

Official artifacts used for this review: [Minecraft 1.21.1 client](https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar)
and [mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt).
[Minecraft 1.20.1 client](https://piston-data.mojang.com/v1/objects/0c3ec587af28e5a785c0b4a7b8a30f9a8f78f838/client.jar)
and [mappings](https://piston-data.mojang.com/v1/objects/6c48521eed01fe2e8ecdadbd5ae348415f3c47da/client.txt)
were selected by Mojang's fixed-version metadata; both versions' downloads
were verified against its published SHA-1. No third-party JAR,
full class body or private world is included in this repository.

`JavaRespawnOracle.java` executes the reviewed numeric expressions independently
in Java, including float trigonometry, atan approximation, integer overflow and
radius-zero/border cases. Its 60 recorded rows and selection regressions test
the pure rules. They do not run a Minecraft player or verify real collision,
drink entry, client visuals/audio, or complete Respawn parity.

The production `effects.js` Player-only Respawn branch calls
`respawn-adapter.js.applyJavaRespawn`; the numeric foundation is no longer an
unwired development-only route. Unknown shape/metadata/chunk facts still stop
resolution. Actual transport validation and remaining scope belong to
[the runtime adapter](RESPAWN-RUNTIME-SOURCE-ADAPTER.md).
