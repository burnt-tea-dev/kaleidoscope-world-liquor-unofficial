# Published World Liquor installation correction

Audit date: 2026-10-18. This is current guidance for existing public downloads; historical tags and package bytes are unchanged.

## W141 TEST requires Tavern T163

Install **World Liquor 0.1.141 BP/RP with Tavern 0.6.163 BP/RP**. The immutable W141 tag's README installation section says Tavern 0.6.155, but both manifests in the actual W141 archive require **0.6.163**. Follow the manifests and this correction, not the old T155 sentence.

- [W141 preview release](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.141-preview.1)
- [T163 beta release](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.163-beta.1)
- W141 file: `Kaleidoscope_World_Liquor_Unofficial_0.1.141_preview1.mcaddon`
- Independently downloaded SHA-256: `3093e72ada4e00db3316ae96f25f8ec2b6c9e4059584359a6e4f71bc53ca6618`
- All 890 runtime files match tag commit `99f0a7db82757cc5eb5aa35540c6f796b3257113`.

安裝更正：W141 測試版必須同時啟用酒館 **T163** 的 BP 與 RP；歷史 README 的 T155 不符合此下載檔相依。

## W148 stable requires Tavern T170

The later [W148 stable release](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.148) requires both [T170](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.170) packs. Its actual file `Kaleidoscope_World_Liquor_Unofficial_0.1.148_baseline1.mcaddon` has downloaded SHA-256 `0449bedca6eeaca853a05f17aab58f78150365d2d3a50891957cf49dd8c0d3e6`; all 893 runtime files match tag commit `978c2594040555a668e842f3452d98a07973db34`. The older TEST release is not a recommendation to downgrade, and these Tavern pairings are not interchangeable.

The existing W148 Treasure Guide item-duplication warning remains applicable; this documentation does not fix or disable that behavior.

## Optional packs and assembly boundary

Cookery1.6.0 remains optional for World Liquor's rice-dependent preparation recipes; existing bottles can still be drunk and placed without it. Grilling is not a World Liquor runtime hard dependency. The packs declare minimum engine 1.26.50 and stable Script APIs from their manifests; declaration alone is not native acceptance.

If adding published Grilling G138 or G149, both require exact author Cookery1.6.0 BP/RP. Ordinary mcaddon import does not apply Grilling's declared Cookery host transformations. A public source assembler exists without private integration, but its historical example must be reconciled with the actual source lock:

- [T163 lock](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/0bad3a529c6e13b9123c0746430de71d8878a71a/family/upstream.lock.json) pins G137, not newest TEST G138.
- [T170 stable lock](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/3bd8f6ca285b5ef5f6e9abe962d12873dfae5752/family/upstream.lock.json) matches T170/G149/W148.

Choosing the newest TEST download from each repository does not prove a matching source assembly or complete family installation. Back up worlds and retain exact paired packs. Package/source equality does not establish native rendering, fresh-world progression, restart, saved-world migration or production readiness. Client acceptance remains pending.
