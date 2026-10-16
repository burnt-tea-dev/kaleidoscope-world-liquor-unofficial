## Current maintained baseline: 0.1.150

World Liquor 0.1.150 restores the pinned Java freezer, cup, stool and cabinet collision/selection shapes, paired with Tavern 0.6.172. Stable Bedrock collision arrays reproduce the three-part stools without experiments; the engine keeps one selection outline. [Source and remaining client checks](docs/evidence/collision-shapes-20261016.md).

W148 updates the exact dependencies and release/guide identity for Tavern 0.6.170. World Liquor gameplay, recipes, storage, models, textures and materials remain unchanged, including W147’s freezer registry repair. The optional Grilling 2.8.144 source-check peer remains unchanged. See [pairing notes](docs/RELEASE-NOTES-0.1.148.md) and the retained [freezer source evidence](docs/evidence/freezer-material-registry-20261015.md); full family and human client acceptance remain pending.

Previous deployment evidence (T166/G142/W144, not acceptance for W145): The family deployed on **2026-10-14 21:41:21 HKT** after canonical PR/checks/merge and stopped-save first start/restart. All 42 packs passed startup readback. The formal [v0.1.144 release](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.144) is public (`prerelease=false`); the six public family packs contain 9,349 files matching the reviewed receipt and LIVE. This is delivery evidence, not a rendered-client latency or full Java parity result. See [client reports and remaining work](docs/BUGS.md) and the [family status](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/family/BASELINE-STATUS.md). `client=false`, `production_ready=false`, `pending_client_acceptance`.

# 森羅酒館：世界名酒（非官方） / Kaleidoscope World Liquor (Unofficial)

A Minecraft Bedrock port of [Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor). Tavern hosts its brewing, mixology, guide, cabinet and timed-effect contracts; this pack supplies its drinks, recipes, assets and specific adapters.

## Requirements and installation

Use Tavern **0.6.170** with both packs' BP and RP enabled. Bedrock/BDS **1.26.50+** and the stable Script API versions in the manifests are required. [baseline.json](baseline.json) records the exact package identities and dependencies.

Cookery **1.6.0** is optional. Its rice ingredients enable the original Dassai/Maotai preparation recipes. Existing bottles remain drinkable and placeable without Cookery. Tavern has an independent guide; the optional Cookery entrance uses the same seven sections. Grilling **2.8.144** is the exact public CI helper reference and remains optional for standalone use. The deployed Cookery integration and receiver evidence follow the current family index; historical peer checks retain their original source.

Back up existing worlds before updating both sides of a package. Use the [current Releases](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases) rather than historical archives committed in `downloads/`. Source and release checks do not certify a live installation or client rendering.

## Build

The committed `runtime/BP` and `runtime/RP` are the package source. With Python 3, build a clean reviewed checkout directly:

```sh
python3 tools/build_release.py
```

The archive and release integrity checksum are written to `dist/`; its filename uses the manifest version. The exporter verifies the canonical baseline and requires committed source. It does not regenerate textures, guides, recipes or gameplay, and does not need a neighboring Tavern checkout.

`tools/build_port.py`, `build_storage_visuals.py` and `rebuild_guide.py` are source authoring commands that rewrite tracked runtime. Run them only for a reviewed source change, inspect their diffs and freeze a new release identity. They are not prerequisites for packaging an existing baseline.

## Checks

Integration checks use the exact T169/G144 source commits in [.github/baseline-integration.json](.github/baseline-integration.json). W144 source CI and the deployed complete-family saved-world checks passed; rendered-client acceptance remains pending. Historical native and client evidence in the family index keeps its original identity. The published guide, machine metadata, fish gate and confirmed-anchor repairs remain intact. The complete 84-class projection is checked against the paired Tavern source. The public guide remains 223 entries; four AMW producer pages belong to the 227-entry complete-family projection. The [published W113 guide report](docs/GUIDE-VALIDATION-0.1.113.json), published W117 and earlier trial evidence keep their original sources; new-candidate CI, native persistence, saved-world migration and human client acceptance are tracked separately.

