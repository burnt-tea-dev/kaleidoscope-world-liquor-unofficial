# Elbow attack knockback source and native observation

Current author reference: World Liquor NeoForge Minecraft 1.21.1 **1.1.11**, CurseForge file **9066406**. Reviewed classes are `init/smc/SMCEffect.java:23–25` and `event/EventHandlers.java:196–207`. The effect adds **1.0 × (amplifier + 1)** to ATTACK_KNOCKBACK. EventHandlers only supplies the original elbow sound; it does not independently call knockback. Author registration is conditional on external SMC being absent. No third-party implementation source is copied here.

Original Minecraft 1.21.1 mapped methods reviewed: `Attributes.ATTACK_KNOCKBACK` (range 0–5), `LivingEntity.getKnockback` (mapped lines 1462–1466), `LivingEntity.knockback` (1489–1509), `Player.attack` (1232–1412) and `Mob.doHurtTarget` (1496–1522). Player and ordinary Mob both use the original Mth float sine table. Successful attacks multiply final float knockback by .5f before the target call. Player adds the sprint bonus only above the original float .9 attack-strength threshold. Original LivingEntity resistance scales the force; a nonpositive result leaves velocity unchanged. Otherwise X/Z are halved and receive the normalized yaw force; ground Y is min(.4, oldY/2 + force), while airborne Y remains unchanged. Attacker X/Z are multiplied by .6, and Player sprint is cleared inside its positive-knockback branch even when target resistance consumes the force.

`source.js` is a development numeric core. It requires explicit source attribute/modifier/enchantment values and original target velocity at knockback entry. It does not guess unavailable native attack attributes or replace the original post-hurt velocity with a pre-hurt sample. The self-written Java oracle evaluates 360 amp/yaw/actor/ground/resistance combinations; `tests/elbow-source.test.mjs` compares the JS results and checks modifier ordering, clamp, sprint threshold and full resistance. The fixtures are arithmetic evidence, not Minecraft players or native event-phase proof.

Existing `docs/NATIVE-COMBAT-CAPABILITIES-20261006.json` shows that API2.7 applyKnockback respects 0/.5/1 resistance while applyImpulse bypasses it. It also shows delayed native movement: same-tick velocity does not reflect the call. This cannot prove that a second applyKnockback after native attack would reproduce Java's single attribute-driven call. No fixed extra force, runtime subscriber or production adapter is installed by this work.

`tests/native/elbow-observer-overlays.json` describes an additional test-only BP for the existing canonical isolated engine setup. Its own AI actor selects and attacks real native target mobs. Fourteen cases cover resistance0/.5/1 and actual ground/air states, cancellation, death, and a controlled API call after the real hit. Sequence/tick-stamped logs record beforeHurt, afterHurt, entityHitEntity, entityDie and run/timeout1/timeout2 positions and velocities. Chunk access is bounded and checked before platform creation. A case without actual beforeHurt is missing evidence, never a pass. This observer does not infer Player attack charge, sprint, enchantments or client movement from mob results.

The first isolated execution failed before spawning because its ticking area had not completed loading. That evidence must remain; the observer now waits for actual readable valid blocks. The second execution exposed a native schema constraint on scan_interval, now set to 10. The third observed eight real ground/cancel/death cases, but its walking actor could not attack while itself airborne. The current observer only fills the six missing air cases: the actor remains grounded, and the nearby no-gravity target floats at Y80.75. Its overlay expected_cases is 6 and explicitly supersedes only the missing air subset. Existing eight ground observations are reused separately, not rerun or changed.

The fourth executed all six configured air cases, but every before/hit/after snapshot still reported ground=true at Y80.75. Its overall runner pass is real event observation, not proof of an airborne branch. The fifth adds a small positive Y setup velocity, waits for actual valid/ground=false before spawning the AI attacker, and rejects any later grounded air sample. All six cases then observe actual air with 14/15 samples each, one before/hit/after, and no errors. The observer remains API2.7; no API2.9 result is used to claim support.

The third/fifth executions disprove using current event velocity as the completed native base kick: beforeHurt → entityHitEntity → afterHurt and same-tick system.run retain entry velocity, and next tick reveals the kick. Canceled attacks still emit entityHitEntity but no afterHurt or kick. True airborne targets starting at Y velocity about .010002 receive native base Y about .4 (resistance0) or .245 (resistance.5). A controlled API vertical .2 then produces about .2 in both cases, whereas original Java airborne knockback retains entry Y. These are concrete counterexamples to a guessed fixed extra force.

The public `data/java-parity/neoforge-1.1.11/elbow-knockback-capabilities.json` contains only synthetic names/numeric snapshots and relative tick offsets: eight successful ground/cancel/death cases from the otherwise incomplete third collection, six actually-airborne cases from the successful fifth, and six fourth-collection label-only counterexamples. It excludes machine paths, original absolute ticks, entity IDs, raw logs, world data, private scripts and engine inventories. `tests/elbow-native-evidence.test.mjs` keeps those acceptance boundaries executable in CI.

Production wiring remains unimplemented. Source attack attributes, enchantments, Player charge and target resistance are not exposed by the sampled stable API. The buffered base operation is not visible at the callbacks, arbitrary initial velocity and operation order are not covered by these zero-XZ cases, and Player/client behavior was not observed. Numeric source regressions and this Native evidence do not justify applying a second fixed kick or publishing a version that claims elbow is repaired.

Later execution results belong to their distinct output directories. Exported runtime remains unchanged at package0.1.89; this source-only work changes no package identity and performs no runtime deployment or client acceptance. Full source damage ordering, exact native force composition and dot's player/client validation remain required before a production wiring decision.

## Queued velocity replacement, 2026-10-08

Ten new real AI melee cases isolate the pending Native operation. The untouched
air control receives the prior source-independent Native0.4 vertical kick.
`clearVelocity` in matching afterHurt clears the pending base kick for resistance
0/.5/1 even though the same-tick getter still exposes the old velocity. Clearing
then applying one explicit impulse replaces the pending vector with that vector;
it is not resistance-aware by itself. A same-position teleport also clears it,
but it is not chosen as a movement implementation.

`native-motion.js` therefore provides an explicit final-vector writer using
clearVelocity plus applyImpulse. It does not infer source state or subscribe to
gameplay. `meleeKnockbackSequence` composes the original hurt base call followed
by the attack-attribute call. Official1.21.1 bytecode widens the float0.4 constant
to double0.4000000059604645 at the hurt call; the source helper preserves that.
Grounded vertical clamping and horizontal halving happen separately in each
call. Full resistance leaves target momentum unchanged while a positive attack
branch still settles attacker velocity/sprint.

Six further actual AI cases provide explicit source resistance and a fresh
first-hit base branch, calculate from actual entry motion/positions/yaw, then
write the composed vector. Three resistance values and actual ground/air states
match the original source calculation within Native component precision
(maximum absolute component error about1.53e-6). The accepted callback, melee
hit and before-hurt counts are each1. This does not prove Java double precision
inside Bedrock or real Player physics. API2.7 exposes a subscribable
playerSwingStart signal in the native observation, but no players were used.

Evidence is the sanitized `elbow-velocity-control.json`; native world/engine
inventories, paths, absolute ticks and raw logs are kept out of the public file.
The observed method clears pending operations, so production must preserve
other addon impulses and use exact source event ordering rather than wiping
unknown queued motion. Reading the current getter is still insufficient.
Actual source attributes/enchantment hooks/resistance, base-hurt cooldown
branch, Player charge/sprint reset, batched event correlation and movement
packets remain required. No production Elbow force adapter or complete
player/client fidelity is claimed by these observations.
