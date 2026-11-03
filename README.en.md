# Kaleidoscope World Liquor — Unofficial Bedrock Port (世界名酒)

An unofficial Minecraft Bedrock Edition port of Kaleidoscope World Liquor, adding more spirits, recipes, drinking effects and display furniture to Tavern.

[繁體中文](README.md) · [简体中文](README.zh-CN.md) · **English**

[Download](https://github.com/burnt-tea-dev/kaleidoscope-world-liquor-unofficial/releases) · [Changelog](CHANGELOG.md)

## Features

- Produce and sample a wider selection of drinks from around the world, extending Tavern's brewing and mixology.
- Decorate with bottles, cabinets and lighting.
- Look up recipes, equipment and effects in the Tavern guide.
- Optionally use Cookery for ingredients required by certain drink recipes.

**This is an unfinished, unofficial port.** Java Luck's global loot effects, TreasureSense outlines and some client-side effects still differ. Consult the [parity matrix](docs/PARITY-MATRIX.md). Source checks or successful loading do not establish that every visual, audio or interaction behavior has passed hands-on client testing.

## Installation

1. Back up your world. Download the `.mcaddon` from **Releases**; GitHub's source ZIP is not an installation package.
2. Install the **exact Tavern version required by that release**, enabling the behavior pack (BP) and resource pack (RP) for both addons. Do not mix arbitrary latest versions across repositories.
3. Follow the Minecraft version and experiment requirements of the chosen release. The development branch uses 26.60 Beta APIs; older public packages may have different requirements.

**Tavern is required; Cookery and Grilling are not.** Without Cookery, recipes using its ingredients cannot be completed, but existing bottles remain drinkable and placeable, and the guide is accessible. Obtain third-party packs separately: this download contains neither those packs nor private integration. The [historical dependency correction](docs/PUBLIC-DOWNLOAD-INSTALLATION-20261018.md) applies only to older downloads.

## Languages

Resource strings are available in **English, Simplified Chinese and Traditional Chinese** and follow the Minecraft client language. Recipes and product descriptions are displayed through Tavern's three-language guide; choose its language separately. Some hints and player-head text remain fixed-language. Translation file coverage is not proof of complete UI localization.

## Development

Python 3 and Node.js are required. Canonical sources are in [`runtime/BP`](runtime/BP/) and [`runtime/RP`](runtime/RP/). From a clean, committed checkout, run:

```sh
python3 tools/check_release.py
python3 tools/build_release.py
python3 tools/verify_release.py --development
```

Build artifacts are written to `dist/`. [`baseline.json`](baseline.json) pins source identities and dependencies; the development branch may be ahead of the downloadable release. Read [AGENTS.md](AGENTS.md) and [baseline maintenance](docs/BASELINE-MAINTENANCE.md) before modifying the project. Asset and guide generators mutate sources and do not need to run before every build.

## Reporting issues

Include the World Liquor, Tavern and Minecraft versions, optional companion packs, enabled experiments, reproduction steps, and expected versus actual results. Attach screenshots or short recordings for visual or audio defects. Check [known issues](docs/BUGS.md) first; do not post private worlds or full third-party packs.

## Credits and license

Original project: [Kaleidoscope World Liquor](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor) by **ChenjdyUltra, bf_meow and contributors**. Thanks to Tavern's Kaleidoscope Official Production Team / YSBB. This port is not endorsed by the original authors or Minecraft.

Port code: [MIT](LICENSE-CODE). Reused Tavern code: [BSD-3-Clause](LICENSE-TAVERN-CODE). Existing assets and exceptions retain their terms; see [LICENSE-ASSETS](LICENSE-ASSETS) and [NOTICE.md](NOTICE.md). The code license does not relicense assets.

The latest Java 1.1.13 Forge / 1.1.12 NeoForge archives separately state **CC BY-NC-ND 4.0**. New assets must not automatically inherit an older CC BY-NC-SA license; check applicable terms or obtain author permission.

## Limited client checkpoint — 2026-11-01

[T194 / W180 four-side results](docs/CLIENT-CHECKPOINT-T194-W180-20261101.md): 16 bounded passes, one first-person lower-right clipping FAIL, two NOT-RUN items and one unverified item. This does not establish family-wide, all-device or Java-equivalent acceptance. Historical records are unchanged.
