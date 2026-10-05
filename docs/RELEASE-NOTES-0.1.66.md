# 世界名酒 0.1.66 測試版

Dependency-only companion for Tavern 0.6.105. Both behavior and resource packs require the matching Tavern 0.6.105 UUIDs.

World Liquor retains public 0.1.58 gameplay, scripts, recipes, all 56 shaker descriptors, 14 shaker recipes, furniture and assets. Only paired dependencies and release/protocol identity advance; all owned UUIDs remain unchanged. Exact host source is pinned to d0f6f480691a024994d76f60d286aef15439d4bc.

The earlier 0.1.65 candidate remains frozen with its Tavern 0.6.103 dependencies and historical fingerprints. This release does not recover previously unpublished World Liquor functional changes.

## Verification and limits

- Exact source CI passed: Tavern [13 jobs](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37389187596), World Liquor [4 jobs](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37389243802)
- Minecraft 1.26.52.3 native client: colored HUD/progress appeared and expired; three actual wine inputs produced a shaded magenta signature drink; actual ice_tea_q4 + red_queen_q4 + vodka_q4 shaking, serving and pickup produced a Bloody Mary with its hotbar name verified
- Native Java-red atlas liquid retained textured shading. External pure-red fallback rendered red with flat shading
- Exact paired BDS cold load and normal restart passed with exit code zero and no console/content errors. This was a new isolated test world, not existing saved-world migration or full-family admission
- After native testing, all four installed pack trees matched the frozen archive bytes (Tavern BP 802/RP 3,153 files; World Liquor BP 305/RP 511 files), with exact world pack versions
- No simulated players were used. This is bounded test coverage, not full Java parity or production readiness

## Known issues

- In the tested 0.6.105, the first-person shaker and arm were invisible at rest and while using. Relevant source is unchanged from main 0.6.95; a native 0.6.95 comparison was not run, so this is not proven to be a newly introduced regression
- SPACE_NOT_CLEAR and STALE_HAND warnings were observed during held-placement attempts, while placements also succeeded. Their cause is unproven
- External out-of-domain RGB uses flat overlay shading and is not Java pixel-equivalent
- Audio was unavailable because the test environment had no ALSA device
- Not all recipes or first-/third-person states have been tested; no clean-client-log or exact expiry-deadline claim is made
- Exact Java camera-only Slightly Tipsy roll remains unimplemented

Full client acceptance and full Java parity remain pending. This prerelease does not deploy to a live server.

## Exact package

- Accepted World Liquor source: 5e8967ebcfa16f80637efdf08cf2ff8d2270b16b
- Archive: Kaleidoscope_World_Liquor_Unofficial_0.1.66_preview1.mcaddon
- SHA256: ec5bd4c2a971c934b170e6fbbdb89c12d00e22133b0590b4d86096903458862d
- 6,774,754 bytes; 816 canonical runtime files

[Detailed bounded validation](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/PUBLIC-TEST-VALIDATION-0.1.66.json)
