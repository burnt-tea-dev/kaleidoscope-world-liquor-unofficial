# Freezer editor review, 2026-11-08

Reviewed canonical **W201**, commit `20cfe4169c5a1a95ff3e02940605b5af7aa6af77`, paired with T205. These nine images are actual screenshots of official Blockbench 5.2.2's Linux desktop. No Minecraft client, user desktop, BDS, LIVE world or runtime file was changed. This is editor evidence, not game-renderer acceptance.

## Source and method

- Body: the repository's hash-pinned NeoForge 1.1.9 `fridge_open`, `fridge_close` and original 128 × 128 texture. Current canonical geometry and textures are decoded independently alongside the Java elements, with Java on the left and canonical on the right. The current freezer-art test verifies every authored face, UV rectangle, UV rotation, texture and dimensions.
- Contents: actual current `syncFreezerVisuals` output at block position `[0,64,0]`, four original input slots containing blue dye, snowball, slime ball and blue dye. Four facing states are shown in a 2 × 2 layout, with only the review layout adding spacing between blocks. Each original sprite remains embedded unchanged. Wet surfaces show the first source texture frame in the editor, without Minecraft's shader/tint behavior.
- Numerical placement is separately checked by the existing recorded CF9066406 / NeoForge 1.1.11 original-method oracle. An editor scene is not an independent oracle for those calculations.
- The maintained project has since adopted selected NeoForge 1.1.12 / CF9217896 domains. On November 8 its official metadata endpoint was readable, but the official archive download returned HTTP 403. This review does **not** claim a fresh 1.1.12 renderer or asset comparison, and does not relabel the older source fixtures as current-author verification.
- The generator follows Blockbench 5.2.2's Bedrock codec conventions: mirror model X, negate X/Y rotations, reverse the two UV endpoints on top/bottom faces, preserve per-face UV rotation and missing faces. The projects are review-only and are never exported into runtime.

## Observed results

1. **Open/closed body and UV:** the paired open views match at the top and south faces. The closed pair matches the lid, gasket seam, cabinet side and poster in the observed isometric view. No missing faces or displaced UV was seen in those views.
2. **Four slots, four facings:** all 16 supported ingredient instances are visible inside the cavity in both dry and wet top views at this sampled position. No wall crossing or ingredient overlap was observed in this sample. The wet isometric scene shows contents just below the rim; the dry scene's lower contents are hidden behind the taller cabinet walls at that angle. This is expected geometric occlusion, not an inventory-loss finding.
3. **Closed lid:** a diagnostic scene deliberately retains the four ingredient planes and fluid plane even though current runtime removes helpers on close. The closed shell occludes them at the observed isometric angle. Hiding only the shell reveals the same five planes. This narrows the geometric concern for the three supported flat sprites; it does not prove closed-lid equivalence for arbitrary Java item models, different positions, client materials or render order.
4. No new runtime defect was established by these scenes, so no speculative rendering repair, pack-version bump or deployment was made. Opening and closing use authored state models; this review does not invent or validate a continuous lid animation.

## Images

- [Open top pair](pair-open-top.jpg) and [open south pair](pair-open-south.jpg).
- [Closed isometric pair](pair-close-isometric.jpg).
- [Wet four-facing top](wet-four-facings-top.jpg) and [wet isometric](wet-four-facings-isometric.jpg).
- [Dry four-facing top](dry-four-facings-top.jpg) and [dry isometric](dry-four-facings-isometric.jpg).
- [Closed shell with retained contents](closed-retained-contents-occluded.jpg) and [same scene with shell hidden](closed-retained-contents-shell-hidden.jpg).

## Reproduce and verification

From the repository root, run `python tools/freezer_editor_review.py --output <review-directory>`, then open the resulting `.bbmodel` projects in Blockbench. The input manifest pins every model, texture and pose implementation used. The initial observed projects had random UUIDs; the committed generator uses deterministic UUIDs. Equality of all scene data after UUID normalization was checked and is recorded in [the receipt](receipt.json). Two independent generation runs produced identical outputs.

Executed against W201:

- `python tools/test_freezer_java_art.py`: 6 passed.
- `node --test tests/freezer-result-height.test.mjs tests/freezer-state.test.mjs tests/freezer-input.test.mjs tests/freezer-output.test.mjs tests/freezer-milk.test.mjs`: 43 passed.
- Generator Python compilation, pose-script syntax check and deterministic double generation passed.

These are focused source/editor checks, not a full native gameplay or client pass. CI retains its normal required coverage for the evidence/tooling change.

## Still unverified or unimplemented

The pre-existing generic ItemStack display gap remains: Java accepts and renders arbitrary input stacks, whereas the current visual route covers only snowball, blue dye and slime ball. Sugar, block items, potions, enchantment glint and foreign attachables are not represented by these scenes. Absolute item `FIXED` UV orientation and thickness, native material tint/alpha/animation, client rendering order and actual game-client appearance remain unverified. See [the earlier freezer renderer review](../../audit/FREEZER-VISUAL-REVIEW-20261024.md) for the source-backed generic-renderer work, keeping its historical source version distinct.
