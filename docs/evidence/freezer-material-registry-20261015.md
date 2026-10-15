# W147 freezer material registry repair

The W146 client reported that `freezer_water`, `freezer_lava`,
`freezer_milk_still` and `freezer_magma` could not resolve
`kwl_freezer_animated_alphablend` / `kwl_freezer_animated_alphatest`; their render
controllers consequently rejected `Material.default` from the friendly list.
The definitions existed only in `materials/freezer_surface.material`, while the
client entity material registry uses the standard `materials/entity.material`
entry. W147 moves the exact existing definition bytes to that entry and updates
the authoring generator. It does not replace the animated surfaces with static
materials.

The two definitions retain their `entity_alphablend` / `entity_alphatest`
parents and `USE_UV_ANIM`. The current official [material file
reference](https://learn.microsoft.com/en-us/minecraft/creator/documents/material-files?view=minecraft-bedrock-stable)
describes the string `materials.version`, inherited material names and additive
defines. The official [entity performance
example](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/improvingperformanceandresourceusage?view=minecraft-bedrock-stable)
uses `USE_UV_ANIM` with a render-controller `uv_anim`. Source validation cannot
prove shader compilation or rendering on a particular RenderDragon client.

Targeted source checks:

- `python tools/entity_material_registry.py` resolves both custom materials,
  all 22 World Liquor client-entity/attachable records and 22 material references,
  including the existing Tavern furniture render controller supplied by the
  explicit paired provider. Unknown parents, cycles and missing friendly aliases
  are rejected.
- `python tools/test_entity_material_registry.py` passes four cases covering the
  standard entry, the prior unloaded basename, unresolved/cyclic inheritance and
  missing client/render-controller aliases. CI runs these cases in its existing
  source-check step.
- `python tools/freezer_surface_animation.py` checks all four actual source-bound
  animated surfaces against the generator. The new material file is byte-equal
  to W146's previous file (SHA256
  `a49a59442f385b9dadc19def017c274584f917e978a0bf905a55ca028d9e66c4`).
- The runtime diff contains that exact rename, paired manifests and the payload
  version. Texture pixels, alpha, geometry, UV selectors/frame cadence, gameplay
  scripts, recipes and saved ownership remain unchanged.

W147 pairs with Tavern T169 source
`08ccd47b93dc60dd0b935a8d5e812d4195858e9d`; the optional Grilling G144 source
peer remains `b0267c295305a1bc6a0c1e6a0c01e3f812b149f1`. Existing W146
performance changes and historical evidence retain their original identities.
The earlier standalone `header.version: invalid string` client line lacked pack
context and is not attributed to this material entry; material schema version
and numeric pack header versions are different fields.

Acceptance remains pending: load the exact complete family on the reporting
client, confirm these undefined-material/friendly-list errors disappear, and
observe water, lava, milk and magma on the freezer throughout animation and
result-height transitions. This record reports source checks only:
`client=false`, `production_ready=false`, `pending_client_acceptance`.
