# World Liquor 0.1.90 — bottled mixer completion and cola mixology

Cola and tonic water now dispatch their food effects before consuming the original completed-use stack and returning its glass bottle. The last drink adds its bottle to inventory using Java's selected merge, offhand merge, first main merge and first free main slot order, instead of always replacing the selected hand. Creative receives effects without consumption or a remainder. Fresh post-effect game mode, inventory and selected slot are read at their source phases; changed origin stacks are reported without overwriting unrelated items.

Cola's shaker-input descriptor now contains both Haste I and Speed I for 300 ticks at probability one, matching author `ModItems`. Previously its Speed effect was absent from signature cocktails. Tonic water retains Regeneration I for 300 ticks. Each direct food effect consumes its source-style 24-bit float probability draw, including probability one. The historical import generator is corrected together with the maintained payload.

Primary reviewed source: current NeoForge1.21.1 World Liquor1.1.11 CF9066406 `ModItems`, `BottledDrinkItem.finishUsingItem`, and official Minecraft1.21.1 `Item.finishUsingItem`, `Player.eat`, `LivingEntity.eat/completeUsingItem`, `Inventory.add/getSlotWithRemainingSpace`. Forge1.20.1 World Liquor1.1.12's cola/tonic registrations retain the same two/one effect rows; full newer branch adaptation remains pending.

The registered callback, effect/consumption order, Creative and changed-mode handling, selected/offhand/main insertion priorities, metadata preservation and full-inventory counts are source regressions, not simulated players or client acceptance. Shared host mixology checks exercise the actual descriptor through the current registry and signature merger. Full-family static/BDS and fresh stopped-world migration are separate deployment gates.

Remaining complete-parity requirements include shared native RNG state, native completion timing and ItemStack alias identity, food stats/advancements/game events, Java completion burp/eating audio, exact full-inventory Player.drop velocity/eye offset/pickup delay, and actual rendered/heard client results. No full-Java or human-client acceptance is claimed. Pochi food bowl handling/Luck, frosted-ice scheduling, Elbow Strike and other previously recorded gaps are still open.

Dot comparison scenes (Java and Bedrock Survival, the same inventory arrangement):

1. Put one cola in selected hotbar slot 5 and keep slot 1 empty. Complete drinking: Haste and Speed each last 15 seconds; slot 5 empties and the bottle goes to slot 1. Repeat with tonic water for Regeneration.
2. Put two colas in slot 5, a partial glass-bottle stack in another slot and fill all remaining slots. Complete drinking: one cola remains and the glass-bottle stack grows by one. Repeat with no available bottle-stack space: exactly one empty bottle drops.
3. Use a final cola with a full inventory: its freed slot holds one glass bottle. In Creative, no cola is consumed and no bottle is created. Cancel or change slots before use completes: no effects/debit/remainder should occur.
4. Make a signature cocktail with three colas. Both Haste and Speed must survive the pour with the original merged 54-second duration. Named recipe timing remains unchanged.

Pair with Tavern0.6.122 and Grilling2.8.101; existing recipe identities, colors, assets, storage, UUIDs and private Cookery1.6.0 integration remain intact. Publish/merge the canonical repair, admit a full-family candidate and deploy to live under the owner's standing development authorization; `client=false` and `production_ready=false` remain until Dot's actual acceptance.
