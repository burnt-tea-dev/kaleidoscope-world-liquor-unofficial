# World Liquor 0.1.146

Process only fresh Tavern effect recipients instead of enumerating every player each tick. Keep player/mob healing and movement at their original cadence, revoke immediately on an empty snapshot, retain the 20-tick freshness limit and discard expired jump allowance. Passive effects avoid unnecessary velocity reads.

Freezer refreshes reconcile the same original displays while skipping teleports for unchanged transforms. Displacement, facing, missing entities, lid closure and the Java result height after extraction still update normally. Countdown persistence, native item ownership, recipes, quantities, timing, animation and source assets are preserved.

Pair with Tavern 0.6.168 and Grilling 2.8.144. See the [focused source and operation-count evidence](evidence/performance-20261015.md). Required CI and family save/admission/deployment gates apply to this candidate; client latency/FPS and complete Java rendering remain unverified. `client=false`, `production_ready=false`.
