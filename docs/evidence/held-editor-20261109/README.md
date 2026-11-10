# World Liquor held-editor review and recovery

## Available evidence

This folder preserves the successful GitHub objects from the interrupted 2026-11-09 review of World Liquor 0.1.208, commit `a470278b8a165432ea5fb246844b0da2b685cde2`. The ten contact sheets are the original uploaded JPEG bytes, not newly rendered replacements.

- [Native views 1](contacts/native-1.jpg), [2](contacts/native-2.jpg), [3](contacts/native-3.jpg), [4](contacts/native-4.jpg), [5](contacts/native-5.jpg), [6](contacts/native-6.jpg), [7](contacts/native-7.jpg): all 27 native Bedrock furniture bindings in first-/third-person left/right Display contexts, 108 views.
- [Java source views](contacts/source-1.jpg): white stool, oak bar cabinet, oak cellar cabinet and freezer in the same four contexts, 16 views.
- [Sprite bindings](contacts/sprites.jpg): 132 runtime texture bindings displayed on editor planes, not native held-item extrusion or use-animation acceptance.
- [Texture playback samples](contacts/animations.jpg): two actual Blockbench playback samples each for water, lava, milk and legacy magma. Sampled editor playback is not all-frame or Minecraft-engine validation.

The recovered source/coverage files retain their original bytes. [Historical report](historical-report.md) records the work actually performed on November 9; it is a historical record, not a claim that all referenced files survived. [Capture manifest](capture-manifest.json) retains hashes of the original 140 PNGs. [Input manifest](input-manifest.json) retains the source and generated-project hashes. [Sprite comparison](sprite-source-comparison.json) records 132 exact decoded-RGBA matches to the pinned Java layers.

## Recovery boundary, 2026-11-10

The original review checkout, raw PNG directory and local commit `cd43b2d` are not present in the currently accessible workspace. No original review branch or PR was found. The 9,502,642-byte `desktop-captures.zip` and the `review-scenes.zip` GitHub blobs return 404; no corresponding Space file was found. Those two archives are **not included or claimed recovered**. The earlier report's statements that they are included describe its lost local bundle only. Do not treat the contact sheets as full-resolution originals.

No new GUI session is counted by recovery. The original record reports 39 opened projects and 140 captures, including four setup captures, with the limitations below. Recreated fixtures or tests must be identified separately and must not be represented as restored raw screenshots.

## Findings and limits

All inspected furniture bindings were assembled and textured in the observed native editor views. First-person lower-edge cropping also occurs in the representative Java-source views, so no speculative pose offsets were applied. The source display contract matched all 108 pose pairs. All 96 geometries, containing 5,069 rendered faces, had zero same-facing positive-area conflicts within 0.025 model units in the static scan. The 531 opposite-facing near-plane contacts require culling/material context and were not automatically removed.

No runtime model or animation fix was evidenced. The intended tooling change expands the existing surface guard beyond its former 67 drink models, with a counterfactual duplicate stool test. The November 9 aggregate check passed using the exact release-pinned Tavern 0.6.217 peer `26485c710f96612881f2a6c1bbfa9033d62d144b`; recovery does not substitute that past run for fresh validation of restored code.

No Minecraft client, user desktop, BDS or LIVE world was tested or changed. Native eating/drinking and multi-pack player blending remain unverified. Static meshes and sampled Blockbench texture playback cannot certify all engine alpha sorting, camera distances, intersecting entities or temporal flicker. Runtime, version and dependencies remain unchanged.
