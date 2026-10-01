# Current Java parity repair — 0.1.41 candidate

Primary comparison target: [World Liquor1.1.9 NeoForge Minecraft1.21.1, file8947041](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/8947041), SHA256 `3c3779945687be248d91ea919b1f72b40a66aeed40249a6049f55b0158b149ae`. Forge1.20.1 version1.1.11 is a separate target, not a higher replacement for this branch.

## This repair

Kita Stuffed Crisp, Liangshan Ice Cone and Pochi Pudding now use the current Java1200-tick freezer duration rather than1800. Ice and magma remain1800. The guide is rebuilt from the same canonical recipe definitions. Saved in-progress batches retain their remaining time; no world progress is reset.

The three exact reference recipe JSONs are preserved under `data/java-parity/neoforge-1.1.9/freezer/`. The original `upstream/source.lock.json` and1.1.8 archive-derived assets remain historical provenance; this small behavior update does not falsely label all assets as reimported1.1.9.

`tests/freezer-state.test.mjs` checks reference durations, actual recipe start, unchanged ice/magma and active saved-batch preservation. Existing wall-record, freezer transaction, multi-jump and cabinet/rendering checks remain required.

This release identity skips the reserved0.1.40 HUD pairing draft and pairs with Tavern0.6.76. The unaccepted HUD candidate is excluded and needs rebase/re-version before future merge.

## Remaining verified differences

- Highball and faithful Creative Flight are absent; stable Bedrock Player API has read-only `isFlying`, not a survival-flight setter. No levitation or game-mode substitution is claimed as parity.
- Cabinet classification does not yet include every Java cocktail/normal/irregular display type.
- Wall-record/custom-jukebox native stack metadata and sturdy-face lifecycle need further work.
- Freezer sided automation/comparator/open-tap filling, arbitrary input visuals and full stack retention are incomplete.
- Elbow Strike knockback, per-viewer Hostile Detection/Treasure Sense and Luck differ or are missing.
- Entity-capable custom projectile effects are still player-restricted in the host.
- Custom drink audio is shipped but not bound to Java's during-use pulse lifecycle.
- Custom-disc lease expiration/native jukebox signaling and Brew Accelerator workflow require implementation.
- Collision, simultaneous loot duplication, respawn safety and exact water-walking/frost behavior need dedicated native acceptance.

The current JAR's art-license metadata differs from the existing lock/project-page wording. No new art/model/audio imports are made by this batch; clarify permission before adapting newly acquired assets.

A clean static test or BDS startup does not close these gaps or certify client visuals/live migration. No complete-parity percentage is asserted.
