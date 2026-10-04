# Reviewed World Liquor recovery candidate

Base: `5ef51d75f8f477a40f3b6d7db4fb678566967574` (main, PR #35).
Recovered source: `dcd395f5211c6c49f47aaff4a5423f32b57322d7`
(`fix/compact-textures-paired-0155`, including `ea8481a` and `768ed0c`).

## Integration boundaries

- Keep the Java-held repair from `970556ed61167a3292c07dbbc4c953625b860991`
  already present in main. Keep later item views, freezer/face geometry, original
  effect sprites, namespaced optional HUD controls, native cabinet pairing and
  seven-entrance guide readability checks from main.
- Recover the twelve byte-identical PNG path renames and all JSON references,
  source converter normalization and strict texture preservation regressions.
- Recover Java 1.1.9 respawn search order, Crazy audio pitch, Ground Crit eligibility
  and Elbow Strike audio volume, with the existing production-function fixtures.
  Stable API collision/fall-distance/knockback limitations remain explicit.
- Keep Tavern pinned to `8d00a9c0399ab3812fa161a39c9254aed21876f2` (0.6.94).
  The later successful `b41341e`, `bb875d9`, `c643225` chain is host work for root
  to reconcile and freeze separately. No subtitle experiment or new HUD transport
  is imported by this candidate. Existing title transport is not certified here.
- Use World Liquor 0.1.59. Versions 0.1.54 and 0.1.56 have divergent retained
  histories (0.1.55 also diverges); their complete Git-backed identity variants are recorded separately
  in `RECOVERY-HISTORY-20261004.json`. Main's release-history rows remain unchanged.
  Version 0.1.58 is reserved for the reported lost staging, not claimed recovered.

## Verification and handoff

Run repository baseline/claim/workflow/bridge regressions; guide and storage
regeneration must preserve canonical source. Run all existing callback fixtures,
resource/Java-art/texture/guide/creative/SDK checks and paired host projections.
Freeze the new identity without deleting or rewriting any conflicting claim.
After committing, require the clean release gate and deterministic packager,
development archive entry verification and an identical second build hash.

Windows validation exposed two existing authoring/check portability defects.
Canonical guide, storage, wall-record and compact-reference generators now write
UTF-8 with explicit LF, preserving byte-level tests across platforms. Python
child checks now use `sys.executable` so a broken Store `python3` alias cannot
select another environment. No assertions or source-converter bytes are changed.

Cross-platform CI confirmed identical exported entry bytes but different ZIP
hashes: Python's default `ZipInfo.create_system` is 0 on Windows and 3 on Linux.
The canonical packager now explicitly sets 3, matching its existing Unix file
permissions. Rebuilding with this sole metadata correction reproduces the Linux
archive SHA256 on Windows. Runtime fingerprints and the frozen 0.1.59 identity
remain unchanged; the candidate has never been published.

The existing 0.1.52 publication request remains unchanged and must continue to
fail for this different candidate. No release hash assertion is relaxed.
No native BDS, saved-world migration, or rendered client acceptance is claimed.
Root owns full-family pairing and actual client verification before production.
No merge, publication or live operation is authorized for this delegated checkout.
