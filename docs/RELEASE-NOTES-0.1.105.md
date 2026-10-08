# 0.1.105: family Respawn helper facts and current pairing

Shared-spawn Respawn no longer stops at loaded family storage/render helpers
whose owned definitions have no collision body. The runtime admits only 85
reviewed IDs: Tavern 56, World Liquor 21 and Grilling 8. Unknown same-namespace
and third-party entities still require known collision facts, and explicit
adapter callbacks retain priority. Valid personal bed/anchor/forced paths keep
their existing selection behavior; this is not a general death-respawn change.

The source check validates each actual peer entity definition, its empty box,
disabled collision and absence of a component-group collision override. API
regressions execute production freezer storage, Tavern native storage and
Grilling station storage followed by Respawn. Shared resolution succeeds with
the known helper while preserving its ItemStacks, metadata, entity and ledger;
an added unknown foreign entity still prevents teleportation.

BP/RP modules, guide payload and package use fresh W0.1.105. Both pack sides
require Tavern0.6.128 using the existing verified UUIDs. CI pairs that host with
Grilling2.8.117, which remains optional in the game.
`.github/baseline-integration.json` owns the exact source pins; CI checks out
both peers and runs the family regression in the existing package
job. It does not add a parallel job or repeat the helper-definition check.

The remaining reviewed PR36/37 tool changes use the current Python interpreter
and explicit UTF-8/LF output. Compact paths, source artwork, notices, recipes,
storage ownership, Java-effect repairs and the Tavern seven-entrance guide are
retained. The current six-draft disposition is in `docs/audit/PR-DISPOSITIONS.md`;
that source review is distinct from the actual GitHub PR state.

Existing targeted source/API and portability evidence is reused for unchanged
inputs. Current peer-definition, guide/pairing, workflow-contract and release
identity checks cover this final version change. No new BDS, actual Player,
rendered-client or LIVE acceptance is claimed here. Canonical PR/checks/merge,
full-family static/BDS and saved-world/admission gates precede the standing
owner-requested live development deployment. Keep `client=false`,
`production_ready=false` and `pending_client_acceptance` until human acceptance.
