## Current maintained baseline: 0.1.113

W113 rewrites all 67 World Liquor guide entries with concise instructions and drink purposes, paired with Tavern T136's shared guide. Complete preparation data remain available on each product. W112 gameplay, current-author Dassai data, models, sounds and saved identities remain intact; see [release scope](docs/RELEASE-NOTES-0.1.113.md).

# 森羅酒館：世界名酒（非官方） / Kaleidoscope World Liquor (Unofficial)

A Minecraft Bedrock port of [Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor). Tavern hosts its brewing, mixology, guide, cabinet and timed-effect contracts; this pack supplies its drinks, recipes, assets and specific adapters.

## Requirements and installation

Use Tavern **0.6.136** with both packs' BP and RP enabled. Bedrock/BDS **1.26.50+** and the stable Script API versions in the manifests are required. [baseline.json](baseline.json) records the exact package identities and dependencies.

Cookery **1.6.0** is optional. Its rice ingredients enable the original Dassai/Maotai preparation recipes. Existing bottles remain drinkable and placeable without Cookery. Tavern has an independent guide; the optional Cookery entrance uses the same seven sections. Grilling **2.8.121** is the current family pairing, not a standalone requirement for this pack.

Back up existing worlds before updating both sides of a package. Use the [current Releases](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases) rather than historical archives committed in `downloads/`. Source and release checks do not certify a live installation or client rendering.

## Build

The committed `runtime/BP` and `runtime/RP` are the package source. With Python 3, build a clean reviewed checkout directly:

```sh
python3 tools/build_release.py
```

The archive and release integrity checksum are written to `dist/`; its filename uses the manifest version. The exporter verifies the canonical baseline and requires committed source. It does not regenerate textures, guides, recipes or gameplay, and does not need a neighboring Tavern checkout.

`tools/build_port.py`, `build_storage_visuals.py` and `rebuild_guide.py` are source authoring commands that rewrite tracked runtime. Run them only for a reviewed source change, inspect their diffs and freeze a new release identity. They are not prerequisites for packaging an existing baseline.

## Checks

Integration checks pin Tavern T136 `496ce702161fb48ab6f67ea6645ad1e4d41b2a12` and Grilling G121 `2b422458ebfdd3831bc7a57af30c24cfa211d23a`. T136 retains the canonical T132 gameplay baseline and adds the guide revision; the separate T135 PR302 remains unmerged and is not part of this candidate. Paired guide data are checked in [the W113 report](docs/GUIDE-VALIDATION-0.1.113.json). Remote CI, family BDS, saved-world migration and human client acceptance retain their separate gates.

For cross-pack source checks, use the exact Tavern and Grilling revisions in [.github/baseline-integration.json](.github/baseline-integration.json), beside this repository as `tavern-src` and `grilling-src`. Python tools also accept `TAVERN_ROOT`; the helper-definition check accepts `TAVERN_SOURCE` and `GRILLING_SOURCE`. Grilling is a source-check peer and remains optional in the installed game. Pillow and Node.js are needed by the existing source checks:

```sh
python3 tools/check_release.py
node tools/check_respawn_helpers.mjs
python3 tools/verify_release.py --development
```

The verification command reads the archive produced by the build. CI runs the complete required suite once. Local work uses only checks affected by the concrete change; successful evidence for unchanged candidates is reused. See [baseline maintenance](docs/BASELINE-MAINTENANCE.md) and [test audit](docs/audit/TEST-AUDIT.md).

Asset/reference checks are build preconditions. Source logic tests, affected native BDS scenes and actual rendered-client/audio acceptance are recorded separately. No simulated-player or full Java parity claim is made by these commands.

## Known limits

- Shared-spawn Respawn now recognizes 87 source-verified family storage/render helpers with empty collision boxes, including Grilling 2.8.119's plate and recipe displays. G119 retains all 10 reviewed Grilling helper definitions from G118. Unknown entities still require known facts; native Player spawn/bed/anchor lifecycle and client acceptance remain separate.
- Glass transparency, four-way storage/freezer placement, animation, wall-disc angle and audio still require the current client comparison matrix. Historical scoped observations do not certify every current scene.
- Through-wall Hostile Detection/Treasure Sense outlines, Brew Accelerator and native Java Luck consequences remain incomplete. Current stable camera animation supports three-axis rotation, but pure gameplay-camera roll preserving aim and held rendering remains unimplemented/unverified.
- The custom record uses a script jukebox adapter; native playback, tracking and full lifecycle equality remain separate requirements.
- Freezer timing, current recipes and complete native input-stack preservation have scoped source/engine evidence. Full FluidUtil, hooks, cancellation, offhand, crash/chunk phases, comparator and every rendered interaction remain incomplete.
- Forge 1.20.1 and NeoForge 26.1.2 are separately tracked author branches. They are not silently treated as the maintained NeoForge 1.21.1 source.

The [Phase 0 audit](docs/audit/AUDIT.md) records known implementation gaps and evidence limits. The current addon remains pending human client acceptance.

## Source, licensing and history

Code and copied Tavern SDK terms are separated in [NOTICE.md](NOTICE.md), [LICENSE-CODE](LICENSE-CODE), [LICENSE-TAVERN-CODE](LICENSE-TAVERN-CODE) and [LICENSE-ASSETS](LICENSE-ASSETS). The BP/RP include the applicable notices; Mojang assets retain their original publisher terms.

[CHANGELOG.md](CHANGELOG.md) points to release history and the archived installation/build descriptions. Historical version numbers are not current requirements. For bridge. authoring, open root `config.json` and read [BRIDGE-WORKFLOW.md](docs/BRIDGE-WORKFLOW.md).