For cross-pack source checks, use the exact Tavern and Grilling revisions in [.github/baseline-integration.json](.github/baseline-integration.json), beside this repository as `tavern-src` and `grilling-src`. Python tools also accept `TAVERN_ROOT`; the helper-definition check accepts `TAVERN_SOURCE` and `GRILLING_SOURCE`. Grilling is a source-check peer and remains optional in the installed game. Pillow and Node.js are needed by the existing source checks:

```sh
python3 tools/check_release.py
node tools/check_respawn_helpers.mjs
python3 tools/verify_release.py --development
```

The verification command reads the archive produced by the build. CI runs the complete required suite once for functional or unknown inputs. Only changes confined to the reviewed `README.md`, `README.zh-TW.md` and `docs/BUGS.md` prose paths can skip bridge/package/wall-record jobs; baseline, release-claim and workflow checks still run. A prose path selected by release metadata is treated as functional. Manual runs, unavailable or empty diffs, and every other path require full validation. The gate uses complete push or PR merge-base diffs, including both sides of renames. The publication workflow always retains its full validation. Local work uses only checks affected by the concrete change; successful evidence for unchanged candidates is reused. See [baseline maintenance](docs/BASELINE-MAINTENANCE.md) and [test audit](docs/audit/TEST-AUDIT.md).

Asset/reference checks are build preconditions. Source logic tests, affected native BDS scenes and actual rendered-client/audio acceptance are recorded separately. No simulated-player or full Java parity claim is made by these commands.

## Known limits

- The fish repair changes class admission; later mob kill credit still requires a living owner. Complete native beheading cancellation/reentry/head ownership, Elbow knockback, CaptainGift collision and highball Creative Flight remain incomplete or unverified. Source admission repairs are separate from these event-phase gaps.
- Shared-spawn Respawn now recognizes 87 source-verified family storage/render helpers with empty collision boxes, including Grilling's ten reviewed zero-collision helper definitions. Unknown entities still require known facts; native Player spawn/bed/anchor lifecycle and client acceptance remain separate.
- Glass transparency, four-way storage/freezer placement, animation, wall-disc angle and audio still require the current client comparison matrix. Historical scoped observations do not certify every current scene.
- Through-wall Hostile Detection/Treasure Sense outlines, Brew Accelerator and native Java Luck consequences remain incomplete. Current stable camera animation supports three-axis rotation, but pure gameplay-camera roll preserving aim and held rendering remains unimplemented/unverified.
- The custom record uses a script jukebox adapter; native playback, tracking and full lifecycle equality remain separate requirements.
- Freezer timing, current recipes and complete native input-stack preservation have scoped source/engine evidence. Full FluidUtil, hooks, cancellation, offhand, crash/chunk phases, comparator and every rendered interaction remain incomplete.
- Forge 1.20.1 and NeoForge 26.1.2 are separately tracked author branches. They are not silently treated as the maintained NeoForge 1.21.1 source.

The [Phase 0 audit](docs/audit/AUDIT.md) records known implementation gaps and evidence limits. The current addon remains pending human client acceptance.

## Source, licensing and history

Code and copied Tavern SDK terms are separated in [NOTICE.md](NOTICE.md), [LICENSE-CODE](LICENSE-CODE), [LICENSE-TAVERN-CODE](LICENSE-TAVERN-CODE) and [LICENSE-ASSETS](LICENSE-ASSETS). The BP/RP include the applicable notices; Mojang assets retain their original publisher terms.

[CHANGELOG.md](CHANGELOG.md) points to release history and the archived installation/build descriptions. Historical version numbers are not current requirements. For bridge. authoring, open root `config.json` and read [BRIDGE-WORKFLOW.md](docs/BRIDGE-WORKFLOW.md).
