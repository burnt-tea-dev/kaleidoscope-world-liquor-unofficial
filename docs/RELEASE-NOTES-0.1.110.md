# 0.1.110: current author Dassai data and cocktail art

Drinking or mixing Dassai Q3–Q6 previously supplied Luck amplifiers 0/1/2/3.
Both current author [Forge1.1.12 CF9066402](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066402)
and maintained [NeoForge1.1.11 CF9066406](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9066406)
use 1/3/5/7. Direct drink content, host registration, Q4–Q6 mixology inputs and
all three guide locales now carry the original values. Duration remains
80/240/720/2160 seconds; guide levels are amplifier+1, therefore 2/4/6/8.
Native Java Luck attributes and loot remain unimplemented. This numeric
correction does not turn an unsupported native effect into a working loot effect.

Four placed cups now derive from current author models and their matching
textures: Around the World adds the second rotated garnish sheet; Jerk changes
the garnish position/rotation/UV; Long Island removes three zero-UV faces
across two inverted boxes; Shrimp Cocktail shifts three garnish pieces by
source X+0.2. Around the World and Jerk inventory sprites also use the authored
current images. Unique geometry IDs, cup IDs, materials and existing atlas paths
remain stable. Original Java UV/rotations pass through the existing converter;
the established host thin-sheet separation is retained as a documented Bedrock
rendering adapter. This is source-derived art, not rendered-client acceptance.

Both BP/RP, modules, own RP dependency, package identity and guide payload
advance to 0.1.110, paired with reviewed Tavern 0.6.132 and optional Grilling
2.8.119. Existing UUIDs and saved ownership remain; no identity migration is
introduced. All W108/T131 helper repairs and earlier input preservation remain.

The latest Forge archive's 18 shaker recipes and five freezer recipes agree
with the maintained NeoForge source after the result.item/result.id schema
conversion. Current runtime freezer fluid/name/predicate adapters are explicit.
All 25 effect data files agree across those author branches; current runtime
now matches all 25 after the existing smc namespace aliases. All six original
OGG samples already match current author bytes. The detailed source and
selected-member review is [current-author-review-20261009.json](../data/current-author-review-20261009.json).
Author archives and raw source comparisons stay outside the public repository.

Existing source, host mixology, storage-preservation, seven-entrance guide and
item-render checks cover this change. `update_current_cocktail_art.py` rebuilds
only the selected four cups and checks source topology/UV/decoded pixels;
full required checks run in CI. Historical preservation witnesses remain
unchanged, with exact reviewed deltas in test-only layers; those predecessor
bytes are never exported. Full-family native loading, stopped-world preservation
and LIVE deployment retain their own receipts and admission gates.

Human test: compare all four placed cups from four sides and inventory icons
with the stated author branch; inspect Dassai guide levels 2/4/6/8. Actual
transparency, depth, lighting, hand views and human drink/mixology interactions
remain pending. Forge event phases, cabinet automation, Create/Jade/SMC and
TreasureSense tracking remain incomplete. NeoForge26 custom Luck, drop copying
and different registered effects remain a separate unported branch; they do
not replace the maintained 1.21.1 semantics. Keep client=false,
production_ready=false and pending_client_acceptance until real acceptance.

The two unpublished W109 candidates are preserved in their original Git histories and claims. PR89 retains its reviewed T132 pairing; the other source/art candidate59c93734870ae00c182233873d4a291b26128042 is preserved on canonical evidence/w109-author-adaptation-20261009. Their identities are not installed interchangeably. This release uses the fresh W110 identity.
