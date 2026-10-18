# Evidence-backed tooling cleanup, 2026-10-19

Scope: World Liquor source at `32998e1157a5de1f84fdb268be168b28b1573e13`, after repository transfer. The deletion decisions below were recorded before removing their targets. [The exact inventory](CODE-CLEANUP-20261019.json) binds the original files and retained coverage. This is a tooling/test cleanup; exported runtime, versions, release-history and installed packs are unchanged.

## Retire the duplicate respawn implementation

`development/respawn/respawn-source.js` is a 163-line development copy of the pure rules now exported by `runtime/BP/scripts/respawn-adapter.js`. A bounded search of current tools, tests, workflows, development and README found one code consumer: `tests/respawn-source.test.mjs:4`. The production module has the same pure-function segment, with production dependency imports and an on-demand indexed sine calculation replacing the development copy's 65,536-entry first-use table.

The existing test already runs 60 independent JVM vectors against both copies. Its other four cases only import the development copy. Redirect every import to production and remove the duplicate vector pass before deleting the copy. Keep all five tests, `tests/fixtures/JavaRespawnOracle.java` and `tests/fixtures/java-respawn.jsonl`. This preserves the independent expected values and extends production coverage to strict bed/anchor candidate order, partial floors, forced spawn and shared-spawn fallback. The in-memory proposed redirection passed all five cases before the source deletion. `tests/respawn-runtime.test.mjs` retains the separate production adapter lifecycle coverage.

## Retire the W28-only candidate packager

`tools/family_candidate.py` reads only the fixed W28/T64 `compat/family/candidate.json`. Current README, workflows and Tavern family tooling have no caller; its only documentation references are the historical `docs/FAMILY-COMPAT-BATCH1.md` and `docs/RELEASE-NOTES-0.1.28.md`. Running `python3 tools/family_candidate.py --no-syntax` on the reviewed W153 source fails at its line 20 version assertion before any write. Updating this obsolete profile would create a second packaging/admission route.

Delete the script, but retain `compat/family/candidate.json` and both historical documents unchanged. Their commands describe that historical checkout and remain reproducible using this audit's source commit. Current packaging is `tools/build_release.py`, with canonical baseline checks and full archive-to-runtime verification; family assembly/admission stays in Tavern's canonical `family_bundle.py`/`family_guard.py` and update entrypoint. A failed obsolete command is not a gameplay failure or a reason to remove a gameplay test.

## Run collision shape validation once

`tools/check_release.py:15` launches `tools/collision_shapes.py` with no arguments; its `main()` calls `check_shapes()` and prints a JSON summary. The immediately following `tools/test_collision_shapes.py` calls exactly the same zero-argument `check_shapes()` in `test_all_original_shapes_and_freezer_rotations`, then checks immutable-field preservation, rejected mutations and chair-union behavior. Neither invocation changes runtime. The first invocation has no separately saved artifact consumer.

Remove only that redundant subprocess invocation. Keep `collision_shapes.py`, including its optional original-author-archive/bytecode verification, and every collision test. This removes duplicate work without changing the existing release check's required behavior.

## Retained boundaries

Do not delete `development/elbow/*`, the independent full-state development block catalog, native probe/trace evidence, Java oracles, wall-record generation checks, historical payload projections or any required workflow job. These have distinct current consumers or documented unresolved parity evidence. The prior seven-day CI estimate describes optimization opportunities; it does not establish that these tests are obsolete or quantify this small cleanup's savings.

Validation of the edited tree is recorded in the companion JSON. Local checks are targeted; required PR CI remains authoritative for the full suite. No BDS, player/client acceptance, pack publication or deployment result is claimed by this audit.

After editing, direct execution of the existing respawn source tests passed 5/5, production respawn adapter tests passed 16/16, and collision shape tests passed 4/4. `git diff --check` passed. The respawn source tests still evaluate all 60 independent JVM vectors. No new test or gameplay behavior was introduced.
