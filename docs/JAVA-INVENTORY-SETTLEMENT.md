# Java inventory settlement

## Source candidate: overflow drop motion (2026-11-13)

The shared full-inventory fallback now requests a head-relative drop position and the official directional initial velocity, retaining one-item settlement and freezer rollback. [Source receipts, JVM cases and limits](evidence/inventory-drop-20261113/README.md) distinguish the passing arithmetic/API checks from untested native trajectory, pickup delay and per-pose eye-height mapping. This is not a release or full Player.drop parity.

## W207: full Creative inventory (2026-11-09)

A completed freezer product incorrectly spawned on the ground when a Creative player's inventory had no room. The old source regression explicitly expected this wrong result. The shared `java-player-inventory.js` owner now follows the normal selected-slot, offhand, main-stack and empty-slot insertion order first. If all fail and the current mode is Creative, it returns successful discard of the temporary result, without writing inventory or spawning a ground item. The freezer still decrements its output once. Survival continues to drop one product when full. Creative with room still receives its product; this is not a blanket Creative output suppression.

The same owner serves freezer input extraction and other existing single-item deliveries. Input insertion remains an unconditional debit and does not read the game mode. The `allowDrop: false` caller still has no ground-drop fallback. No ID, UUID, saved-data format, storage owner or dependency is replaced.

## Primary source

The verified official Minecraft **1.21.1** client archive is static inspection input, not a launched game:

- [Official version metadata](https://piston-meta.mojang.com/v1/packages/82ba6501da174a665c1787775f946487422f2432/1.21.1.json).
- [Official client archive](https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar), SHA1 `30c73b1c5da787909b2f73340419fdf13b9def88`, SHA256 `499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99`.
- [Official mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt), SHA1 `2244b6f072256667bcd9a73df124d6c58de77992`, freshly downloaded and verified for this review.

Mappings identify `Inventory.add(int, ItemStack)` as `cmw.c(ILcuq;)Z` (source lines 253–297). Its bytecode offsets 63–87 compare the unchanged remaining count, call `Player.hasInfiniteMaterials`, set the temporary stack count to zero and return true. The damaged-item path at 146–162 has the same Creative result. `Player.addItem` (`cmx.i(Lcuq;)Z`, source line 1934) delegates to `Inventory.add`; `hasInfiniteMaterials` (`cmx.fL()Z`, source line 1477) reads `Abilities.instabuild`. The Bedrock owner represents that reachable Creative-player branch using the current game mode; arbitrary foreign Java ability overrides are not claimed.

The pinned [NeoForge 1.21.1 Inventory patch](https://github.com/neoforged/NeoForge/blob/624c929f49920c250166e2a8df7af87f16d220ef/patches/net/minecraft/world/entity/player/Inventory.java.patch) changes pick selection, inventory ticking and crash-report details, not this successful full-inventory branch.

The [author release index](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/all) was refreshed on 2026-11-09: maintained NeoForge 1.21.1 remains 1.1.12 / CF9217896 and Forge 1.20.1 remains 1.1.13 / CF9217901. The current NeoForge JAR download returned HTTP 403 and was not bypassed. This fix verifies the shared vanilla operation already called by the maintained port; it is not a new full-author-JAR or Forge/26.1 branch audit.

## Validation and limits

Five new counterexamples failed against unchanged main: conditional and unconditional Creative products, their registered component callbacks, and a failing save with no permitted ground side effect. They pass after the shared-owner fix. The six affected suites pass **119/119**, with no failures or skips, including free slots, offhand/main merges, Survival fallback, input/milk/bottle/remainder paths and failure recovery. Independent review verified the official archive/mapping hashes and bytecode and reran the same 119 checks.

The full current source suite also passes **480/480**, including the exact T205/G238 family helper and optional Cookery contracts. `tools/check_release.py` passes the existing guide, resource, dependency and source checks. Initial aggregate attempts lacked the pinned peers at the test tools’ expected paths; supplying the exact source checkouts resolved those setup failures without changing their assertions.

These are source/API-model checks. No Minecraft client, BDS, saved world or LIVE was used. Full native interactions, other mod hooks, arbitrary ability overrides and rendered/audio acceptance remain unverified. Existing native receipts retain their original identities and scope. The new paired BP/RP identity is 0.1.207; exact Tavern 0.6.205 and optional Grilling 2.8.238 source pins are unchanged.
