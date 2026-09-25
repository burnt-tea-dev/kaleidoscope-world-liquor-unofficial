# 森羅酒館：世界名酒（非官方） / Kaleidoscope World Liquor (Unofficial)

Bedrock port of the [Java addon](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor).
Requires the public beta of [Kaleidoscope Tavern (Unofficial)](https://github.com/casama233/kaleidoscope-tavern-unofficial)
version **0.6.40** and its Cookery dependency. Enable both behavior and resource packs alongside Tavern and Cookery. Target: Bedrock/BDS 1.26.50+.

Current **0.1.5 preview** contains 18 six-quality bottled drinks, six new
cocktails and their Java barrel/shaker recipes, 16 colored stools, 10 connected
cabinet blocks, the freezer and five freezer recipes, eight paintings, two
bottled mixers, four fallback foods, the random record and wall-hung records.
Original Java models, textures, sprites and sounds are converted from the
pinned JAR; three languages are included. The Cookery guidebook receives
combined brewing/usage entries through Tavern's extension API.

## Download / 下載

[0.1.5-preview.1 release](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.5-preview.1) · [Full BP/RP .mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.5-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.5_preview1.mcaddon)

Back up your world before upgrading. Install together with Tavern **0.6.40-beta.1** and Cookery **1.0.6**; update both BP and RP. UUIDs and content IDs remain unchanged. The release includes SHA256SUMS, exact source revision and static validation evidence.

## 0.1.5 cabinet repair

Both cabinet helpers now use Tavern's storage-only bottom-pivot Molotov model, with model pitch owned only by RP. All five wood sets share these corrected helpers. Watermelon juice is accepted at appended visual index 44; old 0–43 mappings and saved item IDs are unchanged. The compiler uses a locked display order, so adding a host bottle cannot silently shift the addon wines. Existing guide content, recipes, effects, models and textures are preserved. Static checks compare both cabinet families and four facings against the pinned Java slot matrices; no new BDS or client validation is claimed.

## Survival path

1. Find Tavern's wild grapevine beneath oak/birch foliage in forests, plains
   or meadows; harvest it to build trellises. Tavern's normal, ice and gold
   grapes then use the soil and temperature paths documented by Tavern.
2. Build Tavern's barrel and shaker. World Liquor's 18 barrel recipes use
   Tavern fluids, vanilla plants and Cookery rice; all recipes and ingredient
   orders are in the in-game guide. One empty Tavern bottle extracts one
   quality-specific drink.
3. Follow each shaker recipe's three slots and alternatives. Registered
   alcoholic inputs require quality 4–6; mixer slots use their explicitly
   listed ingredients. Original colored input classes and effects are
   registered through the extension API.
4. The freezer opens by sneaking, accepts one fluid bucket and up to four
   ingredients, and runs for its recipe's nominal processing time while loaded.
   Pudding needs a bowl on extraction. Put bottles into the cabinets by
   selecting a slot; empty hand takes them out. Empty hand sits on a stool.

## Engine differences still under review

Java-style per-player camera roll and the through-wall glow/outline used by
Hostile Detection and Treasure Sense are not supplied by this add-on. These
outline effects currently have timed status but no client outline. Java's Brew
Accelerator custom enchantment is omitted. Optional Java integrations for Create
and the Kaleidoscope Doll add-on are outside this dependency stack.
Native `minecraft:luck` and its Java gameplay consequences are also absent.

World Liquor's custom disc uses a Script API jukebox adapter. The original two
audio files are included and a placed custom disc can be retrieved with an empty
hand. Client glass transparency, wall record angle and animated furniture still
need direct device review; a BDS startup cannot prove visual fidelity.

## Build and validation

Place the pinned Tavern source beside this repository as `tavern-src`; the
release request and CI workflow identify the exact dependency commit.

```sh
python3 tools/build_storage_visuals.py
python3 tools/rebuild_guide.py
python3 tools/check_release.py
python3 tools/build_release.py
python3 tools/verify_release.py
```

Static JSON, JavaScript, geometry, dependency, guide-payload and full archive
checks are included. No simulated player interaction tests, new BDS run or
visual client run were performed for this release. Guide names/categories have
three locales; Cookery 1.0.6 receives complete Traditional Chinese + English
instruction rows because that host drops mechanicsByLocale region-code keys.
Its files are not modified.

The guide rebuild synchronizes its protocol version with the pack manifest.
The build creates `dist/Kaleidoscope_World_Liquor_Unofficial_0.1.5_preview1.mcaddon`
and SHA256SUMS. Publication verifies every archive entry against committed
runtime, downloads every uploaded asset, and checks byte equality before
changing the draft to a public prerelease. Existing releases are not overwritten.
