# Original Player charge before production integration

Official Minecraft1.21.1 client mappings and Player bytecode were inspected at
getCurrentItemAttackStrengthDelay, getAttackStrengthScale, resetAttackStrengthTicker,
tick and attack. The small self-written Java oracle contains only independently
written arithmetic expressions, not the Mojang class or implementation archive.

Delay is double `(1 / attackSpeed) * 20` narrowed to float. Scale narrows the
signed int ticker to float, adds the float partial tick, divides by the float
delay, then clamps0..1. The attack uses partial tick0.5 and a strictly-greater
float0.9 charged gate. An explicitly sprinting charged attack captures the
sprint bonus before hurt; later changing sprint state must not retroactively
change that captured bonus. The ticker resets on reaching the source attack
path regardless of the later hurt result. An unknown native event must not be
treated as reaching that source path merely because an arm animation occurred.

Player.tick increments the signed32-bit counter first. A different main-hand
Item identity resets it; changed stack count or components alone only update
the tracked copy. The helper receives explicit source Item type identities.
It does not guess equivalence of arbitrary Bedrock items or attribute hooks.

80 JVM-evaluated speed/ticker combinations exercise float narrowing, zero-speed
infinite delay, clamp and strict sprint threshold. Additional source rule cases
cover Item-type changes, unchanged types, int overflow and unknown inputs.
These are source arithmetic cases, not native player attacks or client proof.

The prior real no-player Native observation confirmed a subscribable stable2.7
playerSwingStart signal. Its per-player timing, actual server attack witness,
cooldown ticker alignment, source attack-speed modifiers and input/sprint reset
still need production integration. Player.attack reads final knockback attribute
and yaw after accepted hurt; its captured charge/sprint eligibility precedes hurt.
For a ServerPlayer target, original velocity-packet handling additionally restores
the captured server velocity after sending the hit velocity; this is not covered
by the mob force observations and must not be inferred from them.

No runtime export, Player subscriber, new pack identity or live update is made
by this source foundation. Full Elbow/Player/PvP/client parity remains unfinished.
