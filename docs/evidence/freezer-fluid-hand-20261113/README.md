# Freezer single-container hand repair

Source candidate based on canonical main `c5984d46f4df4b120be72f0b7e229922f95509d4`, checked 2026-11-13. Not a release or native-engine acceptance report.

## Defect and source

With one container in selected slot 4, the old transaction first merges its converted result into any compatible stack, then searches empty slots from slot 0. Filling or draining a freezer can clear the used hand and stow the result elsewhere. Previous callback tests used slot 0 and missed this reachable case.

Current author World Liquor NeoForge 1.1.12 / Minecraft 1.21.1, [official file 9217896](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896), SHA256 `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`, calls `FluidUtil.interactWithFluidHandler` in `FreezerBlock.useItemOn` before ordinary input storage. Milk filling is a separate branch and already replaces an exhausted hand.

Official [NeoForge 1.21.1 FluidUtil](https://github.com/neoforged/NeoForge/blob/1.21.1/src/main/java/net/neoforged/neoforge/fluids/FluidUtil.java):
- `tryFillContainerAndStow` / `tryEmptyContainerAndStow` directly return the converted result for count one.
- `interactWithFluidHandler` writes that successful result to the original interaction hand.
- Creative transfers fluid but returns the original container; remaining stacks use the stowing path.

These are source/bytecode conclusions, not Java game execution. The author JAR is hashed; the framework link is the maintained branch inspected, not an immutable commit pin. A later public commit-metadata lookup returned HTTP 403; it was not retried through an alternate route.

## Repair and checks

The existing transaction's optional `containerResult` puts the converted result into its exhausted used slot. Remaining stacks retain the old stowing path. Creative skips debit/result creation. Only two fluid-transfer callers enable it. Snapshots, storage format, inventory commit and rollback remain unchanged.

- [Before](fluid-hand-before.log): 87 new tests against main's runtime, **51 passed / 36 failed**. Failures expose the result leaving the selected slot in Survival/Adventure with an earlier empty slot or pre-existing result.
- [After](fluid-hand-after.log): **234/234 passed**, no skips, across freezer callbacks, wall-record callbacks, freezer storage and record storage. The 87 new cases cover 9 supported routes × 3 modes × 3 inventory layouts, 4 save/inventory failures and 2 changed-hand rejections. Milk draining remains supported; milk filling is not added to this path.
- [Full source check](check-release.log), against clean canonical Tavern `d4213d4322e223b2bf8f6b52cec2558af0a5b54f`: **63 blocks, 159 items, 41 recipes, 1,350 models, zero errors**.
- Node syntax and diff checks passed. Existing canonical CI already runs the extended callback file; no new lane/verifier.
- Independent review found no blocker. Supplemental old/new transaction execution over 324 stacked-container combinations matched. No per-case output or execution-time source hash was retained for that supplemental run; formal callback logs are the primary reproducible evidence.
- [Baseline](baseline-check.log) correctly rejects changed runtime without a reviewed version/hash update. No guessed version or weakened guard.

```
node --experimental-loader ./tests/wall-record-loader.mjs --test --test-name-pattern 'single fluid container' tests/freezer-callback.test.mjs
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/freezer-callback.test.mjs tests/wall-record.test.mjs tests/freezer-storage.test.mjs tests/record-storage.test.mjs
python tools/check_release.py
python tools/baseline_gate.py check --release
```

The first command's failing log uses the new tests with main's runtime. Other logs use the repair. Absolute checkout paths and trailing whitespace are normalized; otherwise output is retained. [inputs.json](inputs.json) records exact final source/test and log hashes.

## Coordination and limits

All nine other open PRs were checked: #225, #224, #223, #222, #220, #219, #216, #214, #178. None owns this defect. Shared furniture/callback files need ordinary integration review with stool and separate freezer candidates; no candidate is copied or overwritten.

No storage schema, IDs, recipes, metadata carrier, models, textures, icons, animation, guide data, manifest, version, dependency, workflow, budget or historical lock changes. No new Blockbench preview applies.

No BDS, native click, real player/client, offhand handling, native capacity/metadata acceptance, saved-world restart, merge, deployment or LIVE validation. Historical BDS evidence does not validate this changed code.

Stacked containers with full inventory remain an independent gap: native rejects, while Java can fall back through `ItemHandlerHelper.giveItemToPlayer`. That helper is not equivalent to the separate `Player.drop` path; this repair does not substitute it or claim complete FluidUtil parity. Arbitrary addon capabilities/containers remain outside scope.

Keep Draft pending coordinated paired release identity/freeze and normal family checks. Exact-head canonical CI is reported separately in the PR.
