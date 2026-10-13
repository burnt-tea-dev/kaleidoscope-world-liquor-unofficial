# Java numerical behavior with smaller runtime initialization

The maintained gameplay reference remains World Liquor NeoForge 1.21.1,
author 1.1.11 / CF9066406. The BSM read-only author check at
2026-10-12 22:23:03 UTC still identifies that release and Forge 1.20.1 /
1.1.12 / CF9066402 as current in their respective branches. NeoForge 26.1.2 /
CF9087098 remains separate: its custom Luck, BlockDrops and registration rules
are not substituted into the maintained gameplay branch.

The previous motion module filled a 65,536-entry Float32Array with `Math.sin`
during import, even when nobody jumped. Sprint jumps now compute only the two
requested, already quantized Java LUT indices, with the identical expression
and float rounding. There is no growing cache or deferred full-table build.
The respawn adapter's separate first-use full sine-table build is removed in
the same way; its index saturation and float arithmetic remain unchanged.
The original development implementation is retained as a source comparison.

The old runtime respawn catalog repeated the block ID and property names in
every one of 26,684 state keys. It also searched both complete state maps the
first time each block type was queried. `tools/respawn/build_numeric_catalog.py`
now emits a 720,833-byte runtime catalog grouped by block, with property-domain
indices and the original shape/flags/fluid columns. The approximately 2.79 MB
full named catalog remains in `development/respawn` and the source facts remain
in `data/java-parity`; neither diagnostic source is removed. Runtime queries
read only the requested block's rows. Row order, collision facts, missing-state
consensus and rejection of unresolved dynamic geometry are retained.

Targeted source evidence:

- All 65,536 float sine values compare exactly with the previous table; module
  evaluation makes zero sine calls, a sprint jump makes two and an ordinary
  non-sprint jump makes zero. The existing 92-row executed Java motion oracle
  and production multi-jump callback checks pass.
- The existing 60-row executed Java respawn oracle now checks the production
  adapter as well as the retained development implementation. Runtime respawn
  and existing native-evidence consumer tests pass.
- The canonical catalog check compares all 26,684 packed runtime states to
  the complete source facts. An additional old/new production comparison over
  32,230 queries, including 2,772 partial projections and 2,774 invalid or
  unknown projections, preserves every tested value and error fact: property
  order, flags, collision/floor/upper-face geometry, fluid, forced admission,
  large-shape admission and AABB intersection.

These are numerical/source checks, not a new native engine run or rendered
client acceptance. Removing eager operations and repeated names does not by
itself prove that the observed 256 ms World Liquor startup Spike, other packs'
watchdog warnings, or total memory warnings have disappeared. Fresh full-family
native/saved-world results belong to the eventual frozen candidate. Full Java
parity, the event-phase/platform gaps in `PARITY-MATRIX.md`, and human acceptance
remain open.
