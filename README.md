# 森羅酒館：世界名酒（非官方） / Kaleidoscope World Liquor (Unofficial)

Bedrock port of the [Java addon](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor).
Requires the public beta of [Kaleidoscope Tavern (Unofficial)](https://github.com/casama233/kaleidoscope-tavern-unofficial)
version **0.6.37** and its Cookery dependency. Enable both behavior and resource packs alongside Tavern and Cookery. Target: Bedrock/BDS 1.26.50+.

Current **0.1.3 preview** contains 18 six-quality bottled drinks, six new
cocktails and their Java barrel/shaker recipes, 16 colored stools, 10 connected
cabinet blocks, the freezer and five freezer recipes, eight paintings, two
bottled mixers, four fallback foods, the random record and wall-hung records.
Original Java models, textures, sprites and sounds are converted from the
pinned JAR; three languages are included. The Cookery guidebook receives
combined brewing/usage entries through Tavern's extension API.

## Survival path

1. Find Tavern's wild grapevine beneath oak/birch foliage in forests, plains
   or meadows; harvest it to build trellises. Tavern's normal, ice and gold
   grapes then use the soil and temperature paths documented by Tavern.
2. Build Tavern's barrel and shaker. World Liquor's 18 barrel recipes use
   Tavern fluids, vanilla plants and Cookery rice; all recipes and ingredient
   orders are in the in-game guide. One empty Tavern bottle extracts one
   quality-specific drink.
3. Three quality 4–6 alcoholic drinks can be mixed in Tavern's shaker for
   the new cocktail recipes. The original colored input classes and effects
   are registered through the extension API.
4. The freezer opens by sneaking, accepts one fluid bucket and up to four
   ingredients, and runs for 90 seconds while loaded. Pudding needs a bowl on
   extraction. Put bottles into the cabinets by selecting a slot; empty hand
   takes them out. Empty hand sits on a stool.

## Engine differences still under review

Bedrock has no stable client API for Java's per-player camera roll or the
through-wall glow/outline used by Hostile Detection and Treasure Sense. These
visual effects currently have timed status but no client outline. Java's Brew
Accelerator custom enchantment cannot be registered as a native Bedrock
EnchantmentType, so its enchanted book is omitted. Optional Java integrations
for Create and the Kaleidoscope Doll add-on are outside this dependency stack.
Native `minecraft:luck` and its Java gameplay consequences are also absent.

World Liquor's custom disc uses a Script API jukebox adapter because
`minecraft:record.sound_event` only accepts built-in LevelSoundEvent enum values.
The original two audio files are included and a placed custom disc can be
retrieved with an empty hand. Client glass transparency, wall record angle and
animated furniture still need direct device review; a BDS startup cannot prove
visual fidelity.

## Build and validation

```sh
python3 tools/build_port.py
python3 tools/check_release.py
python3 tools/build_release.py
```

The load gate uses the real Bedrock Dedicated Server with public Cookery 1.0.6,
Tavern 0.6.37 and both packs of this add-on. No simulated interaction tests are
part of this project. See `docs/VALIDATION-0.1.3.json` for the exact result.

## Download

[Download 0.1.3 preview 1 (.mcaddon)](https://raw.githubusercontent.com/casama233/kaleidoscope-world-liquor-unofficial/v0.1.3-preview.1/downloads/Kaleidoscope_World_Liquor_Unofficial_0.1.3_preview1.mcaddon). Verify with `downloads/SHA256SUMS`.
