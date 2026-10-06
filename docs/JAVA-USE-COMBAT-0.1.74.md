# Java use and combat source repairs

Tavern 0.6.114 / World Liquor 0.1.74 are a repair batch toward the user's full
Java goal, not a complete parity certificate. Slightly-tipsy visuals remain the
user's sole explicit exclusion. The host's full source inventory and outstanding
requirements are in `docs/JAVA-FIDELITY-GOAL-20261006.md`.

Primary author: current NeoForge 1.1.11, CF file9066406. Latest Forge1.1.12,
file9066402, has the same CustomDrinkItem overrides, crit predicate and float
damage/chance formulas; source event stages differ and remain separately tracked.
Official Minecraft1.21.1 LivingEntity bytecode supplies the use-effect cadence.

Implemented:

- All18 Ice Tea/Cool Tea/Sour Plum quality items now schedule the authored sound
  at use ticks8/12/16/20/24/28 and on actual completion. Release, leave or another
  use session cancels pending pulses. Volume0.5 and Java float pitch0.9–1.0 are
  preserved; spatial sound uses the actor's current location. No global sound
  stop, native sound override, idle poll or success text is introduced.
- Ground crit tests the complete source predicate, including climbing,
  blindness and riding, and excludes projectile/explosion owners. Its chance
  remains double; damage multiplication uses float as the source does.
- Double-damage probability uses a24-bit Java float draw and its source float
  chance. Tequila's fraction/floor/cap use the exact float operations.
- Elbow sound is0.6/1 at the captured source position. Double-damage feedback
  uses original critical samples at1/1.5. Crazy uses original beacon samples
  at1/1.5; respawn plays its original source sound once before searching, and its
  destination sound after successful teleport. Multi-jump checks the actual
  mount rather than riding-component presence, matching the source passenger
  restriction.

Original custom OGG files were compared directly with the current author's
archive and are unchanged. The six selected Minecraft clips were acquired from
Mojang's published1.21.1 asset index; provenance is in
`data/java-feedback-audio.json`. These are source acquisitions, not a second
release checksum ledger. Java source oracles and event callback regressions are
numeric/API fixtures, not simulated Minecraft players.

Remaining: real elbow knockback; complete double-damage kill-credit and event
ordering; critical particles; all native/default audio overlap and attenuation;
exact respawn loading/bed/anchor/rotation; Creative Flight; outlines; full entity
effects, loot/automation and other full-goal rows. Native/runtime and real
client evidence must be recorded separately. Never call this full Java parity.

The earlier0.1.71 candidate is retained in Git/release history and was never deployed.0.1.72 corrects native riding-component interpretation before release; it checks the actual mount rather than component presence.

The frozen 0.1.71 and 0.1.72 candidates remain in Git and were never deployed.
0.1.73 also fixes the multi-jump mount predicate and respawn source-sound order.

Final 0.1.74 also carries the reviewed literal HUD sibling-binding and full
UTF-8 prefix fix from remote draft PR46 without changing the use/combat
repairs or mixology data. Both differing frozen 0.1.73 commits remain intact
in their respective Git histories and are never installed under one identity.
