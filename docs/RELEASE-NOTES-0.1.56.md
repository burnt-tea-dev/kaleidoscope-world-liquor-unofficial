# World Liquor 0.1.56 — Java effect boundaries (draft)

Based on the paired 0.1.55 candidate and Tavern 0.6.90. No new Java artwork is imported.

## Source-backed changes

Mechanics reference: [official NeoForge 1.1.9 file 8947041](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/8947041), SHA256 `3c3779945687be248d91ea919b1f72b40a66aeed40249a6049f55b0158b149ae`.

- Respawn checks center, then unique radius 1–3 perimeter rings at heights 0, -1, -2, -3, +1, +2, +3. It now considers liquid support, preserves facing, resets cross-dimension velocity via teleport options, plays player-category teleport audio at both endpoints, and applies Hunger for 300 ticks at amplifier 0.
- Crazy retains 200-tick native effects and uses the original beacon pitch 1.5.
- Ground Crit now includes climbing, blindness and riding among states that disqualify a vanilla falling critical and therefore permit the custom roll.
- Elbow Strike's existing hit sound uses original volume 0.6 and pitch 1.
- New deterministic production-function regressions are included in the explicit CI test list.

## Remaining limitations

These changes do not certify full Java parity. Stable Bedrock has no Java collision-shape getter: the search predicate conservatively admits air/liquid rather than treating every non-solid block as collision-free. It also has no explicit fallDistance setter. The original center fallback is preserved even when no safe candidate is found. Native teleport behavior and unloaded destination behavior require actual engine/client testing.

Elbow Strike's Java ATTACK_KNOCKBACK +3 attribute has no faithful stable per-player attribute setter here and remains unimplemented. A guessed impulse is not presented as equivalent. Native Bedrock's effect catalog differs from Java's; Crazy only iterates effects available through its native API.

No production deployment or full client acceptance is implied by the callback fixtures.
