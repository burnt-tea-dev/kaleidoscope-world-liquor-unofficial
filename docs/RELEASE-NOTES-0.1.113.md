# 0.1.113: exact Tavern T136 dependency

World Liquor now requires Tavern 0.6.136. Both pack headers, modules, the own
RP dependency, package identity and guide payload advance to 0.1.113. Existing
pack and module UUIDs remain unchanged; no saved identity migration is introduced.
Optional Grilling remains at the reviewed 2.8.119 pairing.

This dependency and package identity update pairs with Tavern's repair for
native status effects whose remaining duration can pause while the script tick
continues. Exact canonical-scene BDS diagnostics found the T135 aura lease was
incorrectly revoked in that situation. W112's successful source/package checks
remain evidence for W112 and do not erase the failed T135 native observation.

All W112 gameplay, recipes, effect data, guide content, freezer input
preservation, geometry, textures and sounds retain their exact bytes except
for the two manifests and payload version string. W110's current-author Dassai
corrections, four coupled cocktail models, authored inventory sprites and
source-art checkers remain intact. W112, W111 and W110 retain their original
frozen identities, release-history entries and preservation witnesses.

The integration and release-request records pin
[reviewed Tavern T136 source `7ad4f5849edce3eda23b7aaad7fa171b9c0604de`](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/7ad4f5849edce3eda23b7aaad7fa171b9c0604de).
Its runtime was frozen at
[source `c169a2072373b1feda12b08fdd741ed4ecdbc1ec`](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/c169a2072373b1feda12b08fdd741ed4ecdbc1ec).
Grilling remains pinned to `b010ec2a6709ada74ed96ead19c60da4e0bc2789`.
The W113 archive checksum is taken from a clean canonical build and recorded
in the release request. This is a prerelease publication request; every
existing source, checksum and publication gate remains required.

New paired CI and native BDS persistence checks remain pending. Saved-world
preservation, family admission, LIVE deployment and human rendering/interaction
acceptance require their separate evidence. Keep client=false,
production_ready=false and pending_client_acceptance until real acceptance.
This dependency update makes no new complete Java parity claim.
