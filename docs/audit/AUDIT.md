# World Liquor Phase0 audit

Audited canonical source: `56314bac4683fd9ff5b4dd727b2c2ad691e83c5f`,
version0.1.103, paired with Tavern0.6.126 `ac4932b4` and optional Cookery1.6.0.
The owner requested execution of the reorganization brief by phases; changes to
owner rules still require separate approval. This report changes no gameplay,
old PR disposition, AGENTS or LIVE.

## Reproducible package

A fresh tracked checkout with no dist/node_modules successfully ran
`python3 tools/build_release.py`, producing the current0.1.103 mcaddon.
Tracked source remained clean. The packager reads committed runtime only.
This is release/build evidence, not Java mechanics or client acceptance.

Validation accepts `TAVERN_ROOT`, otherwise an adjacent `tavern-src`. The README's
`build_storage_visuals.py` and `rebuild_guide.py` are source mutations, not needed
for normal direct packaging. They write storage visuals and the guide payload;
the latter also creates another versioned guide report. Keep those commands
explicit and out of the ordinary build recipe.

## Findings

- Runtime48 JS files /11,674 lines; payload/content contribute8,783. The static
  relative-import graph has no cycles. `foundation.js` already delegates host
  storage and effect lifecycles; a data-oriented addon is partly implemented.
- Legacy state handoff exists; author UUID migration is separate offline family
  tooling. Do not describe all saved metadata as a mixed UUID gameplay migration.
- JVM numeric oracles and native engine probes exist. Respawn/Elbow development
  vectors must not count as current production implementation. API-fixture tests
  executing real production transactions can protect conservation and rollback.
- Current `runtime/` has no license/notice/credits files; the packager only exports
  runtime, so the shipped mcaddon omits the repository's notices. Existing own
  code is MIT, copied Tavern code BSD-3-Clause, assets CC BY-NC-SA4.0. Restore the
  proper boundaries instead of assigning one code license to all files.
- `NOTICE.md` still says Tavern requires Cookery; current host/addon integration
  makes Cookery optional. Historical source labels and installation steps belong
  outside the current README.
- One historical mcaddon is tracked in downloads; remove it from the current tree
  only after ensuring its Release remains available. Do not rewrite Git history.

## Evidence and follow-up

[TEST-AUDIT.md](TEST-AUDIT.md) classifies each discovered test/oracle/probe/gate,
with player behavior, oracle, production versus development and mutation scope.
Counts and checksums are inventory/release facts, not completion percentages.

[PR-DISPOSITIONS.md](PR-DISPOSITIONS.md) retains useful unmerged differences and
records recommendations rather than closing everything by old version number.
[BUGS.md](../BUGS.md) and [PARITY-MATRIX.md](../PARITY-MATRIX.md) record current
player behavior separately from historical limited engine/client evidence.

The companion Tavern audit contains the shared seven-hypothesis findings and
owner-rule proposal. Prefer T1, T2, then W1: one bottle through brewing, storage,
drink/reload plus one freezer recipe. Its models, glass, icons, sound and real
input require paired-client evidence; a startup marker cannot certify them.
