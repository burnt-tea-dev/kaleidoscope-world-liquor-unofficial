> **Published-install correction (2026-10-18):** W141 TEST requires **Tavern T163 BP/RP**, despite its historical tag README saying T155. W148 stable requires T170. See [exact published-package guidance](docs/PUBLIC-DOWNLOAD-INSTALLATION-20261018.md); existing assets and historical tags are unchanged.

## Current maintained source: 0.1.161

W161 pairs both packs with **Tavern 0.6.183** for consolidated placed-bottle facing and owner reads. World Liquor changes only release/module/dependency and generated guide payload version identities; recipes, effects, resources, UUIDs and saved data retain W160 behavior. **Grilling 2.8.155** remains an optional source-check peer. Source guide/dependency checks, full-family saved-world gates and rendered-client acceptance remain separate. See [changes](CHANGELOG.md), [validation and limits](docs/PARITY-MATRIX.md), and the [remaining freezer visual plan](docs/audit/FREEZER-VISUAL-REVIEW-20261024.md). `publication_request=false`, `bds=false`, `client=false`, `production_ready=false`.

Previous merged source reviewed on **2026-10-17** at [b8692380](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/commit/b86923801febbf23a43f36017ad299b28128b029). W151 is merged and paired with **Tavern 0.6.173**; it restores Java collision/selection shapes for the freezer, cups, stools and cabinets. See [source scope](docs/evidence/collision-shapes-20261016.md).

**Public download:** [World Liquor v0.1.148](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.148), paired with **Tavern 0.6.170** and optional Grilling **2.8.149** source checks. W151's [release request](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/39922e91767ce593f537064f9d8e60b7f013dc30/.github/release-request.json) remains `publication_request=false`; the successful authorization workflow skipped publication.

**Deployment records:** Actual server identities, private integration versions, deployment times and production receipts are kept in private maintenance records. Public versions and acceptance limits remain in the family status index.

**Remaining work:** current all-item Blockbench first-person/side-texture coverage, general freezer item rendering, paired gameplay/client scenes and the implementation gaps in [PARITY-MATRIX](docs/PARITY-MATRIX.md) / [BUGS](docs/BUGS.md). Treasure Guide mob-drop duplication remains intentionally retained under the owner's existing decision. The known pudding bowl remainder difference is tracked explicitly. `client=false`, `production_ready=false`.

W148's stable-channel publication retains the owner's source/editor/CI/package decision without an added client gate. [Earlier README](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/README.md), release notes and old observations retain their original scope.

# 森羅酒館：世界名酒（非官方） / Kaleidoscope World Liquor (Unofficial)

A Minecraft Bedrock port of [Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor). Tavern hosts its brewing, mixology, guide, cabinet and timed-effect contracts; this pack supplies its drinks, recipes, assets and specific adapters.

## Requirements and installation

For the public **W148** download, enable both World Liquor packs with both **Tavern 0.6.170** packs. The merged **W151** source requires **Tavern 0.6.173**; this **W161** source candidate requires **Tavern 0.6.183**. W152's T175 pairing retains its historical scope. Bedrock/BDS **1.26.50+** and each version's stable Script API declarations are required. [baseline.json](baseline.json) and the manifests own the current source identities.

Cookery remains optional for standalone World Liquor; its rice ingredients enable Dassai/Maotai preparation. Existing bottles remain drinkable and placeable without it. The public W148/T170/G149 reference uses Cookery **1.6.0**; the prior W151/T173/G150 source family targets **1.6.1**. The source pairing targets W161/T183/G155 with Cookery1.6.2 under separate family adaptation; canonical checks remain pending. W153 retains its historical exact T176 dependency. Grilling is an optional source-check peer, not a World Liquor runtime hard dependency. [.github/baseline-integration.json](.github/baseline-integration.json) records the target source-check peers and whether their exact commits are finalized. Tavern's independent guide and optional Cookery entrance share the seven-section projection.

Back up existing worlds before updating both sides of a package. Use the [current Releases](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases) rather than historical archives committed in `downloads/`. Source and release checks do not certify a live installation or client rendering.

## Build

The committed `runtime/BP` and `runtime/RP` are the package source. With Python 3, build a clean reviewed checkout directly:

```sh
python3 tools/build_release.py
```

The archive and release integrity checksum are written to `dist/`; its filename uses the manifest version. The exporter verifies the canonical baseline and requires committed source. It does not regenerate textures, guides, recipes or gameplay, and does not need a neighboring Tavern checkout.

`tools/build_port.py`, `build_storage_visuals.py` and `rebuild_guide.py` are source authoring commands that rewrite tracked runtime. Run them only for a reviewed source change, inspect their diffs and freeze a new release identity. They are not prerequisites for packaging an existing baseline.

## Checks

Historical W151 integration checks pinned T173/G150; the [reviewed W151 main CI](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38930909505) passed. Package, source, full-family migration and human acceptance remain distinct. Historical native and client evidence in the family index keeps its original identity. The published guide, machine metadata, fish gate and confirmed-anchor repairs remain intact. The complete 84-class projection is checked against the paired Tavern source. The public guide remains 223 entries; four AMW producer pages belong to the 227-entry complete-family projection. The [published W113 guide report](docs/GUIDE-VALIDATION-0.1.113.json), published W117 and earlier trial evidence keep their original sources; new-candidate CI, native persistence, saved-world migration and human client acceptance are tracked separately.

Use the exact Tavern and Grilling revisions in [.github/baseline-integration.json](.github/baseline-integration.json), beside this repository as `tavern-src` and `grilling-src`. Python tools also accept `TAVERN_ROOT`; the helper-definition check accepts `TAVERN_SOURCE` and `GRILLING_SOURCE`. Grilling is a source-check peer and remains optional in the installed game. Pillow and Node.js are needed by the existing source checks:

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
