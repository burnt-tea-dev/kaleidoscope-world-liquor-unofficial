# World Liquor item contexts, 2026-10-02

Candidate0.1.47 pairs with Tavern0.6.84. All156 item IDs are classified:
129 generated sprites retain their icons;27 furniture items use actual native geometry
with the tracked Java source's GUI, first/third-person hands, ground, fixed and head
transforms. GUI automatic fitting is disabled; omitted left-hand poses inherit right.

Cabinets use the SINGLE permutation geometry and per-wood atlas for item rendering,
not the placed block's base LEFT variant. World shapes, UVs, connected permutations,
materials, placement behavior, item IDs, recipes and effects remain unchanged.
All modified geometry declares version1.21.0 for item_display_transforms support.

`tools/item_render_contract.py` runs in the aggregate gate. Original bone hashes
protect mesh/UV topology; native-pick, creative-catalog and historical storage gates
remain active. This is source/routing validation, not native Minecraft visual proof.

Limitations: this repository's tracked art is historical Java1.1.8. The separately
verified1.1.9 freezer texture/topology and some furniture face removals remain open.
Do not call the old mesh latest-Java parity. Per-GUI front lighting,27 offline guide
thumbnails, dynamic freezer content, cabinet display categories and real client
inventory/held/dropped/framed appearance also remain open. All129 original sprite
pixels match the audited1.1.9 source, but that alone does not prove engine routing.

No production/live deployment or simulated players.
