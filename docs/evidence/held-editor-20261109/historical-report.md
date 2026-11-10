# Held-model and animation review, 2026-11-09

## Scope and source

Review inputs are World Liquor **0.1.208**, commit `a470278b8a165432ea5fb246844b0da2b685cde2`, with the exact release-pinned Tavern peer `26485c710f96612881f2a6c1bbfa9033d62d144b` (0.6.217). The complete World Liquor commit is recorded in `input-manifest.json`. Runtime files and release identity are unchanged.

- **27 geometric furniture item routes:** sixteen stool colors, ten wood/cabinet bindings and the freezer. All four first-/third-person, left-/right-hand display transforms match the pinned Java item ancestors: **108 pose pairs**.
- **132 sprite item routes:** every runtime PNG has identical decoded RGBA pixels to its resolved Java item layer, including all six quantity variants of eighteen bottles. These source item models contain no custom display overrides. There are 117 native `drink` routes, four native `eat` routes and eleven non-consumable routes. This is source/binding coverage, not a claim of engine-native hand size or use-animation equivalence.
- **Four animated freezer sheets:** water, lava, milk and retained legacy magma. Exported sheets and render-controller frame selection pass the existing source reconstruction check. Water/milk use 32 frames at two ticks per frame; lava preserves the original 0..19..1 sequence; magma preserves the original three opaque frames as 24 tick-interpolated frames. These are texture animations, not skeletal animations.
- The pack has no custom held attachables or skeletal animation/controller files. Native eating/drinking motion belongs to the engine and the effective family player stack, not these review fixtures.

The source inputs preserve their actual provenance: inherited item ancestors from the pinned original port, selected current cabinet assets from NeoForge 1.1.12 / CF9217896, and freezer body fixtures from NeoForge 1.1.9. Animated water/lava originate from Minecraft 1.21.1, milk from the pinned 1.1.11 source, and magma is retained for historical saved results only. This review does not claim a newly downloaded full current Java archive or complete branch parity.

## Static overlap coverage

The existing `tools/check_current_drink_surfaces.py` now checks every geometry rather than only the drink catalog: **96 models, 5,069 rendered faces, zero same-facing positive-area depth conflicts within 0.025 model units**. The previous 67 drink models / 4,431 faces retain their UV, current-source, historical witness and repair-idempotence checks. A counterfactual duplicate stool surface, outside the drink catalog, was rejected by the expanded guard without changing runtime files.

The auxiliary inventory records 531 opposite-facing near-plane contacts. These are not automatically z-fighting: adjacent solid faces and intentionally opposed faces require material/culling context, and are not removed by this change. The static check does not certify alpha sorting, shader precision, all camera distances, overlapping entities or engine playback. No speculative offsets or topology edits were made.

## Reproduction

Run `python tools/held_editor_review.py --output <directory>`. Open its `.bbmodel` files in Blockbench. `review-scenes.zip` contains the exact generated project bytes. The generator embeds original PNGs and records all source/runtime inputs; two independent outputs were byte-identical.

- `Native-*.bbmodel` preserves the original Bedrock hierarchy, texture bindings and display transforms in Blockbench’s native `bedrock_block` format. Inverse coordinate checks reconstruct the original cube bounds exactly.
- `Java-*.bbmodel` and `Canonical-*.bbmodel` are native Blockbench Java-format Display fixtures. Canonical cube coordinates follow Blockbench's Bedrock decode, then move to Java-format coordinates; item display values are copied unchanged. This is an editor comparison, not a Bedrock client renderer. Microsoft documents the Java-format Display workflow for [Bedrock item transforms](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/itemdisplaytransforms?view=minecraft-bedrock-stable).
- `held-sheet-1..7.bbmodel` shows source/canonical pairs in a review layout. Each row is one held context; each column is an item/material binding. The sheet applies the supplied pose for comparison; it is not a screenshot of Minecraft hands.
- `sprites-1..4.bbmodel` exposes all 132 actual runtime PNG bindings as flat review planes. It does not invent or certify native item extrusion or hand pose.
- `animation-*.bbmodel` exposes exported strips with source frame duration/order in Blockbench texture playback. Materials/tint and Bedrock render-controller integration are not reproduced by that editor path.

## Checks executed

- `python tools/check_release.py`: passed with the exact pinned Tavern peer; 63 BP blocks, 159 items, 41 recipes, zero errors. This includes the existing resource, topology, animation reconstruction, guide, storage and item contracts.
- `python tools/test_freezer_java_art.py`: six passed.
- `python tools/test_java_face_topology.py`: six passed.
- `python tools/test_texture_paths.py`: five passed.
- `python tools/test_entity_material_registry.py`: four passed.
- `python tools/test_current_model_surfaces.py`: one passed; duplicate stool faces outside the drink catalog are rejected.
- `python tools/check_storage_rendering.py`: passed, including six pose/placement tests.
- Portable generator compilation, deterministic generation, all 132 source sprite comparisons and `git diff --check`: passed.

An initial aggregate run used newer Tavern main and correctly failed two exact-dependency checks. Repeating with the release-pinned T217 peer passed; no dependency metadata was altered to hide that mismatch.

## Editor observations

Completed in the real **Blockbench 5.2.2 desktop** through native keyboard/click controls. No application evaluation or additional plugin was used. All review tabs were closed without saving, and the previous project was left untouched.

- All **27 native Bedrock furniture projects** were opened and inspected in **108 contexts**: first-person right/left and third-person right/left. The seven `contacts/native-*.jpg` sheets show every captured context. Textures remained bound and the models assembled correctly in these views; no new geometry or UV defect was evidenced.
- Four representative source projects (white stool, oak bar cabinet, oak cellar cabinet and freezer) were opened in the same four contexts, adding **16 source views**. `contacts/source-1.jpg` shows them. First-person lower-edge cropping is present in both the native and Java-source fixtures. This is recorded as authored/editor framing, not silently “fixed” by changing poses.
- All **132 sprite bindings** were displayed in four actual editor projects. `contacts/sprites.jpg` shows those planes. This establishes visible texture bindings, not native held size, extrusion or consumption animation.
- All **four exported texture strips** were played with Blockbench’s native animated-texture control. Distinct frames were observed for water, lava, milk and legacy magma, without a blank texture in the observed samples. `contacts/animations.jpg` contains two running samples per strip. This does not claim observation of every frame or a complete loop boundary; the exact frame order/duration and source reconstruction are checked separately. Water is displayed without its engine tint.

There are **39 actually opened projects and 140 original desktop PNGs**, enumerated and hashed in `capture-manifest.json`. `desktop-captures.zip` preserves the unaltered PNGs and held-context index. Four setup captures in the archive are not playback acceptance; three still have a context menu open. Contact sheets are cropped, resized and labelled for navigation only. The other generated projects were not opened and are not counted as visual acceptance.

**Limits:** no Minecraft client, BDS, user desktop, or LIVE world was opened or changed. Native eat/drink motion and the effective multi-pack player stack were not reproduced. Static surface checks and sampled editor playback cannot guarantee the absence of every engine-specific alpha-sorting or precision flicker. Runtime models, textures, animations, version and dependencies remain unchanged; the repair here expands the regression guard to the models it previously skipped.
