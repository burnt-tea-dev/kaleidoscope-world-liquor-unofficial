# 0.1.115 candidate: current guide and Tavern parity pairing

W115 starts from canonical W113 commit
`beda960c242b3b98a6b69e8950486ab5c6a44564`. It prepares both packs for
Tavern 0.6.137, which integrates the parity repairs with the latest shared
guide and corrects saved native-effect replay ownership. World Liquor's own
runtime changes are confined to the two manifests and the payload version:
headers, modules and the own RP dependency become 0.1.115; the two Tavern
dependencies become 0.6.137. Pack and module UUIDs remain unchanged.

All 67 canonical W113 guide entries, including their English, Simplified
Chinese and Traditional Chinese copy, remain byte for byte intact. No guide
generator is rerun. Recipes, quantities, effect records, native freezer
storage adapters, models, textures and sounds retain their current bytes.
W110's Dassai Q3–Q6 Luck data and four coupled cocktail surfaces remain
preserved. Comparison with the earlier completed World Liquor integration
found no missing gameplay repair: only the newer canonical guide pages
differed in runtime. This update therefore does not import the obsolete
integration's payload, lock or conflicting unmerged W113 identity.

The current Grilling source-check pairing remains G121, version 2.8.121,
commit `2b422458ebfdd3831bc7a57af30c24cfa211d23a`. It is not reverted to G119
or G120. Grilling remains optional for installed World Liquor gameplay.

Integration and release-request metadata pin reviewed
[T137 source `d6bfb01451cfb016630b756dca15cc4c0bdda830`](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/d6bfb01451cfb016630b756dca15cc4c0bdda830).
Its complete reviewed tree is
`90b1c3a13e5e2e6d9fd76b7fac233de4dba9b700`; its frozen runtime source is
`a360fe0e2970c65ee0cfad6ad8d08f86f6cbcbf5`. The request uses W115 identity
and prerelease tag `v0.1.115-preview.1`. The archive checksum is recorded from
the actual clean build, not copied from an earlier candidate. This source pin
and publication request do not waive CI, native or client acceptance gates.

W115 has a new frozen release identity. The older W114 claim and frozen
worktree are preserved, and all pre-existing canonical release-history
entries remain unchanged. Its frozen BP contains 339 files with fingerprint
`583c2db3f5c232e702473769ade746b01a82737491a07fb99dc2321c66b335f6`;
the RP contains 549 files with fingerprint
`7f9a35c09f247fcb95ab602e464886efcf0ab03ed88da1ffa136e76ce504e4a2`.
These fingerprints identify runtime content; they do not establish functional
or rendered-client parity.

Earlier unmerged T136/W113 paired native evidence remains scoped to that
older candidate: all 18 first-phase cases passed, then six restart cases
passed before saved aura restoration failed. The failure traced to the
engine replaying a saved native effect after entityLoad, which the previous
observer treated as an external refresh. T137's repair uses a strict native
load sequence and does not turn that historical failure into a success.
Its conditional player callback repair is not human reconnect or rendered
client acceptance.

New W115/T137 guide checks, remote CI, native restart and saved-world
migration remain pending. Keep `new_bds_test=false`, `client=false`,
`production_ready=false`, `live_deployment=false` and
`pending_client_acceptance` until their respective evidence exists. Package
identity and source preservation alone do not certify complete Java parity,
human rendering, audio, input behavior or the separate NeoForge 26.1.2 branch.
