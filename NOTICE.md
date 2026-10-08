# Attribution and source

This is an **unofficial** Minecraft Bedrock port of Kaleidoscope World Liquor,
by **ChenjdyUltra**, **bf_meow** and the original project contributors.
The original resource extraction is pinned in `upstream/source.lock.json`
(NeoForge Minecraft 1.21.1, 1.1.8). Later selected 1.1.9 and current 1.1.11
recipe, renderer and behavior references are recorded under `data/java-parity/`
and `data/current-*-review.json`; separate Java branches remain distinct.
Source: https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor

The pack requires Kaleidoscope Tavern (Unofficial). **Cookery 1.6.0 is optional**:
its rice ingredients enable the original Dassai/Maotai preparations. Tavern's
independent guide and existing bottles continue to work without Cookery.
Cookery is installed separately and is not redistributed by this package.

## Code and original artwork

World Liquor port code is under **MIT**, with the complete terms and copyright
notices in `LICENSE-CODE`. Tavern's copied public extension SDK and original
geometry conversion helper retain **BSD-3-Clause**, whose full terms and original
copyright are in `LICENSE-TAVERN-CODE`.

Original World Liquor and selected Tavern artwork, sounds and models, including
adapted Bedrock geometry/textures, retain **CC BY-NC-SA 4.0**. Their attribution,
license link, noncommercial and share-alike terms are in `LICENSE-ASSETS`.
Tavern's original authors are the **Kaleidoscope Official Production Team / YSBB**.
Source: https://github.com/KaleidoscopeMods/KaleidoscopeTavern

The Bedrock adaptation changes resource format, placement/render bindings and
API bridges. Java-side source files are not included. The conversion reads the
original resource archive; selected behavior was checked against author source
or decompiled classes. `runtime/` is the maintained package source and
`upstream/` preserves the initial resource input. **casama233 and port contributors**
maintain this adaptation. No official affiliation or endorsement is claimed.

## Minecraft publisher assets

The Minecraft 1.21.1 critical-hit sprite, selected vanilla textures (including
obsidian), and sounds under `sounds/kwl/java21/` are Mojang/Microsoft game assets.
They retain their original publisher terms and are **not** relicensed as World
Liquor artwork. Existing provenance is recorded in `data/java-critical-source.json`,
`data/current-freezer-review.json` and the Java parity source/audio references.
This attribution does not expand the publisher's permissions. Minecraft game
archives, classes, server executables and private third-party scripts are not
included in this package.

The BP includes `LICENSE-CODE`, `LICENSE-TAVERN-CODE` and this notice. The RP
includes `LICENSE-ASSETS`, `LICENSE-TAVERN-CODE` and this notice. Repository paths
above identify the public provenance documents; they are not private server data.
