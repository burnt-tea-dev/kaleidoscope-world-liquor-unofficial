# Restore World Liquor alcohol recipe membership

This is a source repair candidate, not a release or native crafting acceptance.

## Player-visible regression

The native custom-record recipe requires nine items tagged
`kaleidoscope_tavern:alcohol`. The current author's NeoForge 1.1.12 resources
include 14 World Liquor bottle types in that tag. Their six Bedrock quality IDs
were all missing it: 84 eligible items failed the native resource predicate.
Nine Absolut Vodka Q1 bottles are a concrete before/after counterexample.
The four non-alcoholic drinks, 24 quality IDs, must remain ineligible.

The existing mixology updater replaced the entire native tag list with its
cocktail-color additions. It now removes only explicit removals and appends
unique additions, preserving unrelated recipe tags. The 84 runtime changes
only append alcohol; existing cocktail tags and all other components are intact.

## Source and ownership

- Official current [NeoForge 1.1.12, file 9217896](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9217896).
- The official files index was refreshed on 2026-11-13: NeoForge 1.21.1 remains
  1.1.12; Forge 1.20.1 remains 1.1.13. This implementation checks the NeoForge resources.
- `data/kaleidoscope_tavern/tags/item/alcohol.json` is byte-identical to the
  tracked resource. The recipe's type, nine predicates and result agree; the
  current Java recipe additionally declares `category: misc`.
- `source-receipt.json` pins the JAR, resource hashes, exact main and peer.
- `runtime-delta-audit.json` lists all 84 semantic deltas.

The existing `drink_content_contract.py` now checks all 108 complete native
bottle definitions against source tag membership and the preserved Bedrock
consumption, quality, display, stack and creative-menu contract. The obsolete
108 whole-file projection rows are removed from baseline-reconciliation.
Unrelated entries/layers, original historical tree witnesses, release hashes,
version guards and geometry limits remain unchanged. This is not a hash update
or a tag-only exemption.

## Executed validation

- Independent official-JAR check: before 84 missing/0 extra; after 0 missing/0 extra.
- Six focused regressions pass, covering all 108 bottle IDs, 86 positive nine-slot
  grids, 24 negative grids, exact recipe result, existing cocktail tags, selective
  remove/add, deduplication and idempotence. These are resource-predicate checks,
  not an emulated Minecraft crafting engine.
- Eight deliberate mutations to non-tag/native-definition fields or unsupported
  tags are rejected by the complete current contract.
- The old destructive updater is independently rejected by the new regression.
- Current mixology matcher: 18 source recipes × six input orders = 108 passes.
- Full `tools/check_release.py` passes with exact canonical Tavern peer
  `d4213d4322e223b2bf8f6b52cec2558af0a5b54f`: 63 blocks, 159 items, 41 recipes,
  1,350 paired geometries, zero errors. The native-tag suite is wired into it.
- Python compilation and `git diff --check` pass. Final review independently
  confirmed the runtime-only tag delta and precise retirement of the 108 rows.

Reproduce from this checkout with its exact sibling Tavern source:

```
python tools/test_native_item_tags.py
python tools/drink_content_contract.py
TAVERN_ROOT=../tavern-src node tools/check_current_mixology.mjs
TAVERN_ROOT=../tavern-src python tools/check_release.py
```

The included logs replace only environment-local source prefixes with `source`.

## Unverified / integration boundary

No BDS, native recipe UI/crafting, inventory round trip, saved-world restart or
client test was run. No RP/model/icon/animation changed, so this repair does not
need new Blockbench previews; it does not extend previous visual acceptance.
No item identifier, script, persistent storage, recipe, manifest, version or
peer pin changed. No LIVE/deployment action occurred.

The normal release baseline gate still fails with
`runtime changed without a reviewed version/hash update`. A coordinated fresh
paired release identity is required before release. No version was guessed,
reserved or frozen, and no guard was weakened. Keep the candidate Draft.
