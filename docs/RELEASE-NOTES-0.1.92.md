# World Liquor 0.1.92 — real food callback evidence

This development release provides a default-off observation of the four World Liquor foods. It does not fix or certify their food/container parity. The existing food effects, native food definitions and current incorrect pudding inventory remainder are preserved while the actual native callback order is observed. No inventory, effect, particle, hunger, sound or UI is changed by the observer; it consumes no random draws. It observes the registered complete-use callback before/after its existing work, the native consume callback and the next native tick.

Only a direct server-console event without a source actor, block or initiator enables the observer. It expires after 2400 ticks and at most64 observation rows; only eight anonymized actors are allowed. It records the four owned food IDs, event count, selected-slot item count, main-inventory bowl total, offhand type/count and current mode. Foreign item IDs, player identity, names, coordinates and metadata are omitted. Transport/read failure is caught and cannot cancel food completion. The next-tick observation is read-only evidence, not a delayed gameplay settlement.

## Dot: controlled real-client scenes

Use the latest Bedrock client with the deployed family. Empty the selected slot after each scene manually; retain the normal food component and original server configuration. Do not invoke a synthetic use callback or create a simulated player.

The operator sends this in the server console, without a leading slash:

```text
scriptevent kaleidoscope_world_liquor:food_phase_trace start
```

Dot completes one pudding in each real-client scene: Survival last pudding in slot5 with slot1 empty; Survival two puddings in slot5; Creative one pudding; Creative two puddings. Then complete one ice cone, one stuffed crisp and one crispy corner. Cancel one food halfway and change slots during another use: no completion/consume evidence may be fabricated for a cancelled use. A single observation window holds all completed scenes; restart it if needed. Disable immediately with the same command ending in `stop`. Rows appear only in the server content/output log, never as player messages.

Compare `complete_before`, `complete_after`, `consume`, `consume_next_tick`, event counts and selected slot contents. An operator collects these bounded rows locally before deciding whether remainder settlement belongs before or after native debit. BDS startup alone cannot prove any food callback; no client result is present at release time.

## Authoritative original differences

Current maintained NeoForge1.21.1 author1.1.11/CF9066406 `ModFoods` gives all four foods nutrition5, saturationModifier0.4, alwaysEdible and9600-tick effects, with each effect probability1 still consuming a nextFloat draw. Ice cone: Fire Resistance then Speed; stuffed crisp: Luck then Saturation; pudding: Regeneration then Luck; crispy corner: Haste. The current Bedrock handler omits Luck and the probability draws. Luck is not a native Bedrock effect; exact source loot/attribute behavior needs a real adapter, not an invented visual-only effect.

`CompatFoodItem.finishUsingItem` calls `super` first. For pudding, if the original stack became empty it **returns a new bowl**, allowing LivingEntity complete-use to replace the original hand. Otherwise, including Creative, it calls `LivingEntity.spawnAtLocation` for one bowl and returns the original food result. It never calls Player inventory insertion. The current port inserts every bowl into inventory and is wrong. Native Bedrock debit/callback timing, hunger, consume hooks, effect order, original eat/burp audio, drop position/physics/delay, slot mutations and player actions are still unverified or incomplete. Observation is a prerequisite for a correct adapter; this release is not a platform waiver or full-Java claim.

Static source tests check that tracing is disabled, bounded, anonymous and cannot perform gameplay writes. The complete family still requires native first/restart, a fresh stopped-world rehearsal, admission and exact live readback. Client=false and production_ready=false remain pending Dot's real scenes.
