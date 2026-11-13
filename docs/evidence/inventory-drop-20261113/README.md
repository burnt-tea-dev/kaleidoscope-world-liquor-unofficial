# Full-inventory result drop: position and initial motion

This source candidate addresses the shared fallback used when a completed Cola/tonic drink cannot insert its empty bottle, or a freezer cannot insert its product. Before the repair it spawned the item at player feet and never requested the Java initial velocity. The existing quantity/inventory handling was preserved; this is not a claim that it previously lost the item or that native default motion was measured.

## Repair and safety

`java-player-inventory.js` retains selected-stack, offhand, main-stack, free-slot, full-Creative discard and no-drop behavior unchanged. Only the final actual-drop branch changes:

1. Use player X/Z and reported head Y minus Java's float 0.3, rather than feet Y.
2. Spawn exactly one ordinary native item, preserving the original stack.
3. Record it immediately in the existing freezer transaction journal.
4. Clear native spawn velocity, then request the original directional velocity using current yaw/pitch and four quantized nextFloat-style draws.

The existing motion owner supplies the arithmetic and reuses its lazy Java sine lookup; no duplicate eager table or replacement physics loop is added. If a native motion write fails after spawn, log the failure and retain the one physical result. Do not erase it or retry delivery. A later freezer save failure still removes that recorded item and rolls back owned inventory writes. Spawn rejection keeps the original error behavior.

## Primary source receipts

- Main `c5984d46f4df4b120be72f0b7e229922f95509d4`. All eight open PRs (#224, #223, #222, #220, #219, #216, #214, #178) were reviewed; none owns this drop defect. Shared checker additions and the mock used by furniture tests require ordinary integration, not overwriting concurrent changes.
- Current [World Liquor NeoForge 1.1.12](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896), JAR SHA-256 `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`: `BottledDrinkItem.finishUsingItem` and `FreezerBlockEntity.extractOutput` call `player.drop(stack, false)` when insertion fails. This does not change the pudding remainder's different ItemEntity path.
- Official [Minecraft 1.21.1 archive](https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar), SHA-256 `499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99`, and [Mojang mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt). Mapped `Player.drop(ItemStack, boolean)` delegates to the non-random-toss three-argument branch. It constructs the item at player X/Z and eye Y minus 0.3f, sets pickup delay 40, then computes directional velocity from pitch/yaw, Mth float lookups and four nextFloat draws. The position/velocity expressions were independently run in the included standalone JVM oracle.
- NeoForge's [Player patch](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/patches/net/minecraft/world/entity/player/Player.java.patch) routes the two-argument call through [CommonHooks.onPlayerTossEvent](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/src/main/java/net/neoforged/neoforge/common/CommonHooks.java). Its default path calls the same non-random three-argument drop, then publishes an ItemTossEvent. Arbitrary external changes/cancellations at that hook are not reproduced.
- Official [Bedrock Entity API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable) documents getHeadLocation, clearVelocity and applyImpulse; [Dimension](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable) documents native item spawning. Current official `@minecraft/server` 2.12.0-beta.1.26.60-stable declarations were checked; archive SHA-256 `ee58c056597bf8891f700f8e79a3fad853645661422c3a2f3e28b5252f6bf72d`. Mutation remains in the existing completed/deferred callbacks, not restricted before-events.

## Executed validation

- Three exact new location regressions run against unchanged main all fail: the old Y remains player feet for the three supplied head heights.
- New focused suite: **10/10 pass**. It includes **280 independently executed JVM cases** (eight yaw × seven pitch × five float-draw inputs), negative/wrapped yaw, near-vertical pitch, zero/maximum 24-bit float draws, original metadata/counts, no-drop branch side effects, native motion failures, spawn rejection, real bottled-completion routing and freezer save rollback.
- Six affected suites: **165/165 pass**, including existing freezer/wall-record callbacks and existing boat/jump numeric checks. Existing tests only gain native-method doubles; their previous assertions are preserved.
- Complete `check_release.py` with the clean canonical Tavern pin `d4213d4322e223b2bf8f6b52cec2558af0a5b54f` passes: **63 blocks, 159 items, 41 recipes, 1,350 paired geometries, zero errors**. The new suite is wired into the existing aggregate used by package CI.
- JavaScript syntax, Python compilation, diff checks and independent review pass. [Input hashes](validation-inputs.json) and logs accompany the source.

Reproduce with the pinned Tavern checkout at `../tavern-src`:

```sh
java tests/fixtures/JavaPlayerDropOracle.java > /tmp/java-player-drop.jsonl
cmp /tmp/java-player-drop.jsonl tests/fixtures/java-player-drop.jsonl
node --test tests/player-drop.test.mjs
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/freezer-callback.test.mjs tests/wall-record.test.mjs tests/player-drop.test.mjs tests/bottled-drink.test.mjs tests/freezer-output.test.mjs tests/motion-source.test.mjs
python tools/check_release.py
```

## Not established

These are source arithmetic and API-double call/conservation checks. No native item velocity readback, BDS, real player/client, saved-world, deployment or LIVE test occurred. Bedrock's reported head position is the available adapter; exact Java eye height for every native pose has not been established. Native tick order, drag, gravity, collision, pickup delay, thrower/tracing, packets, seeded player RNG identity/state and third-party toss hooks remain outside this patch. The 280 JVM samples establish the requested numeric vector, not the resulting native trajectory.

No model, texture, icon, animation, entity definition, inventory/storage schema, recipe, guide, manifest, version, dependency, baseline/history or geometry limit changes. No new Blockbench review applies to this arithmetic/interaction-only change, and no visual acceptance is claimed.

The unchanged baseline gate rejects the changed runtime with **runtime changed without a reviewed version/hash update**. Keep Draft pending normal paired release coordination/freeze and downstream family checks. No version was guessed or allocated and no guard was weakened.
