# 世界名酒 0.1.68 測試候選版

Companion for Tavern 0.6.107's shared-gesture handling and effect HUD candidate. Both behavior and resource packs require the matching Tavern 0.6.107 UUIDs. Exact approved public host source is pinned to e596b958ee3217376b9536e72dd14038504365d7.

World Liquor's sole functional runtime change adds explicit sibling scope to the 480 image view bindings reading kwl_effect_data in its existing namespaced effect panel. The title packet, prefix, cache predicate, icon positions, textures, timing and native HUD root controls are unchanged. This is a targeted scope hypothesis; native visibility remains pending.

Other gameplay, scripts, recipes, all 56 shaker descriptors, 14 shaker recipes, furniture and assets remain identical to public 0.1.67. BP/RP/module identity, paired dependencies and the guide protocol advance together. All owned pack and module UUIDs remain unchanged, and old release history and published packages are preserved.

## Verification and limits

- This is a Git-first checkpoint. Exact baseline/package, HUD scope/generation and required paired-source CI checks will follow
- The previous native 0.6.106 / 0.1.67 test observed enabled active drink effects with missing icons, including a positive-duration title probe. This change does not claim a native visibility pass until the exact candidate is tested
- Full-pair client acceptance, saved-world migration, full-family admission, full Java parity and production readiness remain pending
- No live deployment, new BDS test or simulated player acceptance is claimed
- Unrelated held-placement behavior, external RGB flat shading, audio availability and exact Java camera-only Slightly Tipsy roll are outside this companion change

The existing 0.1.67 publication request stays unchanged until the parent approves the final exact pair for publication.
