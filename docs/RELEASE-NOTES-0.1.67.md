# 世界名酒 0.1.67 測試版

Dependency-only companion to Tavern 0.6.106's first-person held-shaker visibility hotfix. Install this matching pair; older 0.1.66 / 0.6.105 archives stay immutable.

## Change

Update own pack/module identity to 0.1.67, Tavern dependencies to 0.6.106 and guide protocol version. Only BP/RP manifests and the guide payload version changed: 813 of 816 runtime files match 0.1.66 byte-for-byte. All UUIDs, functional scripts/assets, 56 shaker descriptors and 14 recipes are preserved.

## Verification and limits

- Exact source/runtime/archive preservation and baseline identity checks passed; all [4 CI jobs passed](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37393117417)
- Exact 0.6.106 / 0.1.67 native pair cold-load passed: filled first-person shaker visible, ice_tea_q4 given with Iced Black Tea name/icon/held bottle, then shaker visible again after slot selection. Normal save/quit completed
- All four installed pack trees exactly matched the frozen archives, with exact world pack versions. Tavern 0.6.106 also passed bounded standalone empty/filled/use-release/progress-expiry/third-person checks
- No new BDS run for this pair; prior 0.6.105 / 0.1.66 BDS evidence stays separate
- Placement STALE_HAND and earlier SPACE_NOT_CLEAR warnings have an unproven cause and are not claimed resolved
- External out-of-atlas RGB retains disclosed flat overlay shading
- No audio, full-frame/all-waveform, all-FOV/skin, full Java parity, saved-world migration or full-family admission claim

This is a public test prerelease. Full client acceptance remains pending. No production readiness or live deployment is claimed.

## Exact package

- Accepted source: 68d53e4901b0d09d58844ea9135602d86a57e1de
- Pinned Tavern source: 898aee05f57d051627b8a00314250d35343e5309
- Archive: Kaleidoscope_World_Liquor_Unofficial_0.1.67_preview1.mcaddon
- SHA256: 92fa4f16682078739fd0d44e7ad1b368bad89f06feb06b57105c46f377ebc25e
- 6,774,753 bytes; 816 canonical runtime files

[Detailed bounded validation](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/PUBLIC-TEST-VALIDATION-0.1.67.json)
