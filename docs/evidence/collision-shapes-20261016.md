# Source-backed collision restoration

This repair restores 34 current block definitions from the maintained author
[World Liquor 1.1.11 / NeoForge 1.21.1 archive](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066406),
SHA256 `e1f51736138bfe65ac1ce2aae2f2f3bd292dce71e2b8d2f18580a68bdea807cc`.
The archive was downloaded once for read-only comparison and was never installed.

- Freezer collision and selection use the original north bounds
  `[0,0,1]..[16,12,14]`, carried through all four existing facing rotations.
  The previous full-height physical cube and oversized selection are removed.
- Seven cocktail cups inherit Tavern `CocktailBlock → GlasswareBlock`, whose
  collision-enabled default properties and `[4,0,4]..[12,10,12]` shape were reviewed.
  Their former disabled physical collision and oversized selection are replaced.
- Sixteen stools retain the original bottom support, narrow column and seat as
  three physical boxes. Empty air beside the column is traversable again.
  Bedrock selection retains the existing single union AABB.
- All ten current cabinets are covered: five woods each with a bar and cellar
  cabinet. Both original classes explicitly return `FULL_SAFE_SHAPE`; physical
  and selection boxes preserve their `0.001..15.999` safe inset in JSON.

Stable Bedrock supports arrays of collision boxes without experiments from 1.26.0;
the current pack format is 1.26.50. This follows the [official component documentation](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_collision_box?view=minecraft-bedrock-stable).
No experiment is enabled by this repair.

The [shape witness](../../data/java-collision-shapes-20261016.json) binds archive,
class-member and dependency-source hashes. The original static `Block.box`
bytecode was read directly for freezer, chair and both cabinet classes; property
registrations, inherited collision and shape overrides were checked separately.
The targeted check compares exported dimensions and freezer rotations, rejects
shape broadening and unrelated gameplay changes, and proves every historical
projection restores the exact immutable W148 file. Earlier failure evidence and
historical baseline ledgers remain unchanged.

Models, textures, freezer recipes/timing/contents, cabinet slot layout, seating and
saved identities are unchanged. Native floating precision for the cellar inset,
entity contact, current-client aiming and human gameplay acceptance remain pending.
Source checks do not certify rendered gameplay; `client=false`.
