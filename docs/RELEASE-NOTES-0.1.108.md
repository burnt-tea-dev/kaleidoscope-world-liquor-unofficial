# 0.1.108 candidate: pair Tavern 0.6.131 and recognize Grilling's additional displays

World Liquor's BP, RP, module versions, package identity and shared guide payload
advance together to 0.1.108. Both packs require Tavern 0.6.131. Install both BP/RP
pairs together. Grilling 2.8.118 remains an optional family peer.

The candidate runtime identity is frozen. Final public source pins, paired CI
results and the exact exported archive are recorded before publication. Native
engine, human client and deployment evidence remain separate gates.

## Exact dependencies

The Tavern UUIDs below were read from the actual T131 candidate manifests.
World Liquor retains its existing pack and module UUIDs.

| Pack | Own UUID and version | Tavern dependency |
| --- | --- | --- |
| BP | `355ffdfc-50e6-5a33-a126-4d78ab955b2b`, `0.1.108` | `f54f37f9-485a-55bf-8f89-6558aca988c5`, `0.6.131` |
| RP | `a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8`, `0.1.108` | `c2990d50-2cf7-59f7-886a-0f2d0240d156`, `0.6.131` |

The BP's dependency on its own RP also advances to 0.1.108. Bedrock/BDS
1.26.50+ and the existing stable Script API requirement remain the declared
engine/API contract. The existing seven-section Tavern guide continues to own
the product and equipment navigation contract.

## Shared Respawn helper repair

Grilling G118, commit `f7bd2d26367c113ab8881bc67e9f5e69624917ff`, adds two display
entities that the previous World Liquor helper list did not recognize:

- `kaleidoscope_grilling:plate_food_visual`
- `kaleidoscope_grilling:recipe_icon_visual`

Their canonical entity definitions have `physics.has_collision=false`, a
zero-width/zero-height collision box, and no component-group collision
overrides. The exact IDs now join the reviewed helper list, bringing Grilling's
count to 10 and the family count to 87. These displays no longer turn an
otherwise eligible shared-spawn Respawn scene into an unknown-entity rejection.

Unknown entity IDs still fail closed. The added fixture checks both displays
together and then adds an unreviewed Grilling ID to verify that the rejection
also prevents teleport/effect mutation. Existing native storage-carrier and
metadata-preservation fixture coverage remains in the same suite.

World Liquor's exported gameplay change is limited to these two helper IDs.
The other exported edits are the coordinated version and dependency declarations;
payload recipes, effects, registration data, storage behavior and assets retain
their existing content.

## Verification and remaining gates

| Scope | Evidence/status |
| --- | --- |
| Helper source/API fixture | `tests/respawn-family.test.mjs`: 6/6 passed for the helper repair, using actual Tavern source and exact G118 source definitions. This tests script behavior with API fixtures. |
| Candidate identity preparation | Own pack/module/package/payload versions and both Tavern UUID/version dependencies are checked together; the payload comparison excludes only its version field. |
| Frozen release and public source pins | L108/T131 identities are frozen in baseline/history. Tavern source `b277d565a1bb67e55091d82f9cfde5542ccedf9d` includes the exact T131 review witness; G118 is pinned above. Final archives retain their actual runtime digests. |
| Native/BDS and saved-world rehearsal | Pending for the L108/T131 candidate. |
| Actual Player input, rendered client/audio and live deployment/readback | Pending. `client=false`, `production_ready=false`, pending human acceptance. |

The fixture evidence covers helper classification and bounded shared Respawn
behavior. It does not establish native Player spawn/bed/anchor lifecycle,
arbitrary third-party collisions, or complete World Liquor Java parity. T131's
host-side interaction and presentation repairs retain their own scoped evidence
and client acceptance requirements.

The historical T130/L107 BDS probe remains evidence for that earlier exact pair.
No old BDS, client or live success is assigned to L108/T131. Final integration
and publication records must name the actual reviewed public T131 commit and
the real exported archive hash. The standing-authorized live workflow still
requires canonical review/checks, family admission, a consistently stopped-world
backup, saved-world rehearsal and exact-package readback.
