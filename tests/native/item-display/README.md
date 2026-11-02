# Native equipment and inventory-slot capability probe

This diagnostic pack is excluded from the exported World Liquor runtime. It tests a possible native carrier for arbitrary freezer items; it does not implement a renderer.

The [dated observation](../../../docs/evidence/native-item-display-20261103.json) records the exact executed fixture hashes and BDS 1.26.60.6 / `@minecraft/server` 2.12.0-beta results. No runtime version bump or family restart is needed for this source-only addition.

## Reproduce in isolation

1. Use a disposable, inaccessible BDS world with no players, no family/third-party packs and no production save. Back up anything valuable elsewhere. The probe changes blocks near (0,64,0), time and mob spawning.
2. Enable Beta APIs (`gametest`) and Upcoming Creator Features (`upcoming_creator_features`); confirm the saved flags and the selected engine's API support. Use normal difficulty so hostile controls remain alive.
3. Copy `behavior_pack` into the disposable server's behavior packs and activate its manifest UUID/version in that world's `world_behavior_packs.json`. Keep the official engine definitions/builtin packs. No resource pack is required.
4. Start the server. Preserve every `[S1_EQUIPMENT_CAPABILITY]` JSON line. Wait for `kind: complete`, then stop normally. Do not admit a player: any observed player session invalidates the run.
5. Require all ten case rows, successful native main/offhand commands, no thrown API/content errors, no completion failure and successful entity/ticking-area cleanup. A missing component is a capability result, not a successful equipment transfer. Where inventory exists, require metadata roundtrip/cleanup and both `hasitem` command controls.

The command first puts a diamond sword in mainhand and a totem in offhand. The inventory test clones an iron sword with name, lore, adventure restrictions, dynamic properties, durability and Unbreaking II, reads it immediately and two ticks later, then clears it. `hasitem` distinguishes that inventory slot from native mainhand. The script attempts `setEquipment` only when the API component exists.

## Observed boundary

All ten entities accepted native command equipment; none exposed the equippable API. All five inventory controls preserved the tested metadata. Writing/clearing inventory slot 0 did not replace/remove native mainhand. This narrows this route on this engine only. It does not test visual transforms, arbitrary item models, potion metadata, pickup/hopper safety, persistence across restart, or real client acceptance. C04 arbitrary ItemStack rendering remains open.

Official reference: [EntityEquippableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable), [equippable entity JSON](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_equippable?view=minecraft-bedrock-stable). Native JSON equipment, script inventory and script equippable are distinct interfaces; component availability must be observed on the selected entity/engine.
