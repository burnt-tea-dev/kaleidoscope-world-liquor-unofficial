# World Liquor 0.1.153

Pair both World Liquor packs exactly with Tavern0.6.176. Grilling2.8.155 remains an optional source-check peer, without adding a hard runtime dependency. This successor preserves the existing W152 candidate and advances only these exported identities:

- `BP/manifest.json`: paired package/modules, own RP and Tavern BP dependency versions.
- `RP/manifest.json`: paired package/module and Tavern RP dependency versions.
- `BP/scripts/payload.js`: only protocol `version`, from0.1.152 to0.1.153.

All other exported bytes and every functional payload field are conserved against W152 source `ddff7b599b3771b3770a86e1b813dd196ed074c7`. This retains W151's Java collision/selection restoration and earlier freezer material registry, animation, guide, recipe, effect, persistence, model, texture and sound repairs. Historical source/native/client evidence remains bound to its original candidate.

The current Java review remains open by Minecraft/loader branch: Forge1.20.1 file9217901, NeoForge1.21.1 file9217896 and the separate26.1.2 file9087098 require adaptation. W153 changes no unreviewed Java recipe or effect and does not claim complete Java parity. Treasure Guide mob-drop duplication retains the owner's existing deferral; pudding bowl, native effects and current rendered-client gaps remain in [PARITY-MATRIX](PARITY-MATRIX.md).

Exact T176/G154 canonical source commits must be filled in the integration/publication metadata before PR checks and publication. Release freeze, canonical CI, guarded package verification, complete-family native/saved-world gates and actual client acceptance retain separate results. This preparation does not claim a new build, BDS run, migration, LIVE deployment or human acceptance. `publication_request=false`, `bds=false`, `client=false`, `production_ready=false`.
