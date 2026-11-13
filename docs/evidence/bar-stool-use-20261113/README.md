# Bar-stool interaction admission repair

This is a functional source candidate, not a release or native-game acceptance.

## Player-visible defect

All 16 colors incorrectly required a standing player with an empty main hand to sit. The general furniture guard also discarded Adventure interaction after cancelling the event. Current Java accepts ordinary held-item use, Adventure interaction and sneaking with both hands empty.

The shared `furniture.js` owner now uses one stool predicate for both the before-event and custom-component routes. Ordinary non-Spectator use enters seating when `!sneaking || (!mainHand && !offHand)`. A currently occupied stool is left to normal item use; it cannot eject its rider. Deferred mutation rechecks admission and preserves the existing captured-main-hand, block, dimension, state and sneak safeguards. Held items are never debited or rewritten.

The 16 existing guide pages, in English, Simplified Chinese and Traditional Chinese, now describe this behavior. Only their body text changes; IDs, categories, recipes and all other payload data remain identical. The existing guide generator owns the change and regeneration is idempotent.

## Source receipts

- Canonical main: `c5984d46f4df4b120be72f0b7e229922f95509d4`. All seven open PRs (#223, #222, #220, #219, #216, #214, #178) were checked before publication. None owns stool interaction. This candidate does not copy their work. Shared `check_release.py` additions and the separate freezer work in `furniture.js` require ordinary integration review.
- Current [World Liquor NeoForge 1.1.12 / Minecraft 1.21.1](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896), JAR SHA-256 `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`. `ModBlocks` registers every bar-stool color with `ChairBlock`. `ChairBlock.useWithoutItem` seats a player when there is no seat entity and otherwise returns PASS; it has no held-item or Adventure restriction.
- Official Minecraft 1.21.1 client JAR SHA-1 `30c73b1c5da787909b2f73340419fdf13b9def88`, SHA-256 `499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99`. [Mojang mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt) identify the inspected `ServerPlayerGameMode.useItemOn` bytecode. Offsets 34–73 separate Spectator; 74–118 derive secondary-use with either hand occupied; 175–221 dispatch default MAIN_HAND block interaction before item use at 222 onward. `BlockBehaviour.useItemOn` defaults to PASS_TO_DEFAULT_BLOCK_INTERACTION. Thus `useWithoutItem` is not an empty-hand requirement.
- The official [NeoForge game-mode patch](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/patches/net/minecraft/server/level/ServerPlayerGameMode.java.patch) and [default item hooks](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/src/main/java/net/neoforged/neoforge/common/extensions/IItemExtension.java) preserve this ordinary route. Arbitrary third-party `onItemUseFirst` and sneak-bypass overrides are outside this repair.
- Official [Bedrock rideable API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityrideablecomponent?view=minecraft-bedrock-stable) provides `getRiders()` and `addRider(Entity): boolean`. [Creator 1.21 notes](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.21?view=minecraft-bedrock-stable) record their stable 1.11.0 availability, predating the declared 2.12-beta target. The official npm 2.12.0-beta.1.26.60-stable archive was checked too: SHA-256 `ee58c056597bf8891f700f8e79a3fad853645661422c3a2f3e28b5252f6bf72d`. No API/engine bump is needed. Reads remain in the before-event; riding writes retain the existing `system.run` deferral.

## Discriminating validation

The test imports the actual `registerFurniture` and `installFurniture` callbacks through the repository's existing API-double loader. Production source is not rewritten by the test.

- Same focused test on unchanged main: **5 passed / 9 failed**. The four individual source counterexamples fail: Adventure, standing with stick, standing with cobblestone, and sneaking with both hands empty. Some other failing cases depend on these initial admissions; they are not nine distinct repaired defects.
- Candidate: **14/14 pass**, including 3,072 cases: 16 colors × four facings × four modes × two sneak states × three main-hand states × two offhand states. Exactly 1,344 enter seating and 1,728 do not. Hand stacks remain unchanged and the existing four yaw values are preserved.
- Occupied seat, empty persistent-helper reuse, repeated held input, and deferred changes to main hand, offhand, sneak, block or occupancy are covered. The direct component route is checked independently as well.
- Existing wall-record and freezer callbacks plus the new suite: **142/142 pass**.
- Complete `tools/check_release.py` with the clean canonical Tavern pin `d4213d4322e223b2bf8f6b52cec2558af0a5b54f`: **63 blocks, 159 items, 41 recipes, 1,350 paired geometries, zero errors**. The new focused suite is called by this aggregate, which normal package CI already runs. No workflow or budget exception changes.
- Guide rebuild, shared guide projection, JavaScript syntax, Python compilation and `git diff --check` pass. [Exact input hashes](validation-inputs.json), [guide scope](guide-scope.json) and logs are included.

Reproduce from the repository with the canonical Tavern checkout at `../tavern-src`:

```sh
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/bar-stool-use.test.mjs
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/wall-record.test.mjs tests/freezer-callback.test.mjs tests/bar-stool-use.test.mjs
python tools/check_release.py
```

## Deliberate limits and release blocker

- No BDS, real-player/client interaction, saved-world restart, deployment or LIVE operation was performed. API-double admission is not proof that a native player successfully remains mounted. In particular, holding sneak may immediately dismount in-engine.
- No geometry, texture, icon, animation, entity definition, seat height, orientation formula or stored-data schema changes. No new Blockbench review applies to this interaction-only patch; no visual parity claim is added.
- The existing native empty seat is persistent and reusable. Java rejects even a transient empty SitEntity until its cleanup; this established lifecycle difference is retained, not called identical.
- If another rider occupies the seat during deferral, the action safely does not mount or consume an item. The already-cancelled item-use cannot be replayed as native placement, so exact simultaneous-player sequencing is unverified. The existing `addRider(false)` result is not surfaced to the player and this patch does not add forced remount behavior.
- Manifests, versions, dependencies, baseline/history and all guards remain unchanged. `baseline_gate.py check --release` correctly rejects the changed runtime: **runtime changed without a reviewed version/hash update**. Keep this candidate Draft until the normal coordinated paired version/freeze and downstream family checks. No version is guessed or allocated here.
