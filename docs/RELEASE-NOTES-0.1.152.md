# World Liquor 0.1.152

Pair World Liquor exactly with Tavern 0.6.175. W151 requires Tavern 0.6.173; leaving that dependency in a T175 family fails exact dependency closure. W152 advances the existing BP/RP identities and modules without changing UUIDs, updates the own-resource dependency and both Tavern dependencies, and synchronizes the payload version required by the existing release verifier.

The only changed exported files are:

- `BP/manifest.json`: release/modules and exact own-RP/Tavern BP dependency versions.
- `RP/manifest.json`: release/module and exact Tavern RP dependency version.
- `BP/scripts/payload.js`: only `version`, from `0.1.151` to `0.1.152`.

All other 890 exported files are byte-identical to W151 at `b86923801febbf23a43f36017ad299b28128b029`. The complete payload is byte-identical after normalizing that one version string. This preserves the W151 collision repair and all gameplay, guide text/data, recipes, quantities, timings, effects, saved ownership, models, textures, materials and audio. W151 and earlier history entries remain unchanged. Grilling is an optional source-check peer, not a new installed dependency. The target peer is 2.8.153; final Tavern tooling and Grilling source pins remain pending. The currently retained Grilling 2.8.150 pin is historical and provisional. This local immutable runtime anchor must receive a metadata-only pin update and final exact-peer checks before publication.

See [identity and conservation evidence](evidence/w152-t175-pairing-20261017.json). Source/pairing/archive checks do not establish full Java parity or client rendering. Complete-family native and saved-world gates require their own evidence. Human client acceptance remains pending, `client=false`, `production_ready=false`; no automatic publication or LIVE action is requested.
