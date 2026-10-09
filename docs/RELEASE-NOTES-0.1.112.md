# 0.1.112: exact Tavern T135 dependency

World Liquor now requires Tavern 0.6.135. Both pack headers, modules, the own
RP dependency, package identity and guide payload advance to 0.1.112. Existing
pack and module UUIDs remain unchanged; no saved identity migration is introduced.
Optional Grilling remains at the reviewed 2.8.119 pairing.

This is a dependency and package identity update only. All W111 gameplay,
recipes, effect data, guide content, freezer input preservation, geometry,
textures and sounds retain their exact bytes except for the two manifests and
the payload version string. W110's current-author Dassai corrections, four
coupled cocktail models and authored inventory sprites remain intact, together
with their source-art checks and immutable predecessor witnesses.

W111 and W110 retain their original frozen identities and release-history
entries. W111's successful source/package checks do not substitute for the
T135/W112 candidate's required validation or erase T134's failed host checks.
The new identity is not assigned to a changed W111 archive.

The integration and release-request records pin reviewed Tavern T135 source
`10453aea0fedc4d054562239d9c31daf138c24a9`. This complete peer includes exact
preservation witnesses for the host’s one new functional file and 25 asset
files; its runtime was frozen at `4d4b1e390eb6aad23587b28bf3d9aa8bb7192287`.
Grilling remains pinned to `b010ec2a6709ada74ed96ead19c60da4e0bc2789`. The
W112 archive SHA256 is
`b30150aacd2b261acc00fbf8015aeecd02f759f10adebeb74703b2c350724ca8`. This is a
prerelease publication request; all existing source, checksum and publication
gates remain required. The new T135/W112 paired CI was still pending when this
metadata was prepared.

The standard version, immutable-baseline and clean package checks cover the
changed identity and dependency. Full paired CI uses the pinned T135 source.
Native BDS loading, saved-world preservation, family admission, LIVE deployment
and human rendering/interaction acceptance require their separate evidence.
Keep client=false, production_ready=false and pending_client_acceptance until
real acceptance. No new complete Java parity claim is made by this update.
