# 0.1.113: concise World Liquor guide

All 67 guide entries now lead with their drink purpose or a short operation.
Freezer pages explain loading, cancellation, serving, redstone and moving the
machine. Food and mixer pages identify their effects and returned containers.
Recipes keep every ingredient, slot, quantity, liquid volume and preparation
time in the shared Tavern product view. Both guide entrances retain the fixed
seven-section navigation and complete English, Simplified Chinese and
Traditional Chinese copy.

Known player-visible limits remain explicit: native Luck loot changes,
through-wall outlines, creative flight, Elbow Strike and other incomplete
effects are not presented as working features. Numerical effect tables and
recipe lists no longer bury the ordinary operation text. The guide generator
uses owned copy and source-backed preparation records; no private author
scripts or alternative guide UI are included.

This candidate requires Tavern 0.6.136. Both manifests, modules, the own RP
dependency, package identity and guide payload advance to 0.1.113. W112 recipes,
effect records, models, textures, sounds, freezer storage adapters and saved
pack/module UUIDs remain intact. W110's current-author Dassai correction and
four coupled cocktail surfaces remain preserved. Existing historical release
records and validation reports are unchanged.

Paired source checks pin Tavern T136
`c8b4ecba641b683f011553ea3ba61e298758d0f0` and Grilling G121
`2b422458ebfdd3831bc7a57af30c24cfa211d23a`. T136 starts from the canonical
T132 gameplay baseline and adds the shared guide changes; the separate T135
PR302 remains unmerged and is not included. W112's runtime differences from
W110 were confined to manifests and the payload version, so retained W112
World Liquor gameplay introduces no dependency on the unmerged host changes.

The [paired guide data report](GUIDE-VALIDATION-0.1.113.json) covers the 223
entries, complete preparation data, translation and fixed navigation. Remote
CI, family BDS and saved-world migration evidence remain separate gates.
The package freeze and text review do not certify rendered client behavior.
Keep client=false, production_ready=false and pending_client_acceptance until
human acceptance. Full Java parity and the separate NeoForge 26.1.2 branch
adaptation remain incomplete.
