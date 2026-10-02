# World Liquor 0.1.52 — recover the native HUD

The old registered file redefined hud.root_panel with modifications only and made the owner's client lose its complete HUD. This version removes that declaration and uses only the fully typed kaleidoscope_world_liquor_effects.effect_panel in its own namespace. Tavern 0.6.88 mounts it through a unique optional variable, with a concrete empty fallback for Tavern-only worlds.

All 15 original PNGs remain unchanged. The new structural regression preserves the native HUD type and 29 controls and rejects the old failing definition. Native BDS and client rendering are separate; actual human acceptance remains pending. Both BP/RP and guide identity are synchronized with Tavern 0.6.88.
