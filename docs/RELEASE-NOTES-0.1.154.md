# World Liquor 0.1.154

Pair both World Liquor packs exactly with Tavern 0.6.177. Grilling 2.8.155 retains its existing optional source-check anchor and is not a hard runtime dependency.

This bounded W153 successor unifies owned guide and placed bottle/cup labels with the shared Tavern terminology contract. It uses the existing guide/API projection; it adds no separate adapter or private overlay. The package, BP/RP module, own RP dependency and payload version advance to 0.1.154 together, and the required Tavern BP/RP dependency versions advance to 0.6.177 with their UUIDs unchanged.

The source predecessor is W153 main `e7b8d30eb954abb826c921dec46a776d51890efb`. Recipes, quantities, timing, effects, storage behavior, collision and visual/audio assets are preserved. Prior freezer, collision and other functional repairs remain in place. Historical release notes, baseline witnesses and release-history entries retain their original identities and evidence scope.

The existing Java adaptation gaps remain separate; this terminology change does not claim new Java mechanics or complete parity. Treasure Guide mob-drop duplication retains the owner's existing deferral. Pudding bowl, native effects and current rendered-client gaps remain in [PARITY-MATRIX](PARITY-MATRIX.md).

Freeze and the exact T177 source commit must be recorded before final paired source checks. The integration metadata temporarily retains the T176 predecessor commit with `peer_pins_final=false`; the Grilling 2.8.155 anchor remains unchanged. Canonical PR checks and package verification are distinct from full-family admission. Whole-family publication and deployment remain blocked pending their separate gates.

No new BDS run, saved-world migration, LIVE deployment or human-client acceptance is claimed. `publication_request=false`, `publication_ready=false`, `bds=false`, `client=false`, `production_ready=false`.
