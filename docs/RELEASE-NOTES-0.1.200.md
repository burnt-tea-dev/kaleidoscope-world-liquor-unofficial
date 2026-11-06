# World Liquor 0.1.200 — Creative fluid transfer preserves inventory

Creative empty-bucket transfer now drains the freezer tank while leaving the complete held stack and inventory unchanged. It creates no additional filled bucket and succeeds with a full inventory, matching both maintained loader FluidUtil branches. The existing Creative tank-fill branch was already correct; W199 failed-transfer ordinary input still consumes one bucket. Reuse the existing transaction and recovery; no registry, UI or saved-format changes.

Ten callback counterexamples now pass and eight tank-fill controls already matched Java; the affected source suite passes64. The new narrow native inventory/drained-tank and same-QA tank-readback observer is prepared, not run. Previous native evidence retains its original scope. Preserve exact T203/G238 CI pins, SDK and UUIDs. See [source rules and scope](FREEZER-FLUID-INPUT.md#w200creative成功流體轉移).
