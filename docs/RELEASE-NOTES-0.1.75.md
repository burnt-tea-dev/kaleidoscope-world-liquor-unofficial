# World Liquor 0.1.75

Restore NeoForge 1.1.11 double-damage selection from the victim’s previous kill credit, before the current hurt updates it. A fresh first hit no longer procs from the current attacker; prior-owner environmental damage and changed-owner damage read the source owner. Transient player/mob priority, tame owner, 100-tick expiry, unload cleanup, canceled callbacks and native accepted-hurt confirmation are handled without saved dynamic properties or life-value rewrites. Paired with unchanged Tavern runtime0.6.114.

Native mobs verify the production callback, spaced damage4→8→8→4, cancellation, expiry and post-armor/pre-absorption stage. The Java primitive oracle checks the source-state transitions. These are not simulated players or human client acceptance.

Full parity is still pending. Same-tick native hurt-cooldown/provisional timing, detached/dead entity ordering and source damage-tag/class mappings remain explicit edges. Elbow knockback and critical particles are not declared implemented. See `JAVA-KILL-CREDIT-20261006.md` and the native capability report.
