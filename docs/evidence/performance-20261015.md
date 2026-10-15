# W146 bounded effect and freezer presentation work

The predecessor is canonical W145, commit `cc8ec7b202230185a62c2786affcf7acb85a5ebe`. This repair reduces repeated server work; it does not claim a measured client FPS, ping or watchdog improvement.

`effects.js` previously enumerated every online player each tick, then merged the recipients already identified by the Tavern snapshot consumer. It now visits only those fresh recipients, including mobs. Jump allowance is discarded when a recipient expires; an empty snapshot still revokes immediately. Snapshot sequence, the 20-tick freshness limit, per-row expiration and the actual per-tick healing, frost and movement rules are unchanged. Passive combat/healing effects no longer read player velocity when none of the four motion effects is active. Spawn/leave cleanup remains installed.

`freezer-visuals.js` previously teleported each surviving display on every refresh, including unchanged displays. Reconciliation still queries the existing owned entities and repairs missing, displaced or rotated displays, closes the lid, and updates the original result-height expression after extraction. An unchanged native transform now needs no teleport. Positions are compared at float precision; the authored positions, rotation, geometry, animation and pixels are unchanged. No long-lived entity or ItemStack cache is introduced.

The tests exercise the production tick with the actual foundation snapshot consumer and the production visual reconciler:

| Scenario | Observable result |
| --- | --- |
| 200 idle-player API entries over 20 ticks | 0 player enumeration, entity resolution or velocity reads |
| Player and mob healing recipients over 5 ticks | Exactly 10 recipient resolutions and 5 heals each; 0 passive velocity reads |
| Active to empty, then no empty heartbeat | Immediate removal of jump allowance; a later airborne grant cannot reuse it |
| Last snapshot at sequence 3 | Fresh at tick 23; expired and allowance cleared at tick 24 |
| Other addon, milk and entity removal | Foreign source ignored; supported revocation stops the effect |
| Three open-freezer displays, 100 unchanged refreshes | 0 teleports, versus 300 with the predecessor |
| Displaced/rotated/missing display, lid close, one output taken | Repair/replacement/removal occurs; result height changes once and remains stable on the next refresh |

Targeted checks passed: `node --test tests/startup-sdk.test.mjs tests/freezer-result-height.test.mjs tests/frost-water.test.mjs tests/multi-jump.test.mjs`. The new recipient cases were also run directly to inspect their named assertions. Substituting only the predecessor production source into those same new tests gives three recipient failures and two visual failures; the independent registration-wire and Java result-height cases still pass. No runtime file was overwritten for that reverse comparison.

Freezer countdown persistence, strict native carrier checks, recipes, quantities, durations, single settlement, inventory rollback and frost aging were retained. Full required checks belong to CI, and the family candidate still needs its own saved-world/admission/deployment evidence. `client=false`, `production_ready=false`; actual high-latency play and rendered-client acceptance remain pending. No simulated players or new native probes were used.
