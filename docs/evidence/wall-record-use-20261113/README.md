# Wall-record default interaction admission

Functional source candidate, not a release or native-game acceptance.

## Defect and repair

Wall-mounted records incorrectly required an empty main hand for retrieval. Adventure was cancelled and then rejected by the general furniture guard. Conversely, sneaking with an empty main hand and an occupied offhand wrongly retrieved the disc.

The existing furniture owner now uses one predicate in both the before-event and direct-component paths: ordinary non-Spectator interaction is admitted unless sneaking with either hand occupied. Held tools/blocks are not consumed. Adventure retrieval is admitted without changing placement permissions. Mutation remains deferred with the existing slot, stack, sneak, dimension and block checks; the final record handler rechecks mode and offhand. Existing inventory transaction, rollback and full-inventory safe refusal remain intact.

The custom-record guide body is regenerated from its existing owner in all three languages. Only that page's body changes; other payload fields and pages are identical. Rebuilding again is byte-identical.

## Authoritative inputs

- Canonical main: `c5984d46f4df4b120be72f0b7e229922f95509d4`. All 11 open PRs (#227, #226, #225, #224, #223, #222, #220, #219, #216, #214, #178) were reviewed before publication. None owns this admission defect. This candidate does not copy those changes. In particular, #227 owns full-stack wall storage and #224 owns stool admission; their shared furniture/test/guide files need ordinary integration review.
- Current [World Liquor NeoForge 1.1.12 / Minecraft 1.21.1](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896), JAR SHA-256 `d963089ad0a7f99a8950171d76913cfeea99a0126ee12b16c72c3162f8545da3`. `WallRecordBlock.useWithoutItem` returns its drops with `ItemHandlerHelper.giveItemToPlayer`, removes the wall and plays the remove sound. There is no empty-hand or Adventure restriction in that callback.
- Official Minecraft 1.21.1 client JAR SHA-1 `30c73b1c5da787909b2f73340419fdf13b9def88`, SHA-256 `499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99`. [Mojang mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt) identify the inspected `ServerPlayerGameMode.useItemOn` bytecode: offsets 34–73 separate Spectator; 74–118 derive secondary use from sneaking with either hand occupied; 175–221 dispatch default MAIN_HAND block use before item use at 222 onward. `BlockBehaviour.useItemOn` defaults to PASS_TO_DEFAULT_BLOCK_INTERACTION. The method name `useWithoutItem` is not an empty-hand requirement.
- Official [NeoForge game-mode patch](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/patches/net/minecraft/server/level/ServerPlayerGameMode.java.patch) and [default item hooks](https://raw.githubusercontent.com/NeoForged/NeoForge/1.21.1/src/main/java/net/neoforged/neoforge/common/extensions/IItemExtension.java) preserve this ordinary route. Arbitrary third-party onItemUseFirst and sneak-bypass overrides are not reproduced.
- Official [Bedrock Player API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable) and [equippable API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable) provide the existing mode, sneak and equipment reads. The checked official npm 2.12.0-beta.1.26.60-stable archive SHA-256 is `ee58c056597bf8891f700f8e79a3fad853645661422c3a2f3e28b5252f6bf72d`. No new engine/API dependency or permission is introduced.

## Discriminating validation

Tests import the real registerFurniture/installFurniture callbacks using the existing API-double loader; they do not rewrite production source.

- The 15 new tests on unchanged main: **13 fail / 2 pass**. These include three individual held-item/Adventure counterexamples and the offhand sneak rejection. Some failures share initial admission causes; they are not 13 independent gameplay repairs.
- Final wall suite: **77/77 pass**, including 25 models × four facings × four modes × two sneak states × three main-hand states × two offhand states = **4,800 combinations**, 2,100 admitted and 2,700 refused. Correct disc IDs/counts, unchanged held/offhand items and no duplicate drops are checked.
- Direct-component admission, repeated input, delayed slot/metadata/offhand/sneak/block/mode changes, full inventory and failed inventory writes are covered.
- Seven affected wall, jukebox, record-storage, freezer and respawn suites: **185/185 pass**. The first attempt could not import the absent Grilling peer (179 pass / one failed file); fetching the exact public canonical pin resolved this missing input without changing tests or runtime. Final peers are Tavern `d4213d4322e223b2bf8f6b52cec2558af0a5b54f` and Grilling `7c2d3c0afcb39db314a1f95fa7f0276272b27eb1`.
- Existing wall generation checks: **4/4 pass**. No asset changed.
- Complete check_release.py with the clean canonical Tavern pin: **63 blocks, 159 items, 41 recipes, 1,350 models, zero errors**.
- Paired guide contract: 225 entries, 31 categories, 218 packets. Exact guide scope/idempotence, syntax, compilation and diff checks pass. Independent review reran the 77 wall tests and found no runtime blocker.

Reproduce with the exact peers at ../tavern-src and ../grilling-src:

```sh
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/wall-record.test.mjs tests/jukebox-removal.test.mjs tests/record-storage.test.mjs tests/freezer-callback.test.mjs tests/freezer-storage.test.mjs tests/respawn-freezer.test.mjs tests/respawn-family.test.mjs
python tests/test_wall_record_generation.py
python tools/rebuild_guide.py --no-audit
node tools/check_guide.mjs
python tools/check_release.py
```

## Limits and release blocker

No BDS, real-player/client clicks, actual saved-world restart, concurrent-player ordering, deployment or LIVE work. No model, icon, texture, animation, transform or geometry changes; no new Blockbench preview applies.

This is ordinary default-block-use admission only, not arbitrary offhand item interaction or custom NeoForge hook parity. The main-hand snapshot remains required. If admission changes during deferral, the cancelled native action cannot be replayed. Full inventory still safely refuses retrieval rather than implementing complete ItemHandlerHelper fallback/drop/pickup-delay semantics. Existing metadata loss on main is owned by the separate #227 candidate and is not repaired or claimed here. Unknown model handling, legacy identity recovery and placement permissions are unchanged.

Versions, manifests, baseline/history, budgets and workflows are unchanged. The release guard correctly rejects this runtime delta: **runtime changed without a reviewed version/hash update**. Keep Draft pending coordinated paired identity/freeze and downstream family checks. No version is guessed or guard weakened.

The existing wall-record CI job is workflow_dispatch-only; ordinary PR CI skips it. These 15 new wall cases and the four geometry checks are local evidence, not a passed canonical CI job. Other required PR jobs and exact-head results are reported in the PR.
