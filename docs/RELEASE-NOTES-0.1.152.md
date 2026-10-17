# World Liquor 0.1.152

Pair World Liquor exactly with Tavern 0.6.175. W151 requires Tavern 0.6.173; leaving that dependency in a T175 family fails exact dependency closure. W152 advances the existing BP/RP identities and modules without changing UUIDs, updates the own-resource dependency and both Tavern dependencies, and synchronizes the payload version required by the existing release verifier.

The only changed exported files are:

- `BP/manifest.json`: release/modules and exact own-RP/Tavern BP dependency versions.
- `RP/manifest.json`: release/module and exact Tavern RP dependency version.
- `BP/scripts/payload.js`: only `version`, from `0.1.151` to `0.1.152`.

All other 890 exported files are byte-identical to W151 at `b86923801febbf23a43f36017ad299b28128b029`. The complete payload is byte-identical after normalizing that one version string. This preserves the W151 collision repair and all gameplay, guide text/data, recipes, quantities, timings, effects, saved ownership, models, textures, materials and audio. W151 and earlier history entries remain unchanged. Grilling is an optional source-check peer, not a new installed dependency. The finalized optional peer is Grilling 2.8.153 at `9e27ec700eea5a56e4dea277e4535cf46f238db0`; Tavern 0.6.175 is pinned at `a636158d53442b39b0aaa51d84d4a20fff93c4b4`. This metadata-only finalization preserves the W152 runtime anchor at `5efa46e85cf2449cd1d0f7be105546119374368d`, its one-time freeze and archive SHA256 `e4ef8235e113dbe6f29c6958dbd5c08d10aa6dc765dedeb6b1745d2e37208f2b`. Exact-peer local source checks and canonical CI retain their own results; neither establishes release or deployment readiness.

See [identity and conservation evidence](evidence/w152-t175-pairing-20261017.json). Source/pairing/archive checks do not establish full Java parity or client rendering. Complete-family native and saved-world gates require their own evidence. Human client acceptance remains pending, `client=false`, `production_ready=false`; no automatic publication or LIVE action is requested.
