# Java parity repair — 2026-10-01, batch 1

## Source and scope

Base: `05ed8bd817e90d58c72d38d50b9c3375e9cfd752`, canonical World Liquor 0.1.31.
Candidate: 0.1.32, paired Tavern 0.6.69. No live-server installation.

Wall-record logic and tests adapted from PR #9 at `00496bcbfad31dc204c0d8d9f8ba265122157757`, reviewed against current main. Kept current `minecraft:connection_rule`; did not copy obsolete builder or historical normalization machinery. Added a separate fix and executable tests for the reload audio-cleanup bug that PR #9 did not fix.

Java mechanics reference: official World Liquor NeoForge 1.1.9 JAR, CurseForge file 8947041, SHA256 `3c3779945687be248d91ea919b1f72b40a66aeed40249a6049f55b0158b149ae`.
`MultiJumpFallDamageMixin` cancels falling damage; `ClientPlayerEntityMixinHooks` replenishes jumps on ground/climbable contact and rejects usable worn elytra. No new Java assets were imported.

## Functional verification

- 58 wall-record callback and geometry tests: 25 states, four orientations, synchronous/deferred placement, old/corrupt/missing data, duplicate callbacks, failed inventory/drop/block/storage writes, game modes and gamerule, stale scheduled placement.
- 6 audio cleanup tests: repeated post-reload cleanup, stale audio metadata on a wall, removed jukebox, unloaded chunks/corrupt rows, explosion ownership, drops disabled.
- 6 multi-jump tests: fall-only immunity and expiry, reverse-gravity preservation, mid-air acquisition, climbing refill, amplifier/expiry, usable versus broken elytra.
- `tools/check_release.py` passed with the paired Tavern tree: JSON/script syntax, 222 guide entries, fixed seven guide entrances, storage preservation/projection, creative catalog, native pick definitions, 4,372 rendered face checks.

These are isolated logic/API fixtures and static checks, not simulated in-game players, BDS gameplay, client acceptance or saved-world migration.

Run from this repository:

```
node --experimental-loader ./tests/wall-record-loader.mjs --test tests/wall-record.test.mjs
node --test tests/record-audio.test.mjs tests/multi-jump.test.mjs
TAVERN_ROOT=/absolute/path/to/tavern python tools/check_release.py
python tools/test_baseline_gate.py
```

## Remaining gaps

- Full ItemStack persistence for wall records, exact sturdy-face support, audio channel release and native comparator output remain open.
- Cabinet display classification, external cellar redstone, freezer automation, other effect parity, new Highball content and cross-mod features remain open.
- New upstream asset licensing discrepancy remains unresolved; this batch does not import those assets.
- Cloud direct SSH failed DNS resolution for the supplied server hostname, including the approved network retry; no server session opened.
- Native BDS validation recorded separately after this source commit. Production requires native/client/saved-world verification and an exact family receipt.

The historical reconciliation file updates exact current hashes only, retaining original preimages. Historical snapshots are never used for packaging; runtime and append-only release identity are checked independently.
