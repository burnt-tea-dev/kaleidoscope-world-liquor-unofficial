# World Liquor 0.1.148: exact Tavern 0.6.170 pairing

## Known item-duplication risk

Known issue: Treasure Guide's mob bonus can copy unrelated newly dropped items; overlapping death callbacks can multiply bonus drops. This release retains the existing behavior; no fix is included. Reproduced against W148 source in an isolated mocked scheduler, not a native-server reproduction.

已知風險：淘金熱（Treasure Guide）的生物掉落加成仍以死亡位置附近的新物品判定，可能誤複製玩家剛丟出的物品或其他生物的掉落；重疊死亡回呼可能放大額外掉落。本版保留現有行為，未包含此問題的修補。此問題已在目前 W148 原始碼的隔離模擬中重現，尚非原生伺服器實測。

## Exact source and compatibility

This release updates both exact Tavern dependencies from 0.6.169 to 0.6.170, synchronizes World Liquor BP/RP/module/guide versions, and preserves all pack and module UUIDs. Its Tavern source pin is the public reviewed commit `e5f38820a8863886f6183c3075a2f3e5c25bc6c6`. The optional Grilling 2.8.149 source-check peer is pinned to `82a396721103ae3dc7962e6ed57e10837cb5ba6d`.

Compared with W147, the World Liquor runtime difference is limited to its two manifests and the guide payload's top-level release version. All other runtime bytes and all payload content remain unchanged. Publication metadata and source-pin updates preserve the frozen W148 runtime, baseline and release history.

Tavern 0.6.170 normalizes one shaker arithmetic expression for editor compatibility while preserving its reviewed numerical values. That change is not a World Liquor gameplay repair or a claim of complete Java motion parity. Elbow, Treasure, timing, effects, recipes, storage, geometry, UVs, materials, textures and prior functional witnesses are unchanged by this pairing.

Use both World Liquor packs with both Tavern 0.6.170 packs. Bedrock/BDS 1.26.50+ and the declared stable Script API remain required. Grilling is an optional source-check peer, not a new World Liquor runtime dependency; Grilling's own Cookery and Script API requirements still apply when installed together.

## Publication evidence and remaining limitations

The stable publication scope is source/editor, existing strict CI and exact package verification. Strict baseline, exact dependency, source-preservation, deterministic archive and paired guide checks remain mandatory. Existing CI jobs are unchanged. This is not a complete Java-parity claim.

Additional real-client, install/upgrade/restart/rollback, saved-world persistence and long-running soak acceptance have not been established for this exact family and are not gates for this publication. Restored freezer rendering and other client presentation remain unaccepted. Historical release/runtime evidence is preserved without being reassigned to this candidate.

Publication is requested through the existing push-to-main workflow. Merging the reviewed request into main triggers publication, so all required checks and the paired release order must be satisfied before merge. Client, production-ready and live-deployment flags remain false. This release does not authorize or perform a live deployment.
