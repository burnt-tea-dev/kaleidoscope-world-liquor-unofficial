# World Liquor 0.1.147

Client reports exposed unresolved custom materials for the freezer's water,
lava, milk and magma surfaces. Their existing animated material definitions now
use the standard `materials/entity.material` registry entry. Source checks verify
the client entity, render-controller alias and builtin inheritance chains.

Material bytes, textures, alpha, UV animation, frame timing, recipes and saved
storage are preserved. Both packs require Tavern 0.6.169; Grilling 2.8.144 remains
an optional source-check peer. See the [scoped source evidence](evidence/freezer-material-registry-20261015.md).

Actual restored client rendering and complete family admission remain pending.
Source checks do not constitute rendered-client acceptance or full Java parity.
