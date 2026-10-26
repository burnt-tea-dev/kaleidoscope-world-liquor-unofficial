# Freezer ingredient rendering review

The maintained Java authority is World Liquor NeoForge 1.1.11, CurseForge file 9066406, on Minecraft 1.21.1. The October 17 successor archives remain unavailable through the official download API; this review does not claim to adopt those releases. Source/package checks do not establish rendered-client parity.

## What Java renders

`FreezerBlockEntity.insertItem(ItemStack, Player, InteractionHand)` accepts any nonempty stack passed by the block interaction while the freezer is idle, has no output and has a free slot. It copies the complete stack, sets the copy count to one, then debits the original hand. Fluid-container branches run before ordinary input. The input universe is not a recipe whitelist: sugar, blocks, tools, potions and foreign-mod items can occupy the four input slots.

`FreezerRenderer.drawFloatingItems` renders each nonempty native stack with `ItemRenderer.renderStatic(..., ItemDisplayContext.FIXED, ...)`. The renderer therefore receives the original item components and resolved model, not merely an item ID or flat inventory icon. It uses the following source transforms:

| Property | Java source behavior | Current Bedrock ingredient route |
| --- | --- | --- |
| Item coverage | Every nonempty input slot | Snowball, blue dye and slime ball only |
| Height | Dry: 0.28; filled: block items 0.55, other items 0.65 | Supported ordinary sprites use dry 0.28 / filled 0.65; no block-item model route |
| Scale | Block item 0.40; ordinary item 0.25 | A fixed 4 by 4 pixel-unit surface, equivalent to a 0.25-block footprint |
| X/Z and item yaw | `java.util.Random(blockPos.hashCode() + slot * 999L)` selects a position inside each padded cell and an independent yaw | Current source uses the same signed hash, 48-bit generator and float steps for the three supported sprites |
| Item context | Native `FIXED`; the vanilla generated parent also supplies its fixed transform | Alpha-tested top surface with one static texture |
| Lid condition | Renderer invokes contents without an `open` check | Helpers exist only while the lid is open |

The closed-lid condition is a source difference; whether it is visibly wrong depends on occlusion and has not been established from a client image. The seeded positions need Java integer hash/PRNG and float rounding verified by an independent JVM oracle before any translation is accepted. No guessed offsets are proposed.

## Confirmed wrong sprite corrected in W155

The former `freezer_blue_dye.png` has exactly the same RGBA pixels as vanilla Java `lapis_lazuli.png`. Compared with the correct Java blue-dye sprite, 105 visible pixels differ and 50 pixels have different alpha; the powder outline was therefore visibly replaced by the lapis shard outline. Snowball and slime-ball display textures already match their Java counterparts pixel for pixel.

The correction copies the exact official `assets/minecraft/textures/item/blue_dye.png` for Minecraft 1.21.1. The client archive's SHA-1 matches its Mojang version metadata (`30c73b1c5da787909b2f73340419fdf13b9def88`); archive SHA-256 is `499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99`. The selected PNG SHA-256 is `6cf7ce48373b5e4d1b42c36abdff0abc847eef2dd10c9886bc1a77903b66617d`.

`data/freezer-ingredient-art.json` records the exact official archive URL and selected PNG/model hashes. `tools/freezer_ingredient_art.py --write --jar <official-client-jar>` verifies that archive and rebuilds the output without redrawing or resampling it. Source archives are not published in this repository. The existing helper uses `entity_alphatest`, a single `[4, 0, 4]` plane, and the full 16 by 16 image. No old alpha outline is baked into a mesh. The current contract checks the shipped official PNG and its entity, material, geometry and UV route directly. The old wrong-image projection is retired; existing release records retain their original hashes.

## Remaining repair path

1. **Reproduce a generic native item display.** Existing family bottle/cabinet catalogs enumerate known models; they do not supply a generic arbitrary-stack renderer. Prototype one equipment-capable helper type, with at most four instances per freezer, using clones of the existing native stored stacks. Prove component availability, rendering, no equipment drops, cleanup, extraction, restart and metadata preservation before adopting it. A helper's equipment must never become another recoverable inventory.
2. **Establish display context and transformations.** Bedrock client entities can enable equipment/attachable rendering, but held-item attachment and fixed/item-frame display are distinct contexts. Player-specific attachable owner conditions can also exclude a custom helper. A successful sugar image alone does not prove block items, potion tint, enchantment glint or foreign attachables. Verify source transforms against actual native/client results; do not declare a hard platform limitation from missing current implementation. See Microsoft's [client entity options](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/cliententitydocumentation/cliententitydocumentationintroduction?view=minecraft-bedrock-stable), [attachable behavior](https://learn.microsoft.com/en-us/minecraft/creator/documents/attachables?view=minecraft-bedrock-stable) and [display contexts](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/itemdisplaytransforms?view=minecraft-bedrock-stable).
3. **Use a bounded source-derived fallback only if needed.** Sugar is a vanilla `item/generated` sprite and can be rendered by a source-derived model, as can the three current ingredients. Adding sugar alone would still omit arbitrary accepted items and their components. It must be described as expanded coverage, not full parity. Do not generate thousands of per-ID geometries before measuring the native generic route.
4. **Compare paired scenes.** Cover all four slots and facings, dry/filled states, the three recipe ingredients plus sugar, a block item, a potion, an enchanted tool and a foreign attachable. Verify insertion/retrieval/restart and open/closed occlusion. Editor/converter previews and BDS logs remain separate from actual rendered-client evidence.

The family visual workflow is source-first: pin the exact Java model, texture and display transform; preserve UV/pivot/topology during conversion; inspect source-derived editor output; then obtain native and client evidence. The old Grilling animation/item repair document was consolidated into its current rebuild plan; its retired phase-specific instructions are not a new World Liquor release requirement. W155 performs only the confirmed sprite correction and interaction-continuity repair. Current source placement is checked against recorded original-method execution in [the freezer behavior test](../../tests/freezer-result-height.test.mjs); [the current source review](../../data/current-freezer-review.json) owns its numerical provenance and remaining display scope. General input coverage, thickness, absolute UV orientation and item-component rendering remain open.
