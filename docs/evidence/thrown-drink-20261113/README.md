# Thrown drink source repair candidate

Base: World Liquor main `c5984d46f4df4b120be72f0b7e229922f95509d4`.
This is an **unreleased rendering candidate**, not a complete-family release or in-game acceptance.

## Player-visible defect

All 18 thrown World Liquor bottles used the count-one **placed block** geometry/atlas at scale 0.6 with no camera-facing animation. Java instead creates `ThrownPotion` with the original drink `ItemStack`, then uses `ThrownItemRenderer` and the item's GROUND model. The source model is `item/generated` for all 18 bottles. This changes the visible bottle shape, image, size and viewing behavior while in flight.

The visual repair changes that RP renderer. A follow-up also shares two fully identical fixed freezer sprite geometries to keep the original geometry budget. It does not change BP projectile physics, damage/effects, quality kind numbers 1000–1017, stored data, held items, placed bottles, cabinets, freezer appearances, pack UUIDs or release versions.

## Source and implementation

- [World Liquor NeoForge 1.1.12, file 9217896](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896): all 18 item models and exact source PNGs match the existing q6 item sprites. Full model/texture paths and hashes are in `data/thrown-drink-source/source.json`.
- [Tavern NeoForge 1.2.0, file 8350856](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-tavern/files/8350856): `DrinkBlockItem.makeThrownPotion` creates vanilla `ThrownPotion`, creates `ItemStack(this)`, sets potion contents, and calls `setItem` with that stack. Inspected current bytecode, not only the older public source.
- Official Minecraft 1.21.1 client SHA-1 `30c73b1c5da787909b2f73340419fdf13b9def88`; [official mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt). `EntityType.POTION` selects the default `ThrownItemRenderer` constructor, scale 1; rendering applies camera orientation and GROUND item context. The generated model uses 0.5 scale and translation `[0,2,0]`, after item centering. The generated thickness becomes 0.5 model pixels.
- [Microsoft custom projectile billboard animation](https://github.com/microsoft/minecraft-samples/blob/main/custom_projectiles/resource_pack/animations/custom.animation.json), blob `159a296df26df35a6aa0204d9a59422591b4beba`: camera pitch and camera yaw minus body yaw. This is the custom-entity sample, not the native snowball's different yaw handling.

`tools/thrown_drink_visual.py` owns the route, called by the source compiler. It uses one common shell with source-alpha side-span tiles. Java's min/max side spans are retained, including transparent holes within a span. No icon pixels are repainted. All 18 images use the original item source pixels, and broad faces, thickness and side texels are retained. The unchanged controller selects each source atlas using the existing kind property.

Projectile allocation: one geometry, one bone, 23 cubes, 36 emitted faces, 552 allocated cube vertices; 18 small 64×32 source-derived PNGs. No entity/helper count increase. This is more geometry than an ordinary native flat sprite; no FPS or engine material/filtering claim is made.

The freezer source owner now binds slime_ball and snowball to the existing blue_dye geometry. The three complete geometry documents were identical apart from identifier: format, bones, pivot, vertices, UV, texture dimensions and visible bounds all match. Each sprite keeps its own entity ID, BP, texture, texture-set, material and render controller. The two redundant files are removed; no budget limit or accounting exception is added. The editor exporter resolves the actual entity geometry binding rather than inferring a filename from the ingredient name.

## Completed offline checks

- 18/18 source model and PNG entries verified against the current Java archive.
- Independent native-face decoding and axis-first source alpha oracle: **475,200 UV/alpha samples, zero mismatches**, including both broad faces and all emitted side spans. See `surface-comparison.json`.
- Six focused tests, including an independent all-face sampler and rejection of corruption in each of 21 generated outputs.
- Five existing texture-path tests, four entity-material tests and nine freezer art/equivalence tests pass, for **24 focused tests** total. The freezer regressions reject 11 shape/route mutations and check idempotent sharing.
- Five freezer Blockbench projects and the runtime pose JSON are **byte-identical before and after sharing**, including four facings in dry and wet states. This is an exact artifact comparison, not a new in-game or GUI observation.
- **Complete `tools/check_release.py` passes** (63 blocks, 159 items, 41 recipes, 1,350 paired geometries, zero errors) in the isolated paired layout with current Tavern source contracts. See `aggregate-check.txt` and `paired-validation-inputs.json`. This peer is the separate local Tavern source-contract candidate, not the canonical CI pin.
- The 21 projectile outputs are unchanged since the seven captured Blockbench screenshots; their prior editor evidence is reused for exact unchanged inputs.
- `git diff --check` passes. BP runtime and manifest/dependency/version files are unchanged.

## Remaining integration and engine limits

- Blockbench: all 18 source/before/after bottle routes were actually opened and reviewed from South and North in three pages (six raw screenshots), plus two representative bottles from a true isometric view (one raw screenshot). Source and candidate silhouettes/pixels matched in these editor views; old placed-bottle shapes and sizes visibly differed. No model edits were made in the editor. This is not native Minecraft rendering or live billboard playback.
- The earlier budget failure is resolved: two equal freezer meshes now share their existing owner, reducing the combined base from 1024 to **1022 < 1024**. The original limit is unchanged. See `shared-freezer-equivalence.json` for full shape/route equivalence and allocation evidence.
- The earlier missing-history failure is resolved by a normal `git fetch --unshallow --no-tags` from the official canonical GitHub repository. The required historical commit is present and the aggregate check passes. No read restriction was bypassed.
- At the offline evidence checkpoint, no fresh version/freeze, CI, BDS, saved-world run, in-game visual validation or deployment was performed. The Draft PR reports its own exact-head CI separately; no release metadata or CI peer pins are changed here. Camera-facing orientation, lighting/filtering, close-camera spawn suppression and flight appearance still require native-engine observation. The Java close-camera first-two-ticks suppression is not implemented by this RP change.
- This repair covers thrown World Liquor bottle rendering only. It is not a claim of complete Java parity for all modules, held contexts or block placements.

## Review files and parallel work

The seven original screenshots and four saved comparison projects are in `editor/`; their unchanged hashes are listed in `editor-evidence.json`. These are model-only scenes with no user world or player data. `focused-checks.txt` records the fresh 24-test run.

Before submission, canonical main remained `c5984d46f4df4b120be72f0b7e229922f95509d4`. Open PRs #220 (frost scheduler), #219 (native record fixture), #216 (workflow), #214 (held editor evidence), and #178 (historical dependency draft) had no changed-file overlap with this candidate. No host-owned source, workflow, version, peer pin or release lock is modified. The normal release baseline guard is intentionally unchanged and this unfrozen candidate is not ready to merge or publish as a release.
