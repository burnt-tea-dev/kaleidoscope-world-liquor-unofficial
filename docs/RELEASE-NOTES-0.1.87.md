# World Liquor 0.1.87

Respawn now uses the Java 1.21.1 bed, respawn-anchor and shared-spawn resolver
in the actual production effect callback. It removes the unsupported Native
`Block.isSolid` floor check and the radius-3 / six-block upward replacement.
Candidate order, strict/non-strict stages, queried source geometry, source yaw,
anchor debit and source sound / Hunger order are preserved for resolved cases.

The port owns an explicit constructor-default Java border / Survival profile.
Validated Server script events let another pack declare that logical profile
and a real player's current source respawn metadata. Bed yaw is observed before
interaction and recorded only after a confirmed point / sleep transition;
ambiguous same-point retries invalidate differing stale facts. Unknown source
geometry or metadata returns quietly without a guessed candidate or HUD text.

Both pack headers/modules, the own BP/RP dependency, package, payload and
baseline advance from 0.1.86 to **0.1.87**. Tavern BP/RP dependencies remain
**0.6.120**, with checked canonical host commit
`df10f7734e2f4c3493f8afe0c52b570460994cfb`. Existing source, recipes, identities,
models, animations and audio remain preserved; the new resolver is additional
owned runtime, not a historical artifact injected at packaging time.

Focused API-shaped regression checks passed **15 runtime cases and 9 metadata
cases**. A real isolated BDS **1.26.51.1** observer passed four Native block/core
cases with zero errors and normal exit: stone, soul-sand UP face, charged Nether
anchor's first North candidate / source numeric yaw, and actual Native bed
direction/head projection. Its three source modules remained unchanged. The
sanitized observations and owned observer script are in Git; no private family
receipt, server world, engine tree or log is published. The earlier harness
attempt selected the wrong QA world folder, emitted no observations, and is not
counted as success.

These Native checks used **zero players**. They do not prove Native personal
spawn-point coordinates, real Player teleport phases, fallDistance reset or
client presentation. Historical yaw/forced, source RNG state, arbitrary addon
geometry and some dynamic/pose/entity facts remain explicit limitations. The
cross-pack profile/metadata events are available; executable block/entity fact
providers currently require same-pack integration. See
[source proof, implemented cases, limits and client comparison scenes](RESPAWN-RUNTIME-SOURCE-ADAPTER.md).

This is a development release. Full-family static/BDS, stopped-world migration
and family admission precede live deployment. `client=false` and
`production_ready=false` remain until actual user acceptance.
