# 0.1.104: compact texture paths and shipped notices

Fresh-backports the twelve compact texture path names from reviewed PR33/36/37 onto current W103. Only PNG filenames and the matching terrain/client-entity reference strings change; all source artwork, public terrain aliases, geometry and gameplay remain. The existing converter ends with the same explicit authoring normalization; direct packaging never rewrites source. Narrow test-only path projection preserves prior storage references and rejects changes beyond the declared mapping.

Both installed packs now carry their existing code/art/third-party notices, including MIT port code, BSD-3-Clause Tavern code, CC BY-NC-SA art attribution and original publisher assets. Cookery1.6.0 is optional. ZIP creator metadata is fixed for cross-platform reproducible packaging, and current README commands are separated from old source generators/install history.

Fresh0.1.104 modules/pack pair/guide payload and exact Tavern0.6.127 dependencies. Targeted path and source-storage checks pass; client texture resolution, glass/materials and all view contexts remain pending. Full canonical CI and complete-family native/saved-world/admission gates precede owner-requested LIVE development deployment. client=false; production_ready=false.
