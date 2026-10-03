# World Liquor 0.1.55 — paired dependencies and compact texture paths

Retain the Tavern 0.6.90 dependency alignment tested in unpublished local candidate 0.1.54. Shorten twelve Bacardi Carta Blanca, Bamboo Leaf Green Liquor and Bombay Sapphire Gin generated texture paths from 101–106 to 79–84 pack-relative characters. Original image bytes, geometry, public terrain aliases, items, recipes and UUIDs remain unchanged.

Mojang Minecraft Creator Tools 0.19.0 exposed the portability risk; no observed client failure is inferred solely from that warning. The canonical authoring normalizer is idempotent and collision-safe, and packaging only verifies/copies source. Its byte-preservation receipt and five regression tests protect the change against regeneration.

The earlier 0.1.54 local immutable claim/history is retained, not rewritten. This candidate still requires combined-family/editor/runtime gates and actual human visual acceptance separately; no live deployment or full Java parity claim.

Verification completed: five texture-path regressions; full paired release/guide/storage checks; canonical history/export; bridge GUI export byte equality for all 816 files; official MCT PATHLENGTH changed from 12 errors to success. Combined family native probes passed on BDS1.26.52.3 with explicit test overlays and no logged errors. Human client and saved-world acceptance remain open. See the paired Tavern docs/DEVELOPMENT-TOOLS-AUDIT-20261003.md for exact scope and report hashes.
