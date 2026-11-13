# Preserve wall-mounted record metadata

Functional source candidate, not a release. Base: canonical main `c5984d46f4df4b120be72f0b7e229922f95509d4`, checked 2026-11-13. Ten other open PRs (#226, #225, #224, #223, #222, #220, #219, #216, #214, #178) do not own this defect. Shared furniture code requires ordinary integration review; no other candidate is included.

## Reachable player loss and source contract

Rename a vanilla music disc in an anvil, mount it on a wall, then retrieve or break it. The old runtime reconstructed an item from the model's ID, losing its name and all other metadata. The same applies to custom records. Correct ID/count alone did not prove preservation.

Current author [World Liquor NeoForge 1.1.12 for Minecraft 1.21.1](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896), JAR SHA256 `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`:
- `MusicDiscEvents.onRightClickPlaceRecord` supplies the accepted stack to the wall block entity.
- `WallRecordBlockEntity.setRecord` preserves a count-one copy; save/load uses the complete ItemStack.
- `WallRecordBlock.getDrops` returns a count-one copy of the stored stack. Empty-hand retrieval uses those drops. Java clone/pick also copies it, but native pick-block metadata is **not** repaired here.

The existing adapter can preserve the native item using documented [ItemStack.clone](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable#clone) and [Container.setItem](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container?view=minecraft-bedrock-stable#setitem). No new API version or experiment is required. Exact author class and candidate hashes are in [inputs.json](inputs.json).

## One existing storage owner

- Reuse `NativeItemStorage` and the existing native carrier entity. `record-storage` shares the same row/native commit and rollback helper for jukebox and wall records.
- New walls use `wall_record_items/` keys, separate from jukebox `record_items/`. A pending old jukebox and a new wall can preserve different stacks at one coordinate; audio cleanup handles only its own record.
- A new wall's display row identifies its type. A successfully retired wall clears its own typed row, including after replacement by a jukebox, so subsequent jukebox insertion is not blocked. Foreign replacement rows remain intact.
- No metadata JSON or field whitelist. Only new wall placements acquire native storage. Existing ID-only walls still recover from all 25 model states despite missing, corrupt or wrong legacy rows. Metadata already lost by old versions cannot be recovered.
- Once an index/required marker establishes native ownership, absent/corrupt storage fails closed instead of manufacturing a bare disc. Existing carrier pinning/reanchor is reused.
- Placement, synchronous/deferred onPlace, inventory retrieval, native-break callback and support loss use this owner. Generic transaction delivery now accepts a complete stack instead of reducing it to an ID.

No new entity definition, model, animation, texture, icon, item ID, recipe, native storage schema, release identity, dependency, budget, workflow or historical lock changes. The additional wall key namespace and typed display row are explicit; existing saved keys remain untouched. No Blockbench preview applies to this storage-only change.

## Executed evidence

- [Initial counterexamples](wall-metadata-before.log): same 22 newly added callback tests against main, **19 failed / 3 passed**. This includes vanilla/custom records × sync/deferred placement × retrieval/break/support loss. Three placement failure controls already passed.
- [Final affected suites](wall-metadata-after.log): **205/205 passed**, no skips. The wall suite has **46 new cases** covering full test-stack metadata, Creative, partial/failing writes, carrier creation, block/payment/drop failures, adopted-storage damage, cold storage-instance reads, reanchor, foreign replacement data, independent jukebox ownership and retiring typed rows. Original 25-model legacy recovery and geometry cases remain unchanged.
- [Geometry/converter checks](wall-generation.log): **4/4 passed**; source converter and model definitions are unchanged.
- [Complete source check](check-release.log), clean canonical Tavern `d4213d4322e223b2bf8f6b52cec2558af0a5b54f`: **63 blocks, 159 items, 41 recipes, 1,350 models, zero errors**.
- Independent review found a stale typed-row regression that initially blocked replacement jukebox insertion. It was corrected and covered by the formal retirement/insertion/ejection regression. Final focused review found no blocker. Syntax and diff checks pass.
- [Baseline check](baseline-check.log) rejects runtime changes without a reviewed version/hash update. No version was allocated and no guard changed.

```
node --experimental-loader ./tests/wall-record-loader.mjs --test --test-name-pattern 'named wall|wall placement keeps' tests/wall-record.test.mjs
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/wall-record.test.mjs tests/record-storage.test.mjs tests/freezer-storage.test.mjs tests/freezer-callback.test.mjs tests/jukebox-removal.test.mjs
python tests/test_wall_record_generation.py
python tools/check_release.py
python tools/baseline_gate.py check --release
```

The first log predates the repair and later safety cases; it is not a claim that all final 46 tests were run on main. Logs normalize absolute checkout paths and trailing whitespace, otherwise retaining output. Source/API doubles inspect complete fixture stacks, but do not prove every native engine component. Cold-instance reads are not a real saved-world restart.

The existing canonical `wall-record` job is **workflow_dispatch-only**; a PR-triggered run skips it. Local evidence executes that job's callback and geometry commands. Normal PR CI and its exact head/tree are reported separately in the PR. No workflow is changed to bypass this distinction.

## Remaining limits

No BDS, native click, real player/client, actual saved-world restart, family migration acceptance, merge, deployment or LIVE work. Historical native storage evidence is not relabeled as validation of these changed paths.

This does not implement arbitrary foreign JUKEBOX_PLAYABLE items, Adventure/offhand admission, native pick-block metadata, complete ItemHandlerHelper delivery/drop semantics, native carrier lifetime/performance or arbitrary external script removal. Existing ID-only metadata cannot be restored. Unrelated replacement data is preserved, but recovery from arbitrary engine/crash phases remains unverified.

Keep Draft until normal coordinated paired release identity/freeze and downstream family validation. Full Java parity is not claimed.
